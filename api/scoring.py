from api.schemas import Finding, VerdictLevel

# Weights per detection rule (Single source of truth)
RULE_POINTS: dict[str, int] = {
    # Transport & scheme
    "plain_http": 15,
    "missing_scheme_assumed_http": 5,

    # Credentials & deceptive symbols
    "embedded_credentials": 35,
    "deceptive_at_symbol": 25,

    # Host & IP address
    "ip_address_host": 35,
    "private_or_local_ip": 20,
    "non_standard_ip_encoding": 40,

    # Punycode & Homoglyph
    "punycode_host": 25,
    "mixed_script_host": 25,

    # Ports
    "unusual_port": 25,

    # Domain structure
    "excessive_subdomains": 20,
    "very_long_hostname": 15,
    "known_url_shortener": 20,
    "high_risk_tld": 25,

    # Keywords & Spoofing
    "brand_lookalike": 35,
    "suspicious_keyword_alone": 10,
    "suspicious_keyword_compound": 25,

    # Payload & URL length
    "heavy_percent_encoding": 20,
    "excessive_query_params": 15,
    "excessive_url_length": 15,
}

# Verdict Thresholds:
# 0 -> no_issues_detected
# 1 - 29 -> low_risk
# 30 - 64 -> suspicious
# 65+ -> high_risk
# Note: Positive reputation matches automatically force high_risk.

def calculate_score(findings: list[Finding]) -> int:
    """Calculates total heuristic risk score capped at 100."""
    raw_score = sum(f.points for f in findings)
    return min(100, max(0, raw_score))

def determine_verdict(risk_score: int, has_reputation_match: bool = False) -> VerdictLevel:
    """
    Determines the categorical verdict based on score and reputation.
    Single source of truth.
    """
    if has_reputation_match:
        return "high_risk"

    if risk_score == 0:
        return "no_issues_detected"
    elif risk_score < 30:
        return "low_risk"
    elif risk_score < 65:
        return "suspicious"
    else:
        return "high_risk"
