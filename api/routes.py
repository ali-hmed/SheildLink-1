import time
from datetime import datetime, timezone
from collections import defaultdict
from urllib.parse import urlsplit
from fastapi import APIRouter, Request, HTTPException, status
from api.schemas import (
    ScanRequest, ScanResponse, HealthResponse,
    ChecksResult, UrlStructureCheck, DnsCheck, TlsCheck,
    DomainRegistrationCheck, LookalikeCheck, SafeBrowsingCheck,
    Finding
)
from api.analyzer import analyze_url, ValidationError
from api.scoring import calculate_score, determine_verdict
from api.reputation import reputation_service
from api.config import settings
from api.dns_check import check_domain_lookup
from api.tls_check import check_tls
from api.rdap_check import check_domain_registration
from api.lookalike_check import check_lookalike
import asyncio

router = APIRouter(prefix="/api")

# In-memory sliding-window IP rate limiter
_request_counts = defaultdict(list)

def check_rate_limit(client_ip: str, limit: int = 60, window_seconds: float = 60.0):
    now = time.time()
    timestamps = _request_counts[client_ip]
    _request_counts[client_ip] = [ts for ts in timestamps if now - ts < window_seconds]
    if len(_request_counts[client_ip]) >= limit:
        return False
    _request_counts[client_ip].append(now)
    return True

@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        reputation_provider="configured" if reputation_service.is_configured else "not_configured"
    )

