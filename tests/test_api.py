import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from api.index import app
from api.schemas import ReputationResult

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
    ):
        response = client.post("/api/scan", json={"url": "https://example.com"})
        assert response.status_code == 200
        data = response.json()
        assert data["input_url"] == "https://example.com"
        assert data["hostname"] == "example.com"
        assert "risk_score" in data
        assert "verdict" in data
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
