import httpx
from datetime import datetime, timezone
from api.schemas import DomainRegistrationCheck

def _extract_base_domain(hostname: str) -> str:
    parts = hostname.split(".")
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return hostname

async def check_domain_registration(
    hostname: str,
    domain_status: str = "resolves",
    timeout: float = 2.5
) -> DomainRegistrationCheck:
    """
    Looks up domain registration via RDAP (RFC 7480).
    Never visits or fetches the target website.
    Returns 'unavailable' on lookup failure.
    """
    # IP address check
    if any(c.isdigit() for c in hostname.replace(".", "").replace(":", "")):
        parts = hostname.split(".")
        if len(parts) == 4 and all(p.isdigit() for p in parts):
            return DomainRegistrationCheck(
                status="skipped",
                summary="Skipped (IP address)"
            )

    if domain_status == "not_found":
        return DomainRegistrationCheck(
            status="unavailable",
            summary="Unavailable (domain not found in DNS)"
        )

    base_domain = _extract_base_domain(hostname)
    rdap_url = f"https://rdap.org/domain/{base_domain}"

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(rdap_url, headers={"Accept": "application/rdap+json"})

        if resp.status_code == 200:
            data = resp.json()

            # 1. Registrar extraction
            registrar_name = None
            entities = data.get("entities", [])
            for ent in entities:
                roles = ent.get("roles", [])
                if "registrar" in roles:
                    # Look for vcard
                    vcard = ent.get("vcardArray", [])
                    if len(vcard) > 1 and isinstance(vcard[1], list):
                        for prop in vcard[1]:
                            if isinstance(prop, list) and len(prop) > 3 and prop[0] == "fn":
                                registrar_name = prop[3]
                                break
                    if not registrar_name:
                        registrar_name = ent.get("handle") or ent.get("name")
                    break

            # 2. Registration / Creation date
            creation_date_str = None
            age_str = None
            events = data.get("events", [])
            for ev in events:
                action = ev.get("eventAction")
                if action in ("registration", "created"):
                    date_val = ev.get("eventDate")
                    if date_val:
                        creation_date_str = date_val[:10] # YYYY-MM-DD
                        try:
                            # Calculate domain age
                            created_dt = datetime.fromisoformat(date_val.replace("Z", "+00:00"))
                            now = datetime.now(timezone.utc)
                            diff = now - created_dt
                            years = diff.days // 365
                            if years > 0:
                                age_str = f"{years} year{'s' if years > 1 else ''} old"
                            else:
                                months = diff.days // 30
                                age_str = f"{months} month{'s' if months > 1 else ''} old" if months > 0 else f"{diff.days} days old"
                        except Exception:
                            pass
                    break

            parts = []
            if registrar_name:
                parts.append(f"Registrar: {registrar_name}")
            if creation_date_str:
                parts.append(f"Created {creation_date_str}" + (f" ({age_str})" if age_str else ""))

            if parts:
                return DomainRegistrationCheck(
                    status="available",
                    registrar=registrar_name,
                    creation_date=creation_date_str,
                    domain_age=age_str,
                    summary=", ".join(parts)
                )

        return DomainRegistrationCheck(
            status="unavailable",
            summary="Unavailable (RDAP registry lookup returned no record or unsupported TLD)"
        )

    except Exception:
        return DomainRegistrationCheck(
            status="unavailable",
            summary="Unavailable (RDAP lookup could not be completed)"
        )
