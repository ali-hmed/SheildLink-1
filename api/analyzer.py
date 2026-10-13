import ipaddress
import re
import unicodedata
from urllib.parse import urlsplit, urlunsplit, parse_qsl, unquote
from api.schemas import Finding
from api.scoring import RULE_POINTS

# Documented lists for heuristic rules
KNOWN_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "buff.ly", "is.gd",
    "cutt.ly", "rb.gy", "tiny.cc", "shorturl.at", "bl.ink"
}

ABUSED_TLDS = {
    "zip", "mov", "top", "xyz", "work", "loan", "click", "country", "kim",
    "science", "gq", "cf", "tk", "ml", "ga", "buzz", "surf"
}

HIGH_PROFILE_BRANDS = {
    "paypal", "apple", "google", "microsoft", "amazon", "netflix",
    "facebook", "instagram", "chase", "wellsfargo", "bankofamerica",
    "binance", "coinbase", "metamask", "telegram", "whatsapp", "dropbox"
}

SUSPICIOUS_KEYWORDS = {
    "login", "signin", "log-in", "sign-in", "verify", "verification",
    "secure", "security", "account", "update", "password", "credential",
    "wallet", "banking", "billing", "confirm", "authenticate", "recovery",
    "support", "unlock"
}

class ValidationError(Exception):
    def __init__(self, message: str, status_code: int = 422):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

def is_octal_or_hex_or_decimal_ip(host: str) -> bool:
    """Detects integer/hex/octal representations of IPv4 (e.g., 2130706433 or 0x7f000001 or 0177.0.0.1)."""
    # Pure decimal integer (e.g., 2130706433 = 127.0.0.1 or 0)
    if host.isdigit():
        val = int(host)
        if 0 <= val <= 0xFFFFFFFF:
            return True

    # Hex representation (e.g., 0x7f.0.0.1 or 0x7f000001)
    if host.startswith("0x") or host.startswith("0X"):
        try:
            int(host, 16)
            return True
        except ValueError:
            pass

    # Dot-separated hex or octal or mixed
    parts = host.split(".")
    if len(parts) in (2, 3, 4):
        valid_parts = 0
        has_non_decimal = False
        for part in parts:
            if part.startswith(("0x", "0X")):
                try:
                    int(part, 16)
                    valid_parts += 1
                    has_non_decimal = True
                except ValueError:
                    break
            elif part.startswith("0") and len(part) > 1 and part.isdigit():
                # octal representation
                try:
                    int(part, 8)
                    valid_parts += 1
                    has_non_decimal = True
                except ValueError:
                    break
            elif part.isdigit():
                valid_parts += 1
            else:
                break
        if valid_parts == len(parts) and has_non_decimal:
            return True

    return False

def parse_ip_safe(host: str):
    """Attempts to parse an IP address, handling standard and non-standard forms."""
    # Strip brackets if IPv6
    clean_host = host.strip("[]")
    try:
        return ipaddress.ip_address(clean_host)
    except ValueError:
        pass

    # Pure decimal integer IPv4
    if clean_host.isdigit():
        try:
            val = int(clean_host)
            if 0 <= val <= 0xFFFFFFFF:
                return ipaddress.IPv4Address(val)
        except ValueError:
            pass

    return None

def has_mixed_scripts(text: str) -> bool:
    """Checks if text contains characters from multiple distinct unicode scripts (e.g. Cyrillic + Latin)."""
    scripts = set()
    for char in text:
        if not char.isalpha():
            continue
        try:
            name = unicodedata.name(char)
            # Script identification by unicode character name prefix
            first_word = name.split()[0]
            if first_word in ("LATIN", "CYRILLIC", "GREEK", "HEBREW", "ARABIC", "DEVANAGARI", "HIRAGANA", "KATAKANA", "CJK"):
                scripts.add(first_word)
        except ValueError:
            continue
    return len(scripts) > 1