@router.post("/scan", response_model=ScanResponse)
async def scan(request: Request, body: ScanRequest):
    client_ip = request.client.host if request.client else "127.0.0.1"

    if not check_rate_limit(client_ip, limit=settings.rate_limit_per_minute):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending more requests."
        )

    try:
        input_url, normalized_url, hostname, initial_findings = analyze_url(body.url)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to parse or analyze URL: {str(e)}"
        )

    # 1. Concurrently run DNS check and Lookalike check
    dns_task = asyncio.create_task(check_domain_lookup(hostname))
    lookalike_task = asyncio.create_task(asyncio.to_thread(check_lookalike, hostname))

    (dns_result, dns_findings), (lookalike_result, lookalike_findings) = await asyncio.gather(
        dns_task, lookalike_task
    )

    is_domain_not_found = (dns_result.status == "not_found")

    # 2. Concurrently run TLS check, RDAP check, and Reputation check
    parsed = urlsplit(normalized_url)
    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    tls_task = asyncio.create_task(
        check_tls(
            hostname=hostname,
            port=port,
            domain_status=dns_result.status,
            timeout=3.0
        )
    )
    rdap_task = asyncio.create_task(
        check_domain_registration(
            hostname=hostname,
            domain_status=dns_result.status,
            timeout=2.5
        )
    )
    rep_task = asyncio.create_task(
        reputation_service.check_url(
            url=normalized_url,
            domain_status=dns_result.status
        )
    )

    (tls_result, tls_findings), rdap_result, rep_result = await asyncio.gather(
        tls_task, rdap_task, rep_task
    )

    # 3. Construct URL Structure Check
    has_creds = any(f.id in ("embedded_credentials", "deceptive_at_symbol") for f in initial_findings)
    port_text = f", custom port {parsed.port}" if parsed.port and parsed.port not in (80, 443) else ""
    creds_text = "embedded credentials detected" if has_creds else "no embedded credentials"
    url_structure_check = UrlStructureCheck(
        status="warning" if has_creds else "ok",
        summary=f"Parsed OK (scheme: {parsed.scheme}, host: {hostname}{port_text}, path: {parsed.path or '/'}, {creds_text})",
        scheme=parsed.scheme,
        host=hostname,
        port=parsed.port,
        path=parsed.path or "/",
        has_credentials=has_creds
    )

    # 4. Construct DNS Check
    if dns_result.status == "resolves" and dns_result.ips:
        dns_summary = f"Resolved to {', '.join(dns_result.ips)}"
    elif dns_result.status == "not_found":
        dns_summary = "Domain does not resolve (NXDOMAIN)"
    else:
        dns_summary = dns_result.message

    dns_check = DnsCheck(
        status=dns_result.status,
        summary=dns_summary,
        ips=dns_result.ips
    )

    # 5. Construct Google Safe Browsing Check
    if rep_result.status == "not_configured":
        sb_status = "not_configured"
        sb_summary = "Not configured"
    elif rep_result.status == "skipped" or is_domain_not_found:
        sb_status = "skipped"
        sb_summary = "Skipped (domain not found)"
    elif rep_result.status == "checked":
        if rep_result.matches:
            sb_status = "threat_detected"
            sb_summary = f"Threat detected: {', '.join(rep_result.matches)}"
        else:
            sb_status = "clean"
            sb_summary = "No threat matches found"
    elif rep_result.status == "timeout":
        sb_status = "timeout"
        sb_summary = "Lookup timed out after 5.0s"
    else:
        sb_status = "error"
        sb_summary = rep_result.message

    safe_browsing_check = SafeBrowsingCheck(
        status=sb_status,
        summary=sb_summary,
        matches=rep_result.matches
    )

    # Assemble all 6 checks
    checks = ChecksResult(
        url_structure=url_structure_check,
        dns=dns_check,
        tls=tls_result,
        domain_registration=rdap_result,
        lookalike=lookalike_result,
        safe_browsing=safe_browsing_check
    )

    # Combine findings (avoiding duplicates by id)
    all_findings: list[Finding] = []
    seen_ids = set()
    for f in initial_findings + dns_findings + lookalike_findings + tls_findings:
        if f.id not in seen_ids:
            seen_ids.add(f.id)
            all_findings.append(f)

    # Filter out 0-point informational notes from the active findings list unless needed
    # (Keep in all_findings so UI or tests can inspect)
    has_rep_match = len(rep_result.matches) > 0
    score = calculate_score(all_findings)
    verdict = determine_verdict(
        risk_score=score,
        has_reputation_match=has_rep_match,
        is_domain_not_found=is_domain_not_found
    )

    # Determine plain-language one-sentence summary & suggestions
    suggested_url = None
    if is_domain_not_found:
        score = None  # No score exists when site is not found
        if lookalike_result.resembles:
            suggested_url = f"https://{lookalike_result.resembles}"
            summary = f"This domain does not exist and may be mistyped. Did you mean {lookalike_result.resembles}?"
        else:
            summary = "The domain does not exist in public DNS, may be mistyped, or has been taken down."
    elif has_rep_match:
        summary = f"Flagged high risk: threat detected by Google Safe Browsing ({', '.join(rep_result.matches)})."
    elif score == 0:
        summary = "No security issues were identified by any of the performed checks."
    else:
        high_f = [f for f in all_findings if f.severity == "high" and f.points > 0]
        med_f = [f for f in all_findings if f.severity == "medium" and f.points > 0]
        if high_f:
            summary = f"Elevated risk identified primarily due to {high_f[0].title.lower()}{f' and {len(all_findings)-1} other indicator(s)' if len(all_findings) > 1 else ''}."
        elif med_f:
            summary = f"Potential risk observed: {med_f[0].title.lower()}{f' alongside {len(all_findings)-1} other signal(s)' if len(all_findings) > 1 else ''}."
        else:
            summary = f"Minor anomaly detected ({all_findings[0].title.lower()}) that warrants awareness."

    return ScanResponse(
        input_url=input_url,
        normalized_url=normalized_url,
        hostname=hostname,
        verdict=verdict,
        risk_score=score,
        summary=summary,
        findings=all_findings,
        checks=checks,
        suggested_url=suggested_url,
        reputation=rep_result,
        domain_lookup=dns_result,
        scanned_at=datetime.now(timezone.utc).isoformat()
    )
