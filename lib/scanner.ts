import {
  Finding,
  ScanResponse,
  VerdictLevel,
  ChecksResult,
  UrlStructureCheck,
  DnsCheck,
  TlsCheck,
  DomainRegistrationCheck,
  LookalikeCheck,
  SafeBrowsingCheck,
  ReputationResult,
  DomainLookupResult,
} from "./types";

export const RULE_POINTS: Record<string, number> = {
  plain_http: 15,
  missing_scheme_note: 0,
  embedded_credentials: 35,
  deceptive_at_symbol: 25,
  ip_address_host: 35,
  private_or_local_ip: 20,
  non_standard_ip_encoding: 40,
  punycode_host: 25,
  mixed_script_host: 25,
  lookalike_domain: 35,
  brand_lookalike: 35,
  unusual_port: 25,
  excessive_subdomains: 20,
  very_long_hostname: 15,
  known_url_shortener: 20,
  high_risk_tld: 25,
  suspicious_keyword_alone: 10,
  suspicious_keyword_compound: 25,
  heavy_percent_encoding: 20,
  excessive_query_params: 15,
  excessive_url_length: 15,
  domain_resolves_private_ip: 20,
  domain_not_found: 0,
  invalid_tls_certificate: 25,
};

const KNOWN_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "buff.ly", "is.gd",
  "cutt.ly", "rb.gy", "tiny.cc", "shorturl.at", "bl.ink",
]);

const ABUSED_TLDS = new Set([
  "zip", "mov", "top", "xyz", "work", "loan", "click", "country", "kim",
  "science", "gq", "cf", "tk", "ml", "ga", "buzz", "surf",
]);

const HIGH_PROFILE_BRANDS = [
  "paypal", "apple", "google", "microsoft", "amazon", "netflix",
  "facebook", "instagram", "chase", "wellsfargo", "bankofamerica",
  "binance", "coinbase", "metamask", "telegram", "whatsapp", "dropbox",
];

const SUSPICIOUS_KEYWORDS = new Set([
  "login", "signin", "log-in", "sign-in", "verify", "verification",
  "secure", "security", "account", "update", "password", "credential",
  "wallet", "banking", "billing", "confirm", "authenticate", "recovery",
  "support", "unlock",
]);

const POPULAR_DOMAINS = [
  "reanime.to",
  "google.com",
  "paypal.com",
  "apple.com",
  "microsoft.com",
  "amazon.com",
  "netflix.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "linkedin.com",
  "reddit.com",
  "wikipedia.org",
  "github.com",
  "chase.com",
  "wellsfargo.com",
  "bankofamerica.com",
  "binance.com",
  "coinbase.com",
  "metamask.io",
  "telegram.org",
  "whatsapp.com",
  "dropbox.com",
  "yahoo.com",
  "bing.com",
  "ebay.com",
  "walmart.com",
  "openai.com",
  "anthropic.com",
  "discord.com",
  "twitch.tv",
  "spotify.com",
  "tiktok.com",
  "adobe.com",
  "cloudflare.com",
  "steamcommunity.com",
  "example.com",
];

const HOMOGLYPHS: Record<string, string> = {
  "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "8": "b", "@": "a",
  "а": "a", "с": "c", "е": "e", "о": "o", "р": "p", "х": "x", "у": "y",
  "і": "i", "ј": "j", "ѕ": "s",
};

export class ScannerValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 422) {
    super(message);
    this.name = "ScannerValidationError";
    this.statusCode = statusCode;
  }
}

function normalizeHomoglyphs(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((c) => HOMOGLYPHS[c] || c)
    .join("");
}

function levenshtein(s1: string, s2: string): number {
  if (s1.length < s2.length) return levenshtein(s2, s1);
  if (s2.length === 0) return s1.length;

  let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 0; i < s1.length; i++) {
    const currentRow = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      const insertions = previousRow[j + 1] + 1;
      const deletions = currentRow[j] + 1;
      const substitutions = previousRow[j] + (s1[i] !== s2[j] ? 1 : 0);
      currentRow.push(Math.min(insertions, deletions, substitutions));
    }
    previousRow = currentRow;
  }
  return previousRow[previousRow.length - 1];
}

function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("127.")) return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.")) return true;
  if (ip.startsWith("0.")) return true;

  const parts = ip.split(".").map(Number);
  if (parts.length === 4) {
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  }
  return false;
}

function isIpLiteral(host: string): boolean {
  const clean = host.replace(/^[\[]|[\]]$/g, "");
  // IPv4 check
  const parts = clean.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255)) {
    return true;
  }
  // IPv6 check
  if (clean.includes(":") && /^[0-9a-fA-F:]+$/.test(clean)) {
    return true;
  }
  return false;
}

