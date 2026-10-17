import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from api.index import app
from api.preview import (
    is_ip_blocked,
    check_destination_ssrf,
    sanitize_text,
    HTMLMetadataParser,
    generate_preview,
)
import ipaddress


@pytest.fixture
def client():
    return TestClient(app)


def test_is_ip_blocked():
    assert is_ip_blocked(ipaddress.ip_address("127.0.0.1")) is True
    assert is_ip_blocked(ipaddress.ip_address("10.0.0.5")) is True
    assert is_ip_blocked(ipaddress.ip_address("192.168.1.100")) is True
    assert is_ip_blocked(ipaddress.ip_address("172.16.0.1")) is True
    assert is_ip_blocked(ipaddress.ip_address("169.254.169.254")) is True
    assert is_ip_blocked(ipaddress.ip_address("0.0.0.0")) is True
    assert is_ip_blocked(ipaddress.ip_address("::1")) is True
    assert is_ip_blocked(ipaddress.ip_address("fc00::1")) is True
    assert is_ip_blocked(ipaddress.ip_address("fe80::1")) is True
    # Public IP should not be blocked
    assert is_ip_blocked(ipaddress.ip_address("8.8.8.8")) is False
    assert is_ip_blocked(ipaddress.ip_address("93.184.216.34")) is False


@pytest.mark.asyncio
async def test_check_destination_ssrf_blocked_hosts():
    is_blocked, reason, _ = await check_destination_ssrf("127.0.0.1")
    assert is_blocked is True
    assert "blocked" in (reason or "").lower()

    is_blocked, reason, _ = await check_destination_ssrf("169.254.169.254")
    assert is_blocked is True

    is_blocked, reason, _ = await check_destination_ssrf("metadata.google.internal")
    assert is_blocked is True


def test_sanitize_text():
    assert sanitize_text("  <b>Hello</b> &amp; World  ") == "Hello & World"
    assert sanitize_text(None) is None
    assert sanitize_text("") is None
    long_text = "a" * 500
    sanitized = sanitize_text(long_text, max_len=100)
    assert len(sanitized) <= 103
    assert sanitized.endswith("...")


def test_html_metadata_parser():
    sample_html = """
    <!DOCTYPE html>
    <html>
      <head>
        <title>Example Domain &amp; Co</title>
        <meta name="description" content="This domain is for use in illustrative examples.">
        <meta property="og:image" content="/images/og.png">
        <link rel="icon" href="/favicon.ico">
      </head>
      <body>
        <h1>Example</h1>
      </body>
    </html>
    """
    parser = HTMLMetadataParser()
    parser.feed(sample_html)

    title = "".join(parser.title_parts)
    assert "Example Domain & Co" in title
    assert parser.description == "This domain is for use in illustrative examples."
    assert parser.og_image == "/images/og.png"
    assert parser.favicon == "/favicon.ico"


@pytest.mark.asyncio
async def test_generate_preview_ssrf_blocked():
    resp = await generate_preview("http://127.0.0.1:8000/secret")
    assert resp.status == "blocked"
    assert resp.screenshot_status == "unsupported"
    assert resp.error_message is not None


@pytest.mark.asyncio
async def test_generate_preview_private_ip():
    resp = await generate_preview("http://192.168.1.1/")
    assert resp.status == "blocked"
    assert resp.screenshot_status == "unsupported"


@pytest.mark.asyncio
async def test_generate_preview_mocked_success():
    with patch("api.preview.check_destination_ssrf", new=AsyncMock(return_value=(False, None, ["93.184.216.34"]))), \
         patch("api.preview.fetch_html_and_metadata", new=AsyncMock(return_value=(
             "https://example.com/",
             ["https://example.com/"],
             {
                 "title": "Example Domain",
                 "description": "Illustrative example",
                 "favicon_url": "https://example.com/favicon.ico",
                 "og_image_url": "https://example.com/og.png"
             },
             None
         ))), \
         patch("api.preview.capture_screenshot", new=AsyncMock(return_value=(
             "https://microlink.io/screenshot.png",
             "available",
             None
         ))):
        resp = await generate_preview("https://example.com")
        assert resp.status == "ready"
        assert resp.domain == "example.com"
        assert resp.title == "Example Domain"
        assert resp.description == "Illustrative example"
        assert resp.screenshot_url == "https://microlink.io/screenshot.png"
        assert resp.screenshot_status == "available"


def test_api_preview_endpoint(client):
    with patch("api.routes.generate_preview", new=AsyncMock()) as mock_preview:
        from api.schemas import PreviewResponse
        mock_preview.return_value = PreviewResponse(
            input_url="https://example.com",
            final_url="https://example.com/",
            domain="example.com",
            title="Example Domain",
            description="Illustrative",
            favicon_url="https://example.com/favicon.ico",
            og_image_url=None,
            screenshot_url="https://microlink.io/screenshot.png",
            screenshot_status="available",
            redirect_chain=[],
            status="ready",
            generated_at="2026-10-17T00:00:00Z"
        )
        res = client.post("/api/preview", json={"url": "https://example.com"})
        assert res.status_code == 200
        data = res.json()
        assert data["domain"] == "example.com"
        assert data["screenshot_status"] == "available"
        assert data["title"] == "Example Domain"
