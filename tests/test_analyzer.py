import pytest
from api.analyzer import (
    analyze_url,
    ValidationError,
    is_octal_or_hex_or_decimal_ip,
    has_mixed_scripts,
)
from api.scoring import calculate_score, determine_verdict, RULE_POINTS
from api.schemas import Finding

# --- Validation and Normalization Tests ---

def test_empty_and_whitespace_url_rejected():
    with pytest.raises(ValidationError) as exc:
        analyze_url("")
    assert "empty" in str(exc.value).lower()

    with pytest.raises(ValidationError) as exc2:
        analyze_url("   \t  ")
    assert "empty" in str(exc2.value).lower()

def test_excessive_url_length_rejected():
    long_url = "https://example.com/" + "a" * 2050
    with pytest.raises(ValidationError) as exc:
        analyze_url(long_url)
    assert "maximum allowed length" in str(exc.value)

def test_dangerous_schemes_rejected():
    for dangerous in ["javascript:alert(1)", "data:text/html,test", "file:///etc/passwd"]:
        with pytest.raises(ValidationError) as exc:
            analyze_url(dangerous)
        assert "scheme" in str(exc.value).lower()

def test_missing_scheme_assumed_http():
    input_url, norm_url, host, findings = analyze_url("example.com/test")
    assert input_url == "example.com/test"
    assert norm_url.startswith("http://")
    assert host == "example.com"
    finding_ids = [f.id for f in findings]
    assert "missing_scheme_assumed_http" in finding_ids
    assert "plain_http" in finding_ids

def test_host_normalization_and_trailing_dot():
    _, norm_url, host, _ = analyze_url("https://EXAMPLE.COM./path")
    assert host == "example.com"
    assert "example.com/path" in norm_url

# --- Detection Rules Tests ---

def test_plain_http_finding():
    _, _, _, findings = analyze_url("http://example.com")
    finding_ids = [f.id for f in findings]
    assert "plain_http" in finding_ids

def test_embedded_credentials():
    _, _, _, findings = analyze_url("https://user:password123@example.com/login")
    finding_ids = [f.id for f in findings]
    assert "embedded_credentials" in finding_ids

def test_deceptive_at_symbol():
    _, _, _, findings = analyze_url("https://google.com@evil-site.com/login")
    finding_ids = [f.id for f in findings]
    assert "deceptive_at_symbol" in finding_ids

def test_ip_based_host_standard():
    _, _, host, findings = analyze_url("http://192.168.1.1:8080/admin")
    finding_ids = [f.id for f in findings]
    assert "ip_address_host" in finding_ids
    assert "private_or_local_ip" in finding_ids
    assert "unusual_port" in finding_ids
    assert host == "192.168.1.1"

def test_ip_based_host_hex_and_decimal():
    assert is_octal_or_hex_or_decimal_ip("2130706433") is True
    assert is_octal_or_hex_or_decimal_ip("0x7f000001") is True
    assert is_octal_or_hex_or_decimal_ip("0177.0.0.1") is True
    assert is_octal_or_hex_or_decimal_ip("example.com") is False

    _, _, _, findings = analyze_url("http://2130706433/")
    finding_ids = [f.id for f in findings]
    assert "non_standard_ip_encoding" in finding_ids

def test_punycode_and_homoglyph():
    # xn--pple-43d.com decodes to аpple.com (with Cyrillic 'а')
    _, _, host, findings = analyze_url("https://xn--pple-43d.com")
    finding_ids = [f.id for f in findings]
    assert "punycode_host" in finding_ids
    assert "mixed_script_host" in finding_ids

def test_excessive_subdomains():
    _, _, _, findings = analyze_url("https://a.b.c.d.example.com")
    finding_ids = [f.id for f in findings]
    assert "excessive_subdomains" in finding_ids

def test_known_url_shortener():
    _, _, _, findings = analyze_url("https://bit.ly/3xyzAbc")
    finding_ids = [f.id for f in findings]
    assert "known_url_shortener" in finding_ids

def test_abused_tld():
    _, _, _, findings = analyze_url("https://something.zip/download")
    finding_ids = [f.id for f in findings]
    assert "high_risk_tld" in finding_ids

def test_brand_lookalike_spoof():
    _, _, _, findings = analyze_url("https://paypal.secure-verification.com/login")
    finding_ids = [f.id for f in findings]
    assert "brand_lookalike" in finding_ids

def test_heavy_percent_encoding_and_query_params():
    url = "https://example.com/test?a=%20%20%20%20%20%20&p1=1&p2=2&p3=3&p4=4&p5=5&p6=6&p7=7&p8=8&p9=9"
    _, _, _, findings = analyze_url(url)
    finding_ids = [f.id for f in findings]
    assert "heavy_percent_encoding" in finding_ids
    assert "excessive_query_params" in finding_ids

# --- Scoring and Verdict Tests ---

def test_scoring_sum_and_capping():
    # Construct findings that exceed 100 points
    findings = [
        Finding(id="f1", title="F1", severity="high", points=60, explanation=""),
        Finding(id="f2", title="F2", severity="high", points=60, explanation=""),
    ]
    score = calculate_score(findings)
    assert score == 100  # Capped at 100

def test_verdict_thresholds():
    assert determine_verdict(0) == "no_issues_detected"
    assert determine_verdict(15) == "low_risk"
    assert determine_verdict(29) == "low_risk"
    assert determine_verdict(30) == "suspicious"
    assert determine_verdict(64) == "suspicious"
    assert determine_verdict(65) == "high_risk"
    assert determine_verdict(100) == "high_risk"

    # Reputation match forces high_risk even if score is 0
    assert determine_verdict(0, has_reputation_match=True) == "high_risk"