function isOctalOrHexOrDecimalIp(host: string): boolean {
  if (/^\d+$/.test(host)) {
    const val = Number(host);
    if (!isNaN(val) && val >= 0 && val <= 0xffffffff) return true;
  }
  if (host.startsWith("0x") || host.startsWith("0X")) {
    const val = parseInt(host, 16);
    if (!isNaN(val)) return true;
  }
  const parts = host.split(".");
  if (parts.length >= 2 && parts.length <= 4) {
    let valid = 0;
    let hasNonDecimal = false;
    for (const part of parts) {
      if (part.startsWith("0x") || part.startsWith("0X")) {
        const val = parseInt(part, 16);
        if (!isNaN(val)) {
          valid++;
          hasNonDecimal = true;
        } else break;
      } else if (part.startsWith("0") && part.length > 1 && /^\d+$/.test(part)) {
        const val = parseInt(part, 8);
        if (!isNaN(val)) {
          valid++;
          hasNonDecimal = true;
        } else break;
      } else if (/^\d+$/.test(part)) {
        valid++;
      } else {
        break;
      }
    }
    if (valid === parts.length && hasNonDecimal) return true;
  }
  return false;
}

function hasMixedScripts(text: string): boolean {
  let hasLatin = false;
  let hasCyrillic = false;
  let hasGreek = false;

  for (const char of text) {
    const code = char.codePointAt(0) || 0;
    if ((code >= 0x0041 && code <= 0x005a) || (code >= 0x0061 && code <= 0x007a)) {
      hasLatin = true;
    } else if (code >= 0x0400 && code <= 0x04ff) {
      hasCyrillic = true;
    } else if (code >= 0x0370 && code <= 0x03ff) {
      hasGreek = true;
    }
  }

  const scriptCount = (hasLatin ? 1 : 0) + (hasCyrillic ? 1 : 0) + (hasGreek ? 1 : 0);
  return scriptCount > 1;
}

