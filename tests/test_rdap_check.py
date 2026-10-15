import pytest
import httpx
from datetime import datetime, timezone, timedelta
from api.rdap_check import (
    check_domain_registration,
    clear_bootstrap_cache,
    set_bootstrap_cache,
    IANA_BOOTSTRAP_URL,
)
from api.schemas import DomainRegistrationCheck, Finding
from api.routes import check_domain_registration as route_check_domain_reg
from fastapi.testclient import TestClient
from api.index import app
from unittest.mock import patch, AsyncMock

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_cache():
    clear_bootstrap_cache()
    yield
    clear_bootstrap_cache()


@pytest.mark.asyncio
async def test_rdap_302_redirect_then_200_json():
    """Tests an RDAP query that follows a 302 redirect and parses the resulting 200 JSON."""
    bootstrap_json = {
        "services": [
            [["example"], ["https://registry.example/rdap/"]]
        ]
    }
    rdap_payload = {
        "objectClassName": "domain",
        "handle": "EXAMPLE-123",
        "ldhName": "TEST.EXAMPLE",
        "events": [
            {"eventAction": "registration", "eventDate": "1995-08-14T04:00:00Z"},
            {"eventAction": "last changed", "eventDate": "2026-08-14T08:00:00Z"},
            {"eventAction": "expiration", "eventDate": "2027-08-14T04:00:00Z"}
        ],
        "entities": [
            {
                "roles": ["registrar"],
                "vcardArray": [
                    "vcard",
                    [
                        ["version", {}, "text", "4.0"],
                        ["fn", {}, "text", "RESERVED-Internet Assigned Numbers Authority"]
                    ]
                ]
            }
        ]
    }

    def handler(request: httpx.Request) -> httpx.Response:
        url_str = str(request.url)
        if url_str == IANA_BOOTSTRAP_URL:
            return httpx.Response(200, json=bootstrap_json)
        elif url_str == "https://registry.example/rdap/domain/test.example":
            # 302 redirect to final location
            return httpx.Response(302, headers={"Location": "https://final.example/rdap/domain/test.example"})
        elif url_str == "https://final.example/rdap/domain/test.example":
            return httpx.Response(200, json=rdap_payload)
        return httpx.Response(404)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, follow_redirects=True) as mock_client:
        result = await check_domain_registration("test.example", http_client=mock_client)

    assert result.status == "available"
    assert result.creation_date == "1995-08-14"
    assert result.registrar == "RESERVED-Internet Assigned Numbers Authority"
    assert "Registered 1995-08-14" in result.summary
    assert "via RESERVED-Internet Assigned Numbers Authority" in result.summary
    assert result.domain_age is not None
    assert result.age_days is not None and result.age_days > 10000


@pytest.mark.asyncio
async def test_rdap_404_not_registered():
    """HTTP 404 from the registry means 'No registration record found for this domain'."""
    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == IANA_BOOTSTRAP_URL:
            return httpx.Response(200, json={"services": [[["com"], ["https://rdap.verisign.com/com/v1/"]]]})
        return httpx.Response(404, text="Domain Not Found")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, follow_redirects=True) as mock_client:
        result = await check_domain_registration("notregistered-random123.com", http_client=mock_client)

    assert result.status == "not_found"
    assert result.summary == "No registration record found for this domain"


@pytest.mark.asyncio
async def test_rdap_timeout():
    """Timeout returns 'Registry did not respond (timeout)'."""
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("Read timed out")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, follow_redirects=True) as mock_client:
        result = await check_domain_registration("example.com", http_client=mock_client)

    assert result.status == "unavailable"
    assert result.summary == "Registry did not respond (timeout)"


@pytest.mark.asyncio
async def test_rdap_tld_missing_from_bootstrap_falls_back_to_rdap_org():
    """A TLD missing from the bootstrap falls back to https://rdap.org/domain/<domain>."""
    queried_urls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        url_str = str(request.url)
        queried_urls.append(url_str)
        if url_str == IANA_BOOTSTRAP_URL:
            # Bootstrap without 'customtld'
            return httpx.Response(200, json={"services": [[["other"], ["https://rdap.other/"]]]})
        if url_str == "https://rdap.org/domain/hello.customtld":
            return httpx.Response(200, json={
                "events": [{"eventAction": "registration", "eventDate": "2020-01-01T00:00:00Z"}],
                "entities": [{"roles": ["registrar"], "vcardArray": ["vcard", [["fn", {}, "text", "Custom Registrar"]]]}]
            })
        return httpx.Response(404)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, follow_redirects=True) as mock_client:
        result = await check_domain_registration("hello.customtld", http_client=mock_client)

    assert "https://rdap.org/domain/hello.customtld" in queried_urls
    assert result.status == "available"
    assert result.registrar == "Custom Registrar"
    assert result.creation_date == "2020-01-01"


@pytest.mark.asyncio
async def test_rdap_tld_not_supported_at_all():
    """When a TLD is not supported (e.g. rdap.org returns 404 No RDAP service), reports distinct status."""
    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == IANA_BOOTSTRAP_URL:
            return httpx.Response(200, json={"services": []})
        return httpx.Response(404, json={
            "errorCode": 404,
            "title": "No RDAP service is available for this resource"
        })

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, follow_redirects=True) as mock_client:
        result = await check_domain_registration("something.tk", http_client=mock_client)

    assert result.status == "unavailable"
    assert result.summary == "This TLD does not publish RDAP data"


