import pytest
import httpx
from unittest.mock import patch, MagicMock
from api.reputation import GoogleSafeBrowsingProvider

@pytest.mark.asyncio
async def test_reputation_unconfigured():
    provider = GoogleSafeBrowsingProvider(api_key="")
    result = await provider.check_url("https://example.com")
    assert result.status == "not_configured"
    assert "not configured" in result.message.lower()
    assert result.matches == []

@pytest.mark.asyncio
async def test_reputation_match_found():
    provider = GoogleSafeBrowsingProvider(api_key="fake-key-for-test")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "matches": [
            {"threatType": "MALWARE"},
            {"threatType": "SOCIAL_ENGINEERING"}
        ]
    }

    with patch("httpx.AsyncClient.post", return_value=mock_resp):
        result = await provider.check_url("http://malicious.example.com")
        assert result.status == "checked"
        assert "MALWARE" in result.matches
        assert "SOCIAL_ENGINEERING" in result.matches
        assert "Threat detected" in result.message

@pytest.mark.asyncio
async def test_reputation_clean_check():
    provider = GoogleSafeBrowsingProvider(api_key="fake-key-for-test")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {}  # No matches

    with patch("httpx.AsyncClient.post", return_value=mock_resp):
        result = await provider.check_url("https://clean-site.org")
        assert result.status == "checked"
        assert result.matches == []
        assert "No threat matches found" in result.message

@pytest.mark.asyncio
async def test_reputation_timeout_resilience():
    provider = GoogleSafeBrowsingProvider(api_key="fake-key-for-test")

    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Read timed out")):
        result = await provider.check_url("https://timeout-site.org")
        assert result.status == "timeout"
        assert result.matches == []
        assert "timed out" in result.message.lower()

@pytest.mark.asyncio
async def test_reputation_error_resilience():
    provider = GoogleSafeBrowsingProvider(api_key="fake-key-for-test")

    mock_resp = MagicMock()
    mock_resp.status_code = 403

    with patch("httpx.AsyncClient.post", return_value=mock_resp):
        result = await provider.check_url("https://example.com")
        assert result.status == "error"
        assert "403" in result.message
