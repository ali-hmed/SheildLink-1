import ipaddress
from api.schemas import LookalikeCheck, Finding
from api.scoring import RULE_POINTS

POPULAR_DOMAINS = [
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
]

HOMOGLYPHS = {
    "0": "o",
    "1": "l",
    "3": "e",
    "4": "a",
    "5": "s",
    "8": "b",
    "@": "a",
    "а": "a",
    "с": "c",
    "е": "e",
    "о": "o",
    "р": "p",
    "х": "x",
    "у": "y",
    "і": "i",
    "ј": "j",
    "ѕ": "s",
}

def normalize_homoglyphs(text: str) -> str:
    out = []
    for ch in text.lower():
        out.append(HOMOGLYPHS.get(ch, ch))
    return "".join(out)

def levenshtein(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]

def _is_ip(hostname: str) -> bool:
    clean = hostname.strip("[]")
    try:
        ipaddress.ip_address(clean)
        return True
    except ValueError:
        return False

def check_lookalike(hostname: str) -> tuple[LookalikeCheck, list[Finding]]:
    """
    Compares hostname against popular domains using edit distance and homoglyph normalization.
    Returns (LookalikeCheck, list[Finding]).
    """
    findings: list[Finding] = []

    if _is_ip(hostname):
        return (
            LookalikeCheck(
                status="skipped",
                summary="Skipped (IP address)",
                resembles=None
            ),
            findings
        )

    clean_host = hostname.lower()
    if clean_host.startswith("www."):
        clean_host = clean_host[4:]

    # If it is an exact match for one of the legitimate popular domains
    if clean_host in POPULAR_DOMAINS:
        return (
            LookalikeCheck(
                status="no_match",
                summary=f"Legitimate popular domain (matches {clean_host})",
                resembles=None,
                edit_distance=0
            ),
            findings
        )

    # If it is a legitimate subdomain of a popular domain (e.g., mail.google.com)
    for pop in POPULAR_DOMAINS:
        if clean_host.endswith("." + pop):
            return (
                LookalikeCheck(
                    status="no_match",
                    summary=f"Legitimate subdomain of {pop}",
                    resembles=None
                ),
                findings
            )

    norm_host = normalize_homoglyphs(clean_host)

    best_match: str | None = None
    min_dist: int = 999

    for pop in POPULAR_DOMAINS:
        # Check homoglyph exact match (e.g. reanime.t0 -> reanime.to)
        if norm_host == pop or norm_host == normalize_homoglyphs(pop):
            best_match = pop
            min_dist = levenshtein(clean_host, pop)
            break

        # Check edit distance on raw and normalized
        d1 = levenshtein(clean_host, pop)
        d2 = levenshtein(norm_host, pop)
        dist = min(d1, d2)

        # Allow distance 1 for length >= 5, or distance 2 for length >= 8
        allowed_dist = 2 if len(pop) >= 8 else 1
        if dist <= allowed_dist and dist < min_dist:
            min_dist = dist
            best_match = pop

    # Check brand keyword in subdomain or path-style host
    if not best_match:
        host_parts = clean_host.split(".")
        base_domain = ".".join(host_parts[-2:]) if len(host_parts) >= 2 else clean_host
        subdomains = ".".join(host_parts[:-2]) if len(host_parts) > 2 else ""

        for pop in POPULAR_DOMAINS:
            pop_brand = pop.split(".")[0]
            if len(pop_brand) >= 4 and pop_brand in subdomains and base_domain != pop:
                best_match = pop
                min_dist = 0
                break

    if best_match:
        findings.append(Finding(
            id="lookalike_domain",
            title=f"Lookalike Domain (Resembles {best_match})",
            severity="high",
            points=RULE_POINTS.get("lookalike_domain", 35),
            explanation=f"The domain '{hostname}' closely resembles the popular domain '{best_match}'. This pattern is frequently used in phishing or brand impersonation campaigns."
        ))

        return (
            LookalikeCheck(
                status="match_found",
                summary=f"Resembles popular domain '{best_match}'",
                resembles=best_match,
                edit_distance=min_dist if min_dist != 999 else None
            ),
            findings
        )

    return (
        LookalikeCheck(
            status="no_match",
            summary="No lookalike detected against known popular domains",
            resembles=None
        ),
        findings
    )
