import asyncio
import ssl
from datetime import datetime
from api.schemas import TlsCheck, Finding
from api.scoring import RULE_POINTS

def _parse_cert_date(date_str: str | None) -> str | None:
    if not date_str:
        return None
    try:
        # e.g. "Jan 15 12:00:00 2027 GMT"
        dt = datetime.strptime(date_str, "%b %d %H:%M:%S %Y %Z")
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return date_str

async def check_tls(
    hostname: str,
    port: int = 443,
    domain_status: str = "resolves",
    timeout: float = 3.0
) -> tuple[TlsCheck, list[Finding]]:
    """
    Performs a TLS handshake ONLY.
    Never fetches HTTP/HTML page content.
    Discloses this explicitly in summary.
    """
    findings: list[Finding] = []

    # If domain did not resolve, skip TLS check
    if domain_status == "not_found":
        return (
            TlsCheck(
                status="skipped",
                summary="Skipped (domain not found)",
                valid=None
            ),
            findings
        )

    if domain_status in ("timeout", "error"):
        return (
            TlsCheck(
                status="skipped",
                summary="Skipped (DNS lookup failed)",
                valid=None
            ),
            findings
        )

    ctx = ssl.create_default_context()
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(hostname, port, ssl=ctx, server_hostname=hostname),
            timeout=timeout
        )

        ssl_obj = writer.get_extra_info("ssl_object")
        cert = ssl_obj.getpeercert() if ssl_obj else None

        writer.close()
        await writer.wait_closed()

        if cert:
            issuer_entries = {}
            for sub in cert.get("issuer", ()):
                for k, v in sub:
                    issuer_entries[k] = v

            issuer = (
                issuer_entries.get("organizationName")
                or issuer_entries.get("commonName")
                or "Unknown Issuer"
            )
            expiry_date = _parse_cert_date(cert.get("notAfter"))

            return (
                TlsCheck(
                    status="valid",
                    valid=True,
                    issuer=issuer,
                    expiry_date=expiry_date,
                    hostname_match=True,
                    summary=f"Certificate valid, issued by {issuer}, expires {expiry_date or 'N/A'}, hostname matches (TLS handshake only, no page content fetched)"
                ),
                findings
            )
        else:
            return (
                TlsCheck(
                    status="valid",
                    valid=True,
                    summary="TLS handshake succeeded, no peer certificate details available (TLS handshake only, no page content fetched)"
                ),
                findings
            )

    except ssl.SSLCertVerificationError as e:
        findings.append(Finding(
            id="invalid_tls_certificate",
            title="Invalid TLS/SSL Certificate",
            severity="medium",
            points=RULE_POINTS.get("invalid_tls_certificate", 25),
            explanation=f"TLS certificate verification failed ({e.verify_message or str(e)}). This may indicate an expired certificate, self-signed certificate, or MITM interception."
        ))
        return (
            TlsCheck(
                status="invalid",
                valid=False,
                summary=f"Certificate invalid: {e.verify_message or str(e)} (TLS handshake only, no page content fetched)"
            ),
            findings
        )
    except (asyncio.TimeoutError, ConnectionRefusedError, OSError) as e:
        return (
            TlsCheck(
                status="error",
                valid=False,
                summary=f"HTTPS handshake not established ({type(e).__name__}; TLS handshake only, no page content fetched)"
            ),
            findings
        )
    except Exception as e:
        return (
            TlsCheck(
                status="error",
                valid=False,
                summary=f"TLS error: {str(e)} (TLS handshake only, no page content fetched)"
            ),
            findings
        )