export function analyzeUrlStructure(rawInput: string) {
  if (rawInput === null || rawInput === undefined) {
    throw new ScannerValidationError("URL cannot be null");
  }

  const strippedInput = rawInput.trim();
  if (!strippedInput) {
    throw new ScannerValidationError("URL cannot be empty or whitespace-only");
  }

  if (strippedInput.length > 2048) {
    throw new ScannerValidationError(`URL exceeds maximum allowed length of 2048 characters (received ${strippedInput.length})`);
  }

  const lowerInput = strippedInput.toLowerCase();
  for (const forbidden of ["javascript:", "data:", "file:", "vbscript:", "about:"]) {
    if (lowerInput.startsWith(forbidden)) {
      throw new ScannerValidationError(`Unsupported URL scheme '${forbidden.slice(0, -1)}'. Only 'http' and 'https' are allowed.`);
    }
  }

  const findings: Finding[] = [];
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(strippedInput);
  let workingUrl = strippedInput;

  if (!hasScheme) {
    workingUrl = "https://" + strippedInput;
    findings.push({
      id: "missing_scheme_note",
      title: "No Scheme Provided",
      severity: "info",
      points: RULE_POINTS.missing_scheme_note ?? 0,
      explanation: "No scheme provided, analyzed as https://",
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(workingUrl);
  } catch (err: unknown) {
    throw new ScannerValidationError(`Malformed URL structure: ${err instanceof Error ? err.message : String(err)}`);
  }

  const scheme = parsed.protocol.replace(":", "").toLowerCase();
  if (scheme !== "http" && scheme !== "https") {
    throw new ScannerValidationError(`Invalid URL scheme '${scheme}'. Only 'http' and 'https' are allowed.`);
  }

  if (hasScheme && scheme === "http") {
    findings.push({
      id: "plain_http",
      title: "Insecure Transport (Plain HTTP)",
      severity: "low",
      points: RULE_POINTS.plain_http,
      explanation: "The URL uses unencrypted plain HTTP instead of HTTPS, exposing communication to interception and tampering.",
    });
  }

  if (parsed.username || parsed.password) {
    findings.push({
      id: "embedded_credentials",
      title: "Embedded User Credentials in Host",
      severity: "high",
      points: RULE_POINTS.embedded_credentials,
      explanation: "The URL contains embedded username/password credentials (user:pass@host). This is a legacy pattern often used in phishing.",
    });
  } else if (rawInput.includes("@")) {
    findings.push({
      id: "deceptive_at_symbol",
      title: "Deceptive Userinfo Symbol (@)",
      severity: "medium",
      points: RULE_POINTS.deceptive_at_symbol,
      explanation: "The URL uses the '@' symbol in the authority component. Browsers ignore everything before '@' and route only to the host after it, a classic tactic to visually mimic legitimate brands.",
    });
  }

  let host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) {
    throw new ScannerValidationError("URL does not contain a valid hostname");
  }

  const port = parsed.port ? parseInt(parsed.port, 10) : null;
  const isPunycode = host.includes("xn--");

  if (isOctalOrHexOrDecimalIp(host)) {
    findings.push({
      id: "non_standard_ip_encoding",
      title: "Non-Standard IP Address Encoding",
      severity: "high",
      points: RULE_POINTS.non_standard_ip_encoding,
      explanation: `Host '${host}' uses integer, octal, or hexadecimal IP address encoding, a stealth technique commonly used to bypass static domain blocklists.`,
    });
  }

  if (isIpLiteral(host)) {
    findings.push({
      id: "ip_address_host",
      title: "IP Address Used as Hostname",
      severity: "medium",
      points: RULE_POINTS.ip_address_host,
      explanation: `The URL targets a direct IP address (${host}) rather than a registered domain name. Legitimate services typically use domain names with trusted certificates.`,
    });

    if (isPrivateIp(host)) {
      findings.push({
        id: "private_or_local_ip",
        title: "Private or Local IP Range",
        severity: "medium",
        points: RULE_POINTS.private_or_local_ip,
        explanation: `The destination address (${host}) resides within private, loopback, or internal network address space (RFC 1918 / RFC 5735).`,
      });
    }
  } else if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    findings.push({
      id: "private_or_local_ip",
      title: "Localhost Target",
      severity: "medium",
      points: RULE_POINTS.private_or_local_ip,
      explanation: "The URL targets localhost, which is only accessible within the local computer environment.",
    });
  }

  if (isPunycode) {
    findings.push({
      id: "punycode_host",
      title: "Internationalized Domain (Punycode)",
      severity: "medium",
      points: RULE_POINTS.punycode_host,
      explanation: `The hostname uses punycode encoding ('${host}'). Punycode can be used in homograph attacks to impersonate trusted brand names.`,
    });
  }

  if (hasMixedScripts(host)) {
    findings.push({
      id: "mixed_script_host",
      title: "Mixed-Script / Homoglyph Characters",
      severity: "high",
      points: RULE_POINTS.mixed_script_host,
      explanation: `The decoded hostname '${host}' combines characters from multiple different writing scripts (e.g., Cyrillic and Latin), a strong indicator of homoglyph spoofing.`,
    });
  }

  if (port !== null && port !== 80 && port !== 443) {
    findings.push({
      id: "unusual_port",
      title: `Non-Standard Port (${port})`,
      severity: "medium",
      points: RULE_POINTS.unusual_port,
      explanation: `The URL specifies custom port ${port} instead of standard web ports (80 HTTP, 443 HTTPS).`,
    });
  }

  const hostLabels = host.split(".").filter(Boolean);
  if (hostLabels.length > 4) {
    findings.push({
      id: "excessive_subdomains",
      title: "Excessive Subdomain Depth",
      severity: "low",
      points: RULE_POINTS.excessive_subdomains,
      explanation: `The hostname contains ${hostLabels.length} levels. Unusually deep subdomain trees are frequently used by phishing kits to conceal true domain destinations.`,
    });
  }

  if (host.length > 50) {
    findings.push({
      id: "very_long_hostname",
      title: "Unusually Long Hostname",
      severity: "low",
      points: RULE_POINTS.very_long_hostname,
      explanation: `The hostname length is ${host.length} characters. Very long hostnames are commonly generated by domain generation algorithms (DGA) or deceptive phishing kits.`,
    });
  }

  if (KNOWN_SHORTENERS.has(host)) {
    findings.push({
      id: "known_url_shortener",
      title: "URL Shortening Service",
      severity: "low",
      points: RULE_POINTS.known_url_shortener,
      explanation: `Host '${host}' is a known URL shortener. Shorteners mask the ultimate destination, preventing pre-click domain inspection.`,
    });
  }

  const tld = hostLabels[hostLabels.length - 1] || "";
  if (ABUSED_TLDS.has(tld)) {
    findings.push({
      id: "high_risk_tld",
      title: `Historically Abused TLD (.${tld})`,
      severity: "low",
      points: RULE_POINTS.high_risk_tld,
      explanation: `The top-level domain '.${tld}' has a documented statistical correlation with elevated spam, malware, or phishing campaigns.`,
    });
  }

  const urlFullText = `${host}${parsed.pathname}`.toLowerCase();
  const matchedKeywords = Array.from(SUSPICIOUS_KEYWORDS).filter((kw) => urlFullText.includes(kw));

  const baseDomain = hostLabels.length >= 2 ? hostLabels.slice(-2).join(".") : host;
  const subdomainAndPath =
    (hostLabels.length > 2 ? hostLabels.slice(0, -2).join(".") : "") + parsed.pathname.toLowerCase();

  for (const brand of HIGH_PROFILE_BRANDS) {
    if (subdomainAndPath.includes(brand)) {
      if (!baseDomain.startsWith(brand + ".")) {
        findings.push({
          id: "brand_lookalike",
          title: `Brand Lookalike Pattern (${brand.charAt(0).toUpperCase() + brand.slice(1)})`,
          severity: "high",
          points: RULE_POINTS.brand_lookalike,
          explanation: `The brand name '${brand}' appears in the subdomains or path while the registered base domain is '${baseDomain}', a hallmark pattern of credential phishing.`,
        });
        break;
      }
    }
  }

  if (matchedKeywords.length > 0) {
    const hasCompoundSignals = findings.some((f) =>
      ["plain_http", "ip_address_host", "unusual_port", "brand_lookalike", "high_risk_tld"].includes(f.id)
    );
    if (hasCompoundSignals || matchedKeywords.length >= 2) {
      findings.push({
        id: "suspicious_keyword_compound",
        title: "Suspicious Security Keywords in Context",
        severity: "medium",
        points: RULE_POINTS.suspicious_keyword_compound,
        explanation: `Found sensitive keywords (${matchedKeywords.slice(0, 4).join(", ")}) in the URL combined with other security risks (e.g. unencrypted transport, custom port, or lookalike patterns).`,
      });
    } else {
      findings.push({
        id: "suspicious_keyword_alone",
        title: "Sensitive Keyword in URL",
        severity: "low",
        points: RULE_POINTS.suspicious_keyword_alone,
        explanation: `The URL path contains security-sensitive keyword(s): ${matchedKeywords.slice(0, 3).join(", ")}.`,
      });
    }
  }

  const percentMatches = (parsed.pathname + parsed.search).match(/%[0-9a-fA-F]{2}/g) || [];
  if (percentMatches.length > 5) {
    findings.push({
      id: "heavy_percent_encoding",
      title: "Heavy Percent-Encoding / Obfuscation",
      severity: "low",
      points: RULE_POINTS.heavy_percent_encoding,
      explanation: `The URL contains ${percentMatches.length} percent-encoded characters, often utilized to evade simple signature filters.`,
    });
  }

  const queryParamsCount = Array.from(parsed.searchParams.keys()).length;
  if (queryParamsCount > 8) {
    findings.push({
      id: "excessive_query_params",
      title: "Excessive Query Parameters",
      severity: "low",
      points: RULE_POINTS.excessive_query_params,
      explanation: `The URL carries ${queryParamsCount} query parameters, which may indicate tracking payloads or complex redirect chaining.`,
    });
  }

  if (workingUrl.length > 250) {
    findings.push({
      id: "excessive_url_length",
      title: "Excessive URL Length",
      severity: "low",
      points: RULE_POINTS.excessive_url_length,
      explanation: `The total URL length is ${workingUrl.length} characters. Extremely long URLs are frequently used in token harvesting and exploit deliveries.`,
    });
  }

  let normNetloc = host;
  if (port && !((scheme === "http" && port === 80) || (scheme === "https" && port === 443))) {
    normNetloc = `${host}:${port}`;
  }
  const normPath = parsed.pathname || "/";
  const normalizedUrl = `${scheme}://${normNetloc}${normPath}${parsed.search}`;

  return {
    inputUrl: strippedInput,
    normalizedUrl,
    host,
    port,
    scheme,
    path: normPath,
    hasCredentials: Boolean(parsed.username || parsed.password || rawInput.includes("@")),
    initialFindings: findings,
  };
}

