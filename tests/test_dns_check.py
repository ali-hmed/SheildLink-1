import pytest
import socket
import asyncio
from unittest.mock import patch, AsyncMock
from api.dns_check import check_domain_lookup

@pytest.mark.asyncio
async def test_dns_check_resolves():
    mock_addrinfo = [
        (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 0))
    ]
    with patch("asyncio.get_running_loop") as mock_get_loop:
        mock_loop = AsyncMock()
        mock_loop.getaddrinfo = AsyncMock(return_value=mock_addrinfo)
        mock_get_loop.return_value = mock_loop

        result, findings = await check_domain_lookup("example.com")
        assert result.status == "resolves"
        assert result.message == "Domain resolves"
        assert len(findings) == 0

@pytest.mark.asyncio
async def test_dns_check_nxdomain_not_found():
    with patch("asyncio.get_running_loop") as mock_get_loop:
        mock_loop = AsyncMock()
        mock_loop.getaddrinfo = AsyncMock(side_effect=socket.gaierror(11001, "getaddrinfo failed"))
        mock_get_loop.return_value = mock_loop

        result, findings = await check_domain_lookup("nonexistent-domain-xyz-abc.org")
        assert result.status == "not_found"
        assert "Domain not found" in result.message
        assert len(findings) == 1
        assert findings[0].id == "domain_not_found"
        assert findings[0].severity == "info"
        assert findings[0].points == 0

@pytest.mark.asyncio
async def test_dns_check_timeout():
    with patch("asyncio.get_running_loop") as mock_get_loop:
        mock_loop = AsyncMock()
        mock_loop.getaddrinfo = AsyncMock(side_effect=asyncio.TimeoutError())
        mock_get_loop.return_value = mock_loop

        result, findings = await check_domain_lookup("slow-dns-server.com")
        assert result.status == "timeout"
        assert result.message == "Lookup timed out"
        assert len(findings) == 0

@pytest.mark.asyncio
async def test_dns_check_error():
    with patch("asyncio.get_running_loop") as mock_get_loop:
        mock_loop = AsyncMock()
        mock_loop.getaddrinfo = AsyncMock(side_effect=RuntimeError("System DNS subsystem failure"))
        mock_get_loop.return_value = mock_loop

        result, findings = await check_domain_lookup("broken.com")
        assert result.status == "error"
        assert "DNS resolution error" in result.message
        assert len(findings) == 0

@pytest.mark.asyncio
async def test_dns_check_skipped_ip_literal():
    result, findings = await check_domain_lookup("192.168.1.1")
    assert result.status == "skipped"
    assert result.message == "Not checked (IP address)"
    assert len(findings) == 0

    result6, _ = await check_domain_lookup("::1")
    assert result6.status == "skipped"

@pytest.mark.asyncio
async def test_dns_check_resolves_private_ip():
    mock_addrinfo = [
        (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 0)),
        (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.5", 0))
    ]
    with patch("asyncio.get_running_loop") as mock_get_loop:
        mock_loop = AsyncMock()
        mock_loop.getaddrinfo = AsyncMock(return_value=mock_addrinfo)
        mock_get_loop.return_value = mock_loop

        result, findings = await check_domain_lookup("internal-service.local")
        assert result.status == "resolves"
        assert len(findings) == 1
        assert findings[0].id == "domain_resolves_private_ip"
        assert findings[0].severity == "medium"
        assert findings[0].points == 20
