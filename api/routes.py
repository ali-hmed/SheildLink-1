import time
from datetime import datetime, timezone
from collections import defaultdict
from fastapi import APIRouter, Request, HTTPException, status
from api.schemas import ScanRequest, ScanResponse, HealthResponse
from api.analyzer import analyze_url, ValidationError
from api.scoring import calculate_score, determine_verdict
from api.reputation import reputation_service
from api.config import settings

router = APIRouter(prefix="/api")

# In-memory sliding-window IP rate limiter
_request_counts = defaultdict(list)

def check_rate_limit(client_ip: str, limit: int = 60, window_seconds: float = 60.0):
    now = time.time()
    timestamps = _request_counts[client_ip]
    # Prune old timestamps
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
        input_url, normalized_url, hostname, findings = analyze_url(body.url)
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

    # Perform reputation lookup (Safe Browsing)
    rep_result = await reputation_service.check_url(normalized_url)

    # Scoring & Verdict calculation
    has_match = len(rep_result.matches) > 0
    score = calculate_score(findings)
    verdict = determine_verdict(score, has_reputation_match=has_match)

    return ScanResponse(
        input_url=input_url,
        normalized_url=normalized_url,
        hostname=hostname,
        verdict=verdict,
        risk_score=score,
        findings=findings,
        reputation=rep_result,
        scanned_at=datetime.now(timezone.utc).isoformat()
    )