export async function checkDns(hostname: string): Promise<{ result: DomainLookupResult; findings: Finding[] }> {
  const findings: Finding[] = [];

  if (isIpLiteral(hostname)) {
    return {
      result: {
        status: "skipped",
        message: "Not checked (IP address)",
        ips: [hostname],
      },
      findings,
    };
  }

  try {
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`;
    const res = await fetch(dohUrl, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      throw new Error(`DoH query failed with status ${res.status}`);
    }

    const data = (await res.json()) as {
      Status: number;
      Answer?: Array<{ type: number; data: string }>;
    };

    if (data.Status === 3) {
      findings.push({
        id: "domain_not_found",
        title: "Domain Does Not Resolve (NXDOMAIN)",
        severity: "info",
        points: 0,
        explanation: "The domain could not be resolved in public DNS. It may be mistyped, nonexistent, or taken down.",
      });

      return {
        result: {
          status: "not_found",
          message: "Domain not found, this site may not exist",
          ips: [],
        },
        findings,
      };
    }

    const resolvedIps = (data.Answer || [])
      .filter((a) => a.type === 1) // Type A
      .map((a) => a.data);

    let hasPrivate = false;
    for (const ip of resolvedIps) {
      if (isPrivateIp(ip)) {
        hasPrivate = true;
        break;
      }
    }

    if (hasPrivate) {
      findings.push({
        id: "domain_resolves_private_ip",
        title: "Domain Resolves to Private or Loopback IP",
        severity: "medium",
        points: RULE_POINTS.domain_resolves_private_ip,
        explanation: `The domain resolves to internal/private IP space (${resolvedIps.join(", ")}), which may indicate DNS rebinding or internal service scanning.`,
      });
    }

    if (resolvedIps.length === 0 && data.Status !== 0) {
      findings.push({
        id: "domain_not_found",
        title: "Domain Does Not Resolve (NXDOMAIN)",
        severity: "info",
        points: 0,
        explanation: "The domain could not be resolved in public DNS. It may be mistyped, nonexistent, or taken down.",
      });
      return {
        result: {
          status: "not_found",
          message: "Domain not found, this site may not exist",
          ips: [],
        },
        findings,
      };
    }

    return {
      result: {
        status: "resolves",
        message: "Domain resolves",
        ips: resolvedIps,
      },
      findings,
    };
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return {
      result: {
        status: isTimeout ? "timeout" : "error",
        message: isTimeout ? "Lookup timed out" : `DNS resolution error: ${err instanceof Error ? err.message : String(err)}`,
        ips: [],
      },
      findings,
    };
  }
}

export function checkLookalikeDomain(hostname: string): { check: LookalikeCheck; findings: Finding[] } {
  const findings: Finding[] = [];

  if (isIpLiteral(hostname)) {
    return {
      check: {
        name: "Lookalike check",
        status: "skipped",
        summary: "Skipped (IP address)",
        resembles: null,
      },
      findings,
    };
  }

  let cleanHost = hostname.toLowerCase();
  if (cleanHost.startsWith("www.")) {
    cleanHost = cleanHost.slice(4);
  }

  if (POPULAR_DOMAINS.includes(cleanHost)) {
    return {
      check: {
        name: "Lookalike check",
        status: "no_match",
        summary: `Legitimate popular domain (matches ${cleanHost})`,
        resembles: null,
        edit_distance: 0,
      },
      findings,
    };
  }

  for (const pop of POPULAR_DOMAINS) {
    if (cleanHost.endsWith("." + pop)) {
      return {
        check: {
          name: "Lookalike check",
          status: "no_match",
          summary: `Legitimate subdomain of ${pop}`,
          resembles: null,
        },
        findings,
      };
    }
  }

  const normHost = normalizeHomoglyphs(cleanHost);
  let bestMatch: string | null = null;
  let minDist = 999;

  for (const pop of POPULAR_DOMAINS) {
    const normPop = normalizeHomoglyphs(pop);
    if (normHost === pop || normHost === normPop) {
      bestMatch = pop;
      minDist = levenshtein(cleanHost, pop);
      break;
    }

    const d1 = levenshtein(cleanHost, pop);
    const d2 = levenshtein(normHost, pop);
    const dist = Math.min(d1, d2);
    const allowedDist = pop.length >= 8 ? 2 : 1;

    if (dist <= allowedDist && dist < minDist) {
      minDist = dist;
      bestMatch = pop;
    }
  }

  if (!bestMatch) {
    const hostParts = cleanHost.split(".");
    const baseDomain = hostParts.length >= 2 ? hostParts.slice(-2).join(".") : cleanHost;
    const subdomains = hostParts.length > 2 ? hostParts.slice(0, -2).join(".") : "";

    for (const pop of POPULAR_DOMAINS) {
      const popBrand = pop.split(".")[0];
      if (popBrand.length >= 4 && subdomains.includes(popBrand) && baseDomain !== pop) {
        bestMatch = pop;
        minDist = 0;
        break;
      }
    }
  }

  if (bestMatch) {
    findings.push({
      id: "lookalike_domain",
      title: `Lookalike Domain (Resembles ${bestMatch})`,
      severity: "high",
      points: RULE_POINTS.lookalike_domain ?? 35,
      explanation: `The domain '${hostname}' closely resembles the popular domain '${bestMatch}'. This pattern is frequently used in phishing or brand impersonation campaigns.`,
    });

    return {
      check: {
        name: "Lookalike check",
        status: "match_found",
        summary: `Resembles popular domain '${bestMatch}'`,
        resembles: bestMatch,
        edit_distance: minDist !== 999 ? minDist : null,
      },
      findings,
    };
  }

  return {
    check: {
      name: "Lookalike check",
      status: "no_match",
      summary: "No lookalike detected against known popular domains",
      resembles: null,
    },
    findings,
  };
}

export async function checkRdap(hostname: string, domainStatus: string): Promise<DomainRegistrationCheck> {
  if (isIpLiteral(hostname)) {
    return {
      name: "Domain registration",
      status: "skipped",
      summary: "Skipped (IP address)",
    };
  }

  if (domainStatus === "not_found") {
    return {
      name: "Domain registration",
      status: "unavailable",
      summary: "Unavailable (domain not found in DNS)",
    };
  }

  const parts = hostname.split(".");
  const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;

  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(baseDomain)}`, {
      headers: { Accept: "application/rdap+json" },
      signal: AbortSignal.timeout(2500),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        entities?: Array<{ roles?: string[]; vcardArray?: any[]; name?: string; handle?: string }>;
        events?: Array<{ eventAction?: string; eventDate?: string }>;
      };

      let registrarName: string | null = null;
      for (const ent of data.entities || []) {
        if (ent.roles?.includes("registrar")) {
          const vcard = ent.vcardArray;
          if (Array.isArray(vcard) && vcard.length > 1 && Array.isArray(vcard[1])) {
            for (const prop of vcard[1]) {
              if (Array.isArray(prop) && prop.length > 3 && prop[0] === "fn") {
                registrarName = prop[3];
                break;
              }
            }
          }
          if (!registrarName) {
            registrarName = ent.name || ent.handle || null;
          }
          break;
        }
      }

      let creationDate: string | null = null;
      let domainAge: string | null = null;
      for (const ev of data.events || []) {
        if (ev.eventAction === "registration" || ev.eventAction === "created") {
          if (ev.eventDate) {
            creationDate = ev.eventDate.slice(0, 10);
            try {
              const created = new Date(ev.eventDate);
              const now = new Date();
              const diffMs = now.getTime() - created.getTime();
              const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const years = Math.floor(days / 365);
              if (years > 0) {
                domainAge = `${years} year${years > 1 ? "s" : ""} old`;
              } else {
                const months = Math.floor(days / 30);
                domainAge = months > 0 ? `${months} month${months > 1 ? "s" : ""} old` : `${days} days old`;
              }
            } catch {
              // Ignore date math errors
            }
          }
          break;
        }
      }

      const summaryParts: string[] = [];
      if (registrarName) summaryParts.push(`Registrar: ${registrarName}`);
      if (creationDate) summaryParts.push(`Created ${creationDate}${domainAge ? ` (${domainAge})` : ""}`);

      if (summaryParts.length > 0) {
        return {
          name: "Domain registration",
          status: "available",
          registrar: registrarName,
          creation_date: creationDate,
          domain_age: domainAge,
          summary: summaryParts.join(", "),
        };
      }
    }

    return {
      name: "Domain registration",
      status: "unavailable",
      summary: "Unavailable (RDAP registry lookup returned no record or unsupported TLD)",
    };
  } catch {
    return {
      name: "Domain registration",
      status: "unavailable",
      summary: "Unavailable (RDAP lookup could not be completed)",
    };
  }
}