@pytest.mark.asyncio
async def test_subdomain_queries_registrable_domain():
    """A subdomain input (www.example.com) queries example.com."""
    requested_urls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        url_str = str(request.url)
        requested_urls.append(url_str)
        if url_str == IANA_BOOTSTRAP_URL:
            return httpx.Response(200, json={"services": [[["com"], ["https://rdap.verisign.com/com/v1/"]]]})
        return httpx.Response(200, json={
            "events": [{"eventAction": "registration", "eventDate": "1995-08-14T00:00:00Z"}],
            "entities": [{"roles": ["registrar"], "vcardArray": ["vcard", [["fn", {}, "text", "IANA"]]]}]
        })

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport, follow_redirects=True) as mock_client:
        result = await check_domain_registration("www.example.com", http_client=mock_client)

    assert "https://rdap.verisign.com/com/v1/domain/example.com" in requested_urls
    assert not any("www.example.com" in u for u in requested_urls)
    assert result.status == "available"


@pytest.mark.asyncio
async def test_ip_address_host_skipped():
    """IP addresses are skipped with 'Not applicable for IP addresses'."""
    res1 = await check_domain_registration("192.168.1.1")
    assert res1.status == "skipped"
    assert res1.summary == "Not applicable for IP addresses"

    res2 = await check_domain_registration("[::1]")
    assert res2.status == "skipped"
    assert res2.summary == "Not applicable for IP addresses"


from api.schemas import DomainRegistrationCheck, Finding, ReputationResult, DomainLookupResult

def test_scoring_young_domains():
    """Verifies young domains add risk points: under 30 days (+20), under 90 days (+10)."""
    clean_rep = ReputationResult(status="not_configured", message="Not configured", matches=[])
    resolving_dns = (DomainLookupResult(status="resolves", message="Domain resolves", ips=["93.184.216.34"]), [])

    # 1. Under 30 days old (+20 points)
    recent_reg = DomainRegistrationCheck(
        status="available",
        summary="Registered 2026-10-05 (10 days old) via Test Registrar",
        age_days=10
    )
    with patch("api.routes.check_domain_lookup", new=AsyncMock(return_value=resolving_dns)), \
         patch("api.routes.check_domain_registration", new=AsyncMock(return_value=recent_reg)), \
         patch("api.routes.reputation_service.check_url", new=AsyncMock(return_value=clean_rep)):
        resp = client.post("/api/scan", json={"url": "https://brandnew-example.com"})
        assert resp.status_code == 200
        data = resp.json()
        f_ids = [f["id"] for f in data["findings"]]
        assert "very_young_domain" in f_ids
        assert data["risk_score"] >= 20

    # 2. Under 90 days old (+10 points)
    medium_reg = DomainRegistrationCheck(
        status="available",
        summary="Registered 2026-08-15 (60 days old) via Test Registrar",
        age_days=60
    )
    with patch("api.routes.check_domain_lookup", new=AsyncMock(return_value=resolving_dns)), \
         patch("api.routes.check_domain_registration", new=AsyncMock(return_value=medium_reg)), \
         patch("api.routes.reputation_service.check_url", new=AsyncMock(return_value=clean_rep)):
        resp = client.post("/api/scan", json={"url": "https://moderately-new-example.com"})
        assert resp.status_code == 200
        data = resp.json()
        f_ids = [f["id"] for f in data["findings"]]
        assert "young_domain" in f_ids
        assert data["risk_score"] >= 10

    # 3. Old domain (31 years old) -> 0 points
    old_reg = DomainRegistrationCheck(
        status="available",
        summary="Registered 1995-08-14 (31 years old) via Test Registrar",
        age_days=11000
    )
    with patch("api.routes.check_domain_lookup", new=AsyncMock(return_value=resolving_dns)), \
         patch("api.routes.check_domain_registration", new=AsyncMock(return_value=old_reg)), \
         patch("api.routes.reputation_service.check_url", new=AsyncMock(return_value=clean_rep)):
        resp = client.post("/api/scan", json={"url": "https://example.com"})
        assert resp.status_code == 200
        data = resp.json()
        f_ids = [f["id"] for f in data["findings"]]
        assert "very_young_domain" not in f_ids
        assert "young_domain" not in f_ids
        assert data["risk_score"] == 0

    # 4. Lookup fails / unsupported -> 0 points added
    failed_reg = DomainRegistrationCheck(
        status="unavailable",
        summary="Registry did not respond (timeout)"
    )
    with patch("api.routes.check_domain_lookup", new=AsyncMock(return_value=resolving_dns)), \
         patch("api.routes.check_domain_registration", new=AsyncMock(return_value=failed_reg)), \
         patch("api.routes.reputation_service.check_url", new=AsyncMock(return_value=clean_rep)):
        resp = client.post("/api/scan", json={"url": "https://example.com"})
        assert resp.status_code == 200
        data = resp.json()
        f_ids = [f["id"] for f in data["findings"]]
        assert "very_young_domain" not in f_ids
        assert "young_domain" not in f_ids
        assert data["risk_score"] == 0


@pytest.mark.asyncio
async def test_live_manual_check_example_com():
    """Manual/live check for example.com."""
    result = await check_domain_registration("example.com")
    assert result.status == "available"
    assert result.creation_date == "1995-08-14"
    assert result.registrar is not None
    assert "Internet Assigned Numbers Authority" in result.registrar
    assert "Registered 1995-08-14" in result.summary
    assert result.domain_age is not None
    assert result.age_days is not None and result.age_days > 10000


@pytest.mark.asyncio
async def test_live_manual_check_co_uk_domain():
    """Manual/live check for a .co.uk domain (bbc.co.uk)."""
    result = await check_domain_registration("www.bbc.co.uk")
    assert result.status == "available"
    assert result.creation_date == "1994-12-13"
    assert result.registrar is not None
    assert "British Broadcasting Corporation" in result.registrar
    assert "Registered 1994-12-13" in result.summary
    assert result.domain_age is not None
