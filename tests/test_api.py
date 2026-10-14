import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from api.index import app
from api.schemas import ReputationResult, DomainLookupResult, DomainRegistrationCheck, Finding

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["reputation_provider"] in ("configured", "not_configured")

def test_scan_valid_clean_url():
    with patch(
        "api.routes.reputation_service.check_url",
        new=AsyncMock(return_value=ReputationResult(
            provider="google_safe_browsing",
            status="not_configured",
            matches=[],
            message="Not configured"
        ))
    ), patch(
        "api.routes.check_domain_registration",
        new=AsyncMock(return_value=DomainRegistrationCheck(
            status="available",
            summary="Registrar: Example Registrar, Created 1995-09-04"
        ))
    ):
        response = client.post("/api/scan", json={"url": "https://example.com"})
        assert response.status_code == 200
        data = response.json()
        assert data["input_url"] == "https://example.com"
        assert data["hostname"] == "example.com"
        assert "risk_score" in data
        assert "verdict" in data
        assert "checks" in data
        assert isinstance(data["findings"], list)

def test_scan_invalid_url_returns_422():
    response = client.post("/api/scan", json={"url": "   "})
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data

def test_scan_javascript_scheme_returns_422():
    response = client.post("/api/scan", json={"url": "javascript:alert(1)"})
    assert response.status_code == 422
    data = response.json()
    assert "scheme" in data["detail"].lower()

def test_scan_threat_match_forces_high_risk():
    with patch(
        "api.routes.check_domain_lookup",
        new=AsyncMock(return_value=(
            DomainLookupResult(status="resolves", message="Domain resolves", ips=["1.2.3.4"]),
            []
        ))
    ), patch(
        "api.routes.reputation_service.check_url",
        new=AsyncMock(return_value=ReputationResult(
            provider="google_safe_browsing",
            status="checked",
            matches=["MALWARE"],
            message="Threat detected"
        ))
    ):
        response = client.post("/api/scan", json={"url": "https://clean-structure-site.com"})
        assert response.status_code == 200
        data = response.json()
        assert data["verdict"] == "high_risk"
        assert "MALWARE" in data["reputation"]["matches"]

# --- Required Specific Test Cases ---

def test_example_com_is_not_high_risk():
    """example.com typed without scheme defaults to https, starts at 0, resolves, and is Safe (not High Risk)."""
    with patch(
        "api.routes.check_domain_lookup",
        new=AsyncMock(return_value=(
            DomainLookupResult(status="resolves", message="Domain resolves", ips=["93.184.216.34"]),
            []
        ))
    ), patch(
        "api.routes.reputation_service.check_url",
        new=AsyncMock(return_value=ReputationResult(
            provider="google_safe_browsing",
            status="not_configured",
            matches=[],
            message="Not configured"
        ))
    ):
        response = client.post("/api/scan", json={"url": "example.com"})
        assert response.status_code == 200
        data = response.json()
        assert data["verdict"] in ("safe", "low_risk")
        assert data["verdict"] != "high_risk"
        assert data["risk_score"] == 0

def test_private_ip_is_flagged():
    """A private IP address host is flagged with private_or_local_ip and ip_address_host findings."""
    response = client.post("/api/scan", json={"url": "http://192.168.1.1:8080/admin"})
    assert response.status_code == 200
    data = response.json()
    finding_ids = [f["id"] for f in data["findings"]]
    assert "private_or_local_ip" in finding_ids
    assert "ip_address_host" in finding_ids
    assert data["risk_score"] > 0
    assert data["verdict"] in ("suspicious", "high_risk")

def test_paypal_lookalike_subdomain_is_high_risk():
    """A paypal lookalike pattern in subdomains/path is flagged and reaches High Risk."""
    response = client.post("/api/scan", json={"url": "https://paypal.secure-verification.com/login"})
    assert response.status_code == 200
    data = response.json()
    finding_ids = [f["id"] for f in data["findings"]]
    assert "brand_lookalike" in finding_ids or "lookalike_domain" in finding_ids
    assert data["verdict"] == "high_risk"
    assert data["risk_score"] >= 65

def test_nxdomain_gives_site_not_found():
    """NXDOMAIN result yields verdict 'site_not_found', no score, and suggests lookalike if found."""
    with patch(
        "api.routes.check_domain_lookup",
        new=AsyncMock(return_value=(
            DomainLookupResult(status="not_found", message="Domain not found, this site may not exist", ips=[]),
            [Finding(
                id="domain_not_found",
                title="Domain Does Not Resolve (NXDOMAIN)",
                severity="info",
                points=0,
                explanation="The domain could not be resolved in public DNS."
            )]
        ))
    ):
        response = client.post("/api/scan", json={"url": "https://reanime.t0"})
        assert response.status_code == 200
        data = response.json()
        assert data["verdict"] == "site_not_found"
        assert data["risk_score"] is None
        assert "reanime.to" in data["summary"]
        assert data["suggested_url"] == "https://reanime.to"