export async function checkTls(
  hostname: string,
  scheme: string,
  domainStatus: string
): Promise<{ check: TlsCheck; findings: Finding[] }> {
  const findings: Finding[] = [];

  if (domainStatus === "not_found") {
    return {
      check: {
        name: "HTTPS/TLS",
        status: "skipped",
        summary: "Skipped (domain not found)",
        valid: null,
        issuer: null,
        expiry_date: null,
        hostname_match: null,
        disclaimer: "TLS handshake only, no page content fetched",
      },
      findings,
    };
  }

  if (scheme !== "https") {
    return {
      check: {
        name: "HTTPS/TLS",
        status: "skipped",
        summary: "Skipped (plain HTTP scheme)",
        valid: null,
        issuer: null,
        expiry_date: null,
        hostname_match: null,
        disclaimer: "TLS handshake only, no page content fetched",
      },
      findings,
    };
  }

  try {
    const res = await fetch(`https://${hostname}`, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(3000),
    });

    return {
      check: {
        name: "HTTPS/TLS",
        status: "valid",
        valid: true,
        issuer: "Verified CA",
        hostname_match: true,
        summary: "Certificate valid and hostname matches (TLS handshake only, no page content fetched)",
        disclaimer: "TLS handshake only, no page content fetched",
      },
      findings,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("certificate") || message.toLowerCase().includes("cert")) {
      findings.push({
        id: "invalid_tls_certificate",
        title: "Invalid TLS/SSL Certificate",
        severity: "medium",
        points: RULE_POINTS.invalid_tls_certificate,
        explanation: `TLS certificate verification failed (${message}). This may indicate an expired certificate, self-signed certificate, or MITM interception.`,
      });
      return {
        check: {
          name: "HTTPS/TLS",
          status: "invalid",
          valid: false,
          summary: `Certificate invalid: ${message} (TLS handshake only, no page content fetched)`,
          disclaimer: "TLS handshake only, no page content fetched",
        },
        findings,
      };
    }

    return {
      check: {
        name: "HTTPS/TLS",
        status: "error",
        valid: false,
        summary: `HTTPS handshake not established (${message}; TLS handshake only, no page content fetched)`,
        disclaimer: "TLS handshake only, no page content fetched",
      },
      findings,
    };
  }
}

