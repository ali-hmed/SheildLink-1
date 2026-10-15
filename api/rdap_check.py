import asyncio
import ipaddress
import time
from datetime import datetime, timezone
from typing import Any
import httpx
import idna
import tldextract
from api.schemas import DomainRegistrationCheck

USER_AGENT = "ShieldLink/1.0 (Security Scanner; +https://shieldlink.dev)"
IANA_BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json"

# In-memory 24-hour cache for IANA RDAP bootstrap data
_bootstrap_cache: dict[str, str] | None = None
_bootstrap_cache_expiry: float = 0.0
_bootstrap_lock = asyncio.Lock()


def clear_bootstrap_cache() -> None:
    """Clears the in-memory IANA bootstrap cache (useful for testing)."""
    global _bootstrap_cache, _bootstrap_cache_expiry
    _bootstrap_cache = None
    _bootstrap_cache_expiry = 0.0


def set_bootstrap_cache(data: dict[str, str], ttl_seconds: float = 86400.0) -> None:
    """Sets the in-memory IANA bootstrap cache (useful for testing)."""
    global _bootstrap_cache, _bootstrap_cache_expiry
    _bootstrap_cache = data
    _bootstrap_cache_expiry = time.time() + ttl_seconds


def _is_ip_address(host: str) -> bool:
    """Checks whether the hostname is an IPv4 or IPv6 address literal."""
    clean = host.strip("[]")
    try:
        ipaddress.ip_address(clean)
        return True
    except ValueError:
        return False


def _extract_registrable_domain_and_tld(hostname: str) -> tuple[str, str]:
    """
    Normalizes hostname to punycode and uses tldextract to obtain the registrable domain and TLD.
    Example: 'www.example.com' -> ('example.com', 'com')
             'www.bbc.co.uk' -> ('bbc.co.uk', 'uk')
    """
    clean_host = hostname.strip().lower().rstrip(".")
    # Convert IDN hosts to punycode first
    try:
        puny_host = idna.encode(clean_host).decode("ascii")
    except Exception:
        puny_host = clean_host

    ext = tldextract.extract(puny_host)
    if ext.domain and ext.suffix:
        registrable_domain = f"{ext.domain}.{ext.suffix}"
        tld = ext.suffix.split(".")[-1].lower()
    else:
        registrable_domain = puny_host
        tld = puny_host.split(".")[-1].lower() if "." in puny_host else ""

    return registrable_domain, tld


