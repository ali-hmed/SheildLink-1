import asyncio
import socket
import ipaddress
from api.schemas import DomainLookupResult, Finding
from api.scoring import RULE_POINTS

def _is_ip_literal(hostname: str) -> bool:
    """Checks whether the hostname is an IPv4 or IPv6 address literal."""
    # Strip brackets if IPv6
    clean_host = hostname.strip("[]")
    try:
        ipaddress.ip_address(clean_host)
        return True
    except ValueError:
        return False

async def check_domain_lookup(hostname: str) -> tuple[DomainLookupResult, list[Finding]]:
    """
    Performs a DNS-only resolution check using asyncio.getaddrinfo.
    Does NOT establish any HTTP/TCP connections.
    Timeout is strictly 3.0 seconds.
    """
    findings: list[Finding] = []

    if _is_ip_literal(hostname):
        return (
            DomainLookupResult(
                status="skipped",
                message="Not checked (IP address)"
            ),
            findings
        )

    loop = asyncio.get_running_loop()

    try:
        # getaddrinfo with port 0 or 80 and SOCK_STREAM to resolve address
        addr_info = await asyncio.wait_for(
            loop.getaddrinfo(hostname, None, type=socket.SOCK_STREAM),
            timeout=3.0
        )

        resolved_ips: list[str] = []
        has_private = False

        for item in addr_info:
            sockaddr = item[4]
            ip_str = sockaddr[0]
            if ip_str not in resolved_ips:
                resolved_ips.append(ip_str)
            try:
                ip_obj = ipaddress.ip_address(ip_str)
                if ip_obj.is_private or ip_obj.is_loopback:
                    has_private = True
            except ValueError:
                pass

        if has_private:
            findings.append(Finding(
                id="domain_resolves_private_ip",
                title="Domain Resolves to Private or Loopback IP",
                severity="medium",
                points=RULE_POINTS.get("domain_resolves_private_ip", 20),
                explanation=f"The domain resolves to internal/private IP space ({', '.join(resolved_ips)}), which may indicate DNS rebinding or internal service scanning."
            ))

        return (
            DomainLookupResult(
                status="resolves",
                message="Domain resolves"
            ),
            findings
        )

    except asyncio.TimeoutError:
        return (
            DomainLookupResult(
                status="timeout",
                message="Lookup timed out"
            ),
            findings
        )
    except socket.gaierror as e:
        # Check for NXDOMAIN or not found
        # Typically error codes like EAI_NONAME or WSAHOST_NOT_FOUND (11001)
        findings.append(Finding(
            id="domain_not_found",
            title="Domain Does Not Resolve (NXDOMAIN)",
            severity="info",
            points=RULE_POINTS.get("domain_not_found", 0),
            explanation="The domain could not be resolved in public DNS. It may be mistyped, nonexistent, or taken down."
        ))
        return (
            DomainLookupResult(
                status="not_found",
                message="Domain not found, this site may not exist"
            ),
            findings
        )
    except Exception as e:
        return (
            DomainLookupResult(
                status="error",
                message=f"DNS resolution error: {str(e)}"
            ),
            findings
        )