export async function checkReputation(
  normalizedUrl: string,
  domainStatus: string,
  apiKey?: string
): Promise<ReputationResult> {
  if (domainStatus === "not_found") {
    return {
      provider: "google_safe_browsing",
      status: "skipped",
      matches: [],
      message: "Skipped (domain not found)",
    };
  }

  if (!apiKey || !apiKey.trim()) {
    return {
      provider: "google_safe_browsing",
      status: "not_configured",
      matches: [],
      message: "Not configured",
    };
  }

  try {
    const payload = {
      client: {
        clientId: "linkshield-analyzer",
        clientVersion: "1.0.0",
      },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url: normalizedUrl }],
      },
    };

    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = (await res.json()) as { matches?: Array<{ threatType: string }> };
      const matchTypes = (data.matches || []).map((m) => m.threatType);
      if (matchTypes.length > 0) {
        return {
          provider: "google_safe_browsing",
          status: "checked",
          matches: matchTypes,
          message: `Threat detected by Google Safe Browsing: ${Array.from(new Set(matchTypes)).join(", ")}.`,
        };
      }
      return {
        provider: "google_safe_browsing",
        status: "checked",
        matches: [],
        message: "No threat matches found in Google Safe Browsing lists.",
      };
    }

    return {
      provider: "google_safe_browsing",
      status: "error",
      matches: [],
      message: `Reputation lookup failed with provider status code ${res.status}.`,
    };
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return {
      provider: "google_safe_browsing",
      status: isTimeout ? "timeout" : "error",
      matches: [],
      message: isTimeout
        ? "Reputation provider lookup timed out after 5.0s."
        : "Reputation lookup could not be completed due to a network or connection error.",
    };
  }
}