async def _get_registry_base_url(tld: str, client: httpx.AsyncClient) -> str | None:
    """
    Looks up the registry base URL for a TLD using IANA bootstrap with 24-hour in-memory cache.
    Returns None if the TLD is not found in the bootstrap.
    """
    global _bootstrap_cache, _bootstrap_cache_expiry

    now = time.time()
    if _bootstrap_cache is None or now >= _bootstrap_cache_expiry:
        async with _bootstrap_lock:
            if _bootstrap_cache is None or now >= _bootstrap_cache_expiry:
                try:
                    resp = await client.get(
                        IANA_BOOTSTRAP_URL,
                        headers={"Accept": "application/json", "User-Agent": USER_AGENT},
                        timeout=8.0,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        mapping: dict[str, str] = {}
                        for entry in data.get("services", []):
                            if (
                                len(entry) >= 2
                                and isinstance(entry[0], list)
                                and isinstance(entry[1], list)
                            ):
                                tlds, urls = entry[0], entry[1]
                                chosen_url = next(
                                    (u for u in urls if u.startswith("https://")),
                                    urls[0] if urls else None,
                                )
                                if chosen_url:
                                    normalized_url = chosen_url.rstrip("/") + "/"
                                    for t in tlds:
                                        mapping[t.lower()] = normalized_url
                        _bootstrap_cache = mapping
                        _bootstrap_cache_expiry = now + 86400.0  # 24 hours
                except Exception:
                    # On bootstrap fetch error, continue with whatever cache exists or fallback
                    pass

    if _bootstrap_cache:
        return _bootstrap_cache.get(tld.lower())
    return None


def _format_age(diff_days: int) -> str:
    """Formats age in days to human readable years/months/days."""
    years = diff_days // 365
    if years > 0:
        return f"{years} year{'s' if years != 1 else ''} old"
    months = diff_days // 30
    if months > 0:
        return f"{months} month{'s' if months != 1 else ''} old"
    return f"{diff_days} day{'s' if diff_days != 1 else ''} old"


async def check_domain_registration(
    hostname: str,
    domain_status: str = "resolves",
    timeout: float = 8.0,
    http_client: httpx.AsyncClient | None = None,
) -> DomainRegistrationCheck:
    """
    Looks up domain registration via RDAP (RFC 7480).
    Never visits or fetches the target website.
    Uses IANA bootstrap with 24h caching and falls back to rdap.org.
    """
    # 1. Skip IP hosts
    if _is_ip_address(hostname):
        return DomainRegistrationCheck(
            status="skipped",
            summary="Not applicable for IP addresses",
        )

    # 2. Domain not found in DNS
    if domain_status == "not_found":
        return DomainRegistrationCheck(
            status="unavailable",
            summary="Unavailable (domain not found in DNS)",
        )

    # 3. Extract registrable domain and TLD (handling punycode and subdomains)
    registrable_domain, tld = _extract_registrable_domain_and_tld(hostname)

    headers = {
        "Accept": "application/rdap+json",
        "User-Agent": USER_AGENT,
    }

    async def _perform_lookup(client: httpx.AsyncClient) -> DomainRegistrationCheck:
        # Determine registry URL from IANA bootstrap or fallback
        registry_base = await _get_registry_base_url(tld, client)
        is_fallback = False
        if registry_base:
            rdap_url = f"{registry_base}domain/{registrable_domain}"
        else:
            is_fallback = True
            rdap_url = f"https://rdap.org/domain/{registrable_domain}"

        try:
            resp = await client.get(rdap_url, headers=headers)
        except httpx.TimeoutException:
            return DomainRegistrationCheck(
                status="unavailable",
                summary="Registry did not respond (timeout)",
            )
        except httpx.RequestError as e:
            return DomainRegistrationCheck(
                status="unavailable",
                summary="Registry did not respond (connection error)",
            )
        except Exception as e:
            return DomainRegistrationCheck(
                status="unavailable",
                summary=f"Registry did not respond ({type(e).__name__})",
            )

        # 4. Handle HTTP 200 - parse response
        if resp.status_code == 200:
            try:
                data = resp.json()
            except Exception:
                return DomainRegistrationCheck(
                    status="unavailable",
                    summary="Registry did not respond (invalid JSON)",
                )

            # Extract registrar fn
            registrar_name: str | None = None
            entities = data.get("entities", [])
            for ent in entities:
                roles = ent.get("roles", [])
                if "registrar" in roles:
                    vcard = ent.get("vcardArray", [])
                    if len(vcard) > 1 and isinstance(vcard[1], list):
                        for prop in vcard[1]:
                            if isinstance(prop, list) and len(prop) > 3 and prop[0] == "fn":
                                registrar_name = prop[3]
                                break
                    if not registrar_name:
                        registrar_name = ent.get("handle") or ent.get("name")
                    break

            # Extract events: registration, last changed, expiration
            creation_date_str: str | None = None
            last_changed_date_str: str | None = None
            expiration_date_str: str | None = None
            age_str: str | None = None
            age_days: int | None = None

            events = data.get("events", [])
            for ev in events:
                action = ev.get("eventAction")
                date_val = ev.get("eventDate")
                if not date_val:
                    continue

                short_date = date_val[:10]
                if action in ("registration", "created") and not creation_date_str:
                    creation_date_str = short_date
                    try:
                        created_dt = datetime.fromisoformat(date_val.replace("Z", "+00:00"))
                        now = datetime.now(timezone.utc)
                        diff = now - created_dt
                        age_days = max(0, diff.days)
                        age_str = _format_age(age_days)
                    except Exception:
                        pass
                elif action == "last changed" and not last_changed_date_str:
                    last_changed_date_str = short_date
                elif action == "expiration" and not expiration_date_str:
                    expiration_date_str = short_date

            summary_parts = []
            if creation_date_str:
                date_part = f"Registered {creation_date_str}"
                if age_str:
                    date_part += f" ({age_str})"
                summary_parts.append(date_part)

            if registrar_name:
                summary_parts.append(f"via {registrar_name}")

            summary = " ".join(summary_parts) if summary_parts else f"Registered domain {registrable_domain}"

            return DomainRegistrationCheck(
                status="available",
                summary=summary,
                registrar=registrar_name,
                creation_date=creation_date_str,
                domain_age=age_str,
                expiration_date=expiration_date_str,
                last_changed_date=last_changed_date_str,
                age_days=age_days,
            )

        # 5. Handle HTTP 404
        if resp.status_code == 404:
            body_text = resp.text.lower()
            # If the response indicates the TLD has no RDAP service (e.g. from rdap.org)
            if "no rdap service" in body_text or "not supported" in body_text:
                return DomainRegistrationCheck(
                    status="unavailable",
                    summary="This TLD does not publish RDAP data",
                )
            # If fallback was used and TLD had no bootstrap entry and body doesn't confirm 404 domain
            if is_fallback:
                try:
                    err_json = resp.json()
                    err_title = str(err_json.get("title", "")).lower()
                    if "no rdap service" in err_title or "not supported" in err_title:
                        return DomainRegistrationCheck(
                            status="unavailable",
                            summary="This TLD does not publish RDAP data",
                        )
                except Exception:
                    pass

            return DomainRegistrationCheck(
                status="not_found",
                summary="No registration record found for this domain",
            )

        # 6. Any other status code (5xx, 429, etc.)
        return DomainRegistrationCheck(
            status="unavailable",
            summary=f"Registry did not respond (HTTP {resp.status_code})",
        )

    if http_client is not None:
        return await _perform_lookup(http_client)

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        return await _perform_lookup(client)