def analyze_url(raw_input: str) -> tuple[str, str, str, list[Finding]]:
    """
    Validates, normalizes, and inspects a URL strictly through static heuristic rules.
    Returns: (input_url, normalized_url, hostname, findings)
    Raises: ValidationError for invalid inputs.
    """
    # 1. Validation of raw input
    if raw_input is None:
        raise ValidationError("URL cannot be null")

    stripped_input = raw_input.strip()
    if not stripped_input:
        raise ValidationError("URL cannot be empty or whitespace-only")

    if len(stripped_input) > 2048:
        raise ValidationError(f"URL exceeds maximum allowed length of 2048 characters (received {len(stripped_input)})")

    # Check for forbidden dangerous schemes
    lower_input = stripped_input.lower()
    for forbidden in ("javascript:", "data:", "file:", "vbscript:", "about:"):
        if lower_input.startswith(forbidden):
            raise ValidationError(f"Unsupported URL scheme '{forbidden[:-1]}'. Only 'http' and 'https' are allowed.")

    findings: list[Finding] = []

    # 2. Scheme handling
    has_scheme = bool(re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", stripped_input))
    if not has_scheme:
        # Prepend http:// and add an info finding
        working_url = "http://" + stripped_input
        findings.append(Finding(
            id="missing_scheme_assumed_http",
            title="Missing URL Scheme",
            severity="info",
            points=RULE_POINTS["missing_scheme_assumed_http"],
            explanation="No URL scheme (http:// or https://) was provided. Defaulted to http:// for heuristic analysis."
        ))
    else:
        working_url = stripped_input

    # Parse URL components
    try:
        parsed = urlsplit(working_url)
    except Exception as e:
        raise ValidationError(f"Malformed URL structure: {str(e)}")

    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        raise ValidationError(f"Invalid URL scheme '{scheme}'. Only 'http' and 'https' are allowed.")

    if not parsed.netloc:
        raise ValidationError("URL does not contain a valid host or authority")

    # 3. Scheme check (Plain HTTP)
    if scheme == "http":
        findings.append(Finding(
            id="plain_http",
            title="Insecure Transport (Plain HTTP)",
            severity="low",
            points=RULE_POINTS["plain_http"],
            explanation="The URL uses unencrypted plain HTTP instead of HTTPS, exposing communication to interception and tampering."
        ))

    # 4. Credentials and deceptive @ symbol
    netloc = parsed.netloc
    if "@" in netloc:
        userinfo, hostport = netloc.split("@", 1)
        if ":" in userinfo:
            findings.append(Finding(
                id="embedded_credentials",
                title="Embedded User Credentials in Host",
                severity="high",
                points=RULE_POINTS["embedded_credentials"],
                explanation="The URL contains embedded username/password credentials (user:pass@host). This is a legacy pattern often used in phishing."
            ))
        else:
            findings.append(Finding(
                id="deceptive_at_symbol",
                title="Deceptive Userinfo Symbol (@)",
                severity="medium",
                points=RULE_POINTS["deceptive_at_symbol"],
                explanation="The URL uses the '@' symbol in the authority component. Browsers ignore everything before '@' and route only to the host after it, a classic tactic to visually mimic legitimate brands."
            ))
    else:
        hostport = netloc

    # Extract hostname and port
    host = parsed.hostname or ""
    port = parsed.port

    if not host:
        raise ValidationError("URL does not contain a valid hostname")

    # Host normalization
    # Strip trailing dot
    host = host.rstrip(".").lower()

    # Punycode decoding for display
    display_host = host
    is_punycode = False
    if "xn--" in host:
        is_punycode = True
        try:
            display_host = host.encode("ascii").decode("idna")
        except Exception:
            display_host = host

    # 5. IP Host detections
    ip_obj = parse_ip_safe(host)
    if is_octal_or_hex_or_decimal_ip(host):
        findings.append(Finding(
            id="non_standard_ip_encoding",
            title="Non-Standard IP Address Encoding",
            severity="high",
            points=RULE_POINTS["non_standard_ip_encoding"],
            explanation=f"Host '{host}' uses integer, octal, or hexadecimal IP address encoding, a stealth technique commonly used to bypass static domain blocklists."
        ))

    if ip_obj is not None:
        findings.append(Finding(
            id="ip_address_host",
            title="IP Address Used as Hostname",
            severity="medium",
            points=RULE_POINTS["ip_address_host"],
            explanation=f"The URL targets a direct IP address ({ip_obj}) rather than a registered domain name. Legitimate services typically use domain names with trusted certificates."
        ))
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved or ip_obj.is_link_local:
            findings.append(Finding(
                id="private_or_local_ip",
                title="Private or Local IP Range",
                severity="medium",
                points=RULE_POINTS["private_or_local_ip"],
                explanation=f"The destination address ({ip_obj}) resides within private, loopback, or internal network address space (RFC 1918 / RFC 5735)."
            ))
    elif host in ("localhost", "127.0.0.1", "::1"):
        findings.append(Finding(
            id="private_or_local_ip",
            title="Localhost Target",
            severity="medium",
            points=RULE_POINTS["private_or_local_ip"],
            explanation="The URL targets localhost, which is only accessible within the local computer environment."
        ))

    # 6. Punycode & Homoglyph detection
    if is_punycode:
        findings.append(Finding(
            id="punycode_host",
            title="Internationalized Domain (Punycode)",
            severity="medium",
            points=RULE_POINTS["punycode_host"],
            explanation=f"The hostname uses punycode encoding ('{host}' decodes to '{display_host}'). Punycode can be used in homograph attacks to impersonate trusted brand names."
        ))

    if has_mixed_scripts(display_host):
        findings.append(Finding(
            id="mixed_script_host",
            title="Mixed-Script / Homoglyph Characters",
            severity="high",
            points=RULE_POINTS["mixed_script_host"],
            explanation=f"The decoded hostname '{display_host}' combines characters from multiple different writing scripts (e.g., Cyrillic and Latin), a strong indicator of homoglyph spoofing."
        ))

    # 7. Port check
    if port is not None and port not in (80, 443):
        findings.append(Finding(
            id="unusual_port",
            title=f"Non-Standard Port ({port})",
            severity="medium",
            points=RULE_POINTS["unusual_port"],
            explanation=f"The URL specifies custom port {port} instead of standard web ports (80 HTTP, 443 HTTPS)."
        ))

    # 8. Host length & subdomains
    host_labels = [label for label in host.split(".") if label]
    if len(host_labels) > 4:  # e.g., a.b.c.example.com has 5 labels -> > 3 subdomains before TLD+domain
        findings.append(Finding(
            id="excessive_subdomains",
            title="Excessive Subdomain Depth",
            severity="low",
            points=RULE_POINTS["excessive_subdomains"],
            explanation=f"The hostname contains {len(host_labels)} levels. Unusually deep subdomain trees are frequently used by phishing kits to conceal true domain destinations."
        ))

    if len(host) > 50:
        findings.append(Finding(
            id="very_long_hostname",
            title="Unusually Long Hostname",
            severity="low",
            points=RULE_POINTS["very_long_hostname"],
            explanation=f"The hostname length is {len(host)} characters. Very long hostnames are commonly generated by domain generation algorithms (DGA) or deceptive phishing kits."
        ))

    # 9. Shortener check
    if host in KNOWN_SHORTENERS:
        findings.append(Finding(
            id="known_url_shortener",
            title="URL Shortening Service",
            severity="low",
            points=RULE_POINTS["known_url_shortener"],
            explanation=f"Host '{host}' is a known URL shortener. Shorteners mask the ultimate destination, preventing pre-click domain inspection."
        ))

    # 10. Abused TLDs
    tld = host_labels[-1] if host_labels else ""
    if tld in ABUSED_TLDS:
        findings.append(Finding(
            id="high_risk_tld",
            title=f"Historically Abused TLD (.{tld})",
            severity="low",
            points=RULE_POINTS["high_risk_tld"],
            explanation=f"The top-level domain '.{tld}' has a documented statistical correlation with elevated spam, malware, or phishing campaigns."
        ))

    # 11. Suspicious keywords in host / path
    url_full_text = f"{host}{parsed.path}".lower()
    matched_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in url_full_text]

    # Check for Brand lookalike pattern (e.g., brand in subdomain or path of an unrelated domain)
    # Determine base domain: last two labels if available (e.g., example.com)
    base_domain = ".".join(host_labels[-2:]) if len(host_labels) >= 2 else host
    subdomain_and_path = (".".join(host_labels[:-2]) if len(host_labels) > 2 else "") + parsed.path.lower()

    for brand in HIGH_PROFILE_BRANDS:
        # If the brand appears in subdomain or path, but base domain does NOT equal brand.tld
        if brand in subdomain_and_path:
            if not base_domain.startswith(brand + "."):
                findings.append(Finding(
                    id="brand_lookalike",
                    title=f"Brand Lookalike Pattern ({brand.capitalize()})",
                    severity="high",
                    points=RULE_POINTS["brand_lookalike"],
                    explanation=f"The brand name '{brand}' appears in the subdomains or path while the registered base domain is '{base_domain}', a hallmark pattern of credential phishing."
                ))
                break

    if matched_keywords:
        # Check if combined with other risk indicators (e.g. plain HTTP, IP host, unusual port, or brand lookalike)
        has_compound_signals = any(
            f.id in ("plain_http", "ip_address_host", "unusual_port", "brand_lookalike", "high_risk_tld")
            for f in findings
        )
        if has_compound_signals or len(matched_keywords) >= 2:
            findings.append(Finding(
                id="suspicious_keyword_compound",
                title="Suspicious Security Keywords in Context",
                severity="medium",
                points=RULE_POINTS["suspicious_keyword_compound"],
                explanation=f"Found sensitive keywords ({', '.join(matched_keywords[:4])}) in the URL combined with other security risks (e.g. unencrypted transport, custom port, or lookalike patterns)."
            ))
        else:
            findings.append(Finding(
                id="suspicious_keyword_alone",
                title="Sensitive Keyword in URL",
                severity="low",
                points=RULE_POINTS["suspicious_keyword_alone"],
                explanation=f"The URL path contains security-sensitive keyword(s): {', '.join(matched_keywords[:3])}."
            ))

    # 12. Heavy percent-encoding, excessive query params, excessive length
    percent_encoded_matches = re.findall(r"%[0-9a-fA-F]{2}", parsed.path + parsed.query)
    if len(percent_encoded_matches) > 5:
        findings.append(Finding(
            id="heavy_percent_encoding",
            title="Heavy Percent-Encoding / Obfuscation",
            severity="low",
            points=RULE_POINTS["heavy_percent_encoding"],
            explanation=f"The URL contains {len(percent_encoded_matches)} percent-encoded characters, often utilized to evade simple signature filters."
        ))

    query_params = parse_qsl(parsed.query, keep_blank_values=True)
    if len(query_params) > 8:
        findings.append(Finding(
            id="excessive_query_params",
            title="Excessive Query Parameters",
            severity="low",
            points=RULE_POINTS["excessive_query_params"],
            explanation=f"The URL carries {len(query_params)} query parameters, which may indicate tracking payloads or complex redirect chaining."
        ))

    if len(working_url) > 250:
        findings.append(Finding(
            id="excessive_url_length",
            title="Excessive URL Length",
            severity="low",
            points=RULE_POINTS["excessive_url_length"],
            explanation=f"The total URL length is {len(working_url)} characters. Extremely long URLs are frequently used in token harvesting and exploit deliveries."
        ))

    # Construct clean normalized URL
    # Format netloc properly if port specified
    norm_netloc = host
    if port and not ((scheme == "http" and port == 80) or (scheme == "https" and port == 443)):
        norm_netloc = f"{host}:{port}"

    norm_path = parsed.path or "/"
    normalized_url = urlunsplit((
        scheme,
        norm_netloc,
        norm_path,
        parsed.query,
        "" # discard fragment in normalized URL
    ))

    return stripped_input, normalized_url, host, findings