export async function executeScan(rawUrl: string, googleApiKey?: string): Promise<ScanResponse> {
  const structure = analyzeUrlStructure(rawUrl);

  // 1. Run DNS check and Lookalike check concurrently
  const [dnsCheckResult, lookalikeResult] = await Promise.all([
    checkDns(structure.host),
    Promise.resolve(checkLookalikeDomain(structure.host)),
  ]);

  const isDomainNotFound = dnsCheckResult.result.status === "not_found";

  // 2. Run TLS check, RDAP check, and Reputation check concurrently
  const [tlsCheckResult, rdapCheckResult, reputationResult] = await Promise.all([
    checkTls(structure.host, structure.scheme, dnsCheckResult.result.status),
    checkRdap(structure.host, dnsCheckResult.result.status),
    checkReputation(structure.normalizedUrl, dnsCheckResult.result.status, googleApiKey),
  ]);

  // 3. Assemble URL structure check
  const hasCreds = structure.hasCredentials;
  const portText = structure.port && ![80, 443].includes(structure.port) ? `, custom port ${structure.port}` : "";
  const credsText = hasCreds ? "embedded credentials detected" : "no embedded credentials";

  const urlStructureCheck: UrlStructureCheck = {
    name: "URL structure",
    status: hasCreds ? "warning" : "ok",
    summary: `Parsed OK (scheme: ${structure.scheme}, host: ${structure.host}${portText}, path: ${structure.path}, ${credsText})`,
    scheme: structure.scheme,
    host: structure.host,
    port: structure.port,
    path: structure.path,
    has_credentials: hasCreds,
  };

  // 4. Assemble DNS check
  let dnsSummary = dnsCheckResult.result.message;
  if (dnsCheckResult.result.status === "resolves" && dnsCheckResult.result.ips?.length) {
    dnsSummary = `Resolved to ${dnsCheckResult.result.ips.join(", ")}`;
  } else if (dnsCheckResult.result.status === "not_found") {
    dnsSummary = "Domain does not resolve (NXDOMAIN)";
  }

  const dnsCheck: DnsCheck = {
    name: "DNS",
    status: dnsCheckResult.result.status,
    summary: dnsSummary,
    ips: dnsCheckResult.result.ips || [],
  };

  // 5. Assemble Safe Browsing check
  let sbStatus: SafeBrowsingCheck["status"] = "not_configured";
  let sbSummary = "Not configured";

  if (reputationResult.status === "skipped" || isDomainNotFound) {
    sbStatus = "skipped";
    sbSummary = "Skipped (domain not found)";
  } else if (reputationResult.status === "checked") {
    if (reputationResult.matches.length > 0) {
      sbStatus = "threat_detected";
      sbSummary = `Threat detected: ${reputationResult.matches.join(", ")}`;
    } else {
      sbStatus = "clean";
      sbSummary = "No threat matches found";
    }
  } else if (reputationResult.status === "timeout") {
    sbStatus = "timeout";
    sbSummary = "Lookup timed out after 5.0s";
  } else if (reputationResult.status === "error") {
    sbStatus = "error";
    sbSummary = reputationResult.message;
  }

  const safeBrowsingCheck: SafeBrowsingCheck = {
    name: "Google Safe Browsing",
    status: sbStatus,
    summary: sbSummary,
    matches: reputationResult.matches,
  };

  const checks: ChecksResult = {
    url_structure: urlStructureCheck,
    dns: dnsCheck,
    tls: tlsCheckResult.check,
    domain_registration: rdapCheckResult,
    lookalike: lookalikeResult.check,
    safe_browsing: safeBrowsingCheck,
  };

  // Combine findings avoiding duplicates
  const allFindings: Finding[] = [];
  const seenIds = new Set<string>();

  const candidateFindings = [
    ...structure.initialFindings,
    ...dnsCheckResult.findings,
    ...lookalikeResult.findings,
    ...tlsCheckResult.findings,
  ];

  for (const f of candidateFindings) {
    if (!seenIds.has(f.id)) {
      seenIds.add(f.id);
      allFindings.push(f);
    }
  }

  const rawScore = allFindings.filter((f) => f.points > 0).reduce((acc, f) => acc + f.points, 0);
  let score: number | null = Math.min(100, Math.max(0, rawScore));

  const hasRepMatch = reputationResult.matches.length > 0;
  let verdict: VerdictLevel;

  if (isDomainNotFound) {
    verdict = "site_not_found";
  } else if (hasRepMatch) {
    verdict = "high_risk";
  } else if (score === 0) {
    verdict = "safe";
  } else if (score < 30) {
    verdict = "low_risk";
  } else if (score < 65) {
    verdict = "suspicious";
  } else {
    verdict = "high_risk";
  }

  let suggestedUrl: string | null = null;
  let summary = "";

  if (isDomainNotFound) {
    score = null;
    if (lookalikeResult.check.resembles) {
      suggestedUrl = `https://${lookalikeResult.check.resembles}`;
      summary = `This domain does not exist and may be mistyped. Did you mean ${lookalikeResult.check.resembles}?`;
    } else {
      summary = "The domain does not exist in public DNS, may be mistyped, or has been taken down.";
    }
  } else if (hasRepMatch) {
    summary = `Flagged high risk: threat detected by Google Safe Browsing (${reputationResult.matches.join(", ")}).`;
  } else if (score === 0) {
    summary = "No security issues were identified by any of the performed checks.";
  } else {
    const highF = allFindings.filter((f) => f.severity === "high" && f.points > 0);
    const medF = allFindings.filter((f) => f.severity === "medium" && f.points > 0);
    if (highF.length > 0) {
      summary = `Elevated risk identified primarily due to ${highF[0].title.toLowerCase()}${allFindings.length > 1 ? ` and ${allFindings.length - 1} other indicator(s)` : ""}.`;
    } else if (medF.length > 0) {
      summary = `Potential risk observed: ${medF[0].title.toLowerCase()}${allFindings.length > 1 ? ` alongside ${allFindings.length - 1} other signal(s)` : ""}.`;
    } else {
      summary = `Minor anomaly detected (${allFindings[0].title.toLowerCase()}) that warrants awareness.`;
    }
  }

  return {
    input_url: structure.inputUrl,
    normalized_url: structure.normalizedUrl,
    hostname: structure.host,
    verdict,
    risk_score: score,
    summary,
    findings: allFindings,
    checks,
    suggested_url: suggestedUrl,
    reputation: reputationResult,
    domain_lookup: dnsCheckResult.result,
    scanned_at: new Date().toISOString(),
  };
}
