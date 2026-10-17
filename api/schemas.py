from typing import Literal
from pydantic import BaseModel, Field

SeverityLevel = Literal["info", "low", "medium", "high"]
VerdictLevel = Literal["safe", "low_risk", "suspicious", "high_risk", "site_not_found", "no_issues_detected"]
ReputationStatus = Literal["checked", "not_configured", "error", "timeout", "skipped"]
ProviderName = Literal["google_safe_browsing"]

class ScanRequest(BaseModel):
    url: str = Field(..., description="The URL to analyze")

class Finding(BaseModel):
    id: str = Field(..., description="Unique rule identifier")
    title: str = Field(..., description="Human-readable title of the finding")
    severity: SeverityLevel = Field(..., description="Severity level: info, low, medium, or high")
    points: int = Field(..., description="Heuristic score contribution points")
    explanation: str = Field(..., description="Plain-English explanation of why this was flagged")

class ReputationResult(BaseModel):
    provider: ProviderName = "google_safe_browsing"
    status: ReputationStatus
    matches: list[str] = Field(default_factory=list)
    message: str

DomainLookupStatus = Literal["resolves", "not_found", "timeout", "error", "skipped"]

class DomainLookupResult(BaseModel):
    status: DomainLookupStatus
    message: str
    ips: list[str] = Field(default_factory=list)

# Detailed Check Models
class UrlStructureCheck(BaseModel):
    name: str = "URL structure"
    status: Literal["ok", "warning", "error"]
    summary: str
    scheme: str
    host: str
    port: int | None = None
    path: str
    has_credentials: bool = False

class DnsCheck(BaseModel):
    name: str = "DNS"
    status: Literal["resolves", "not_found", "timeout", "error", "skipped"]
    summary: str
    ips: list[str] = Field(default_factory=list)

class TlsCheck(BaseModel):
    name: str = "HTTPS/TLS"
    status: Literal["valid", "invalid", "error", "skipped"]
    summary: str
    valid: bool | None = None
    issuer: str | None = None
    expiry_date: str | None = None
    hostname_match: bool | None = None
    disclaimer: str = "TLS handshake only, no page content fetched"

class DomainRegistrationCheck(BaseModel):
    name: str = "Domain registration"
    status: Literal["available", "unavailable", "skipped", "not_found"]
    summary: str
    registrar: str | None = None
    creation_date: str | None = None
    domain_age: str | None = None
    expiration_date: str | None = None
    last_changed_date: str | None = None
    age_days: int | None = None

class LookalikeCheck(BaseModel):
    name: str = "Lookalike check"
    status: Literal["match_found", "no_match", "skipped"]
    summary: str
    resembles: str | None = None
    edit_distance: int | None = None

class SafeBrowsingCheck(BaseModel):
    name: str = "Google Safe Browsing"
    status: Literal["clean", "threat_detected", "not_configured", "skipped", "error", "timeout"]
    summary: str
    matches: list[str] = Field(default_factory=list)

class ChecksResult(BaseModel):
    url_structure: UrlStructureCheck
    dns: DnsCheck
    tls: TlsCheck
    domain_registration: DomainRegistrationCheck
    lookalike: LookalikeCheck
    safe_browsing: SafeBrowsingCheck

class ScanResponse(BaseModel):
    input_url: str
    normalized_url: str
    hostname: str
    verdict: VerdictLevel
    risk_score: int | None = Field(default=None, ge=0, le=100)
    summary: str = Field(..., description="One-sentence plain-language summary")
    findings: list[Finding]
    checks: ChecksResult
    suggested_url: str | None = Field(default=None, description="Suggested URL if lookalike found on NXDOMAIN")
    reputation: ReputationResult
    domain_lookup: DomainLookupResult
    scanned_at: str

class HealthResponse(BaseModel):
    status: Literal["ok"]
    reputation_provider: Literal["configured", "not_configured"]

PreviewStatus = Literal["ready", "screenshot_failed", "failed", "blocked", "site_not_found"]
ScreenshotStatus = Literal["available", "failed", "unsupported", "pending"]

class PreviewRequest(BaseModel):
    url: str = Field(..., description="The URL to generate preview and link intelligence for")

class PreviewResponse(BaseModel):
    input_url: str
    final_url: str
    domain: str
    title: str | None = None
    description: str | None = None
    favicon_url: str | None = None
    og_image_url: str | None = None
    screenshot_url: str | None = None
    screenshot_status: ScreenshotStatus = "available"
    screenshot_error: str | None = None
    redirect_chain: list[str] = Field(default_factory=list)
    status: PreviewStatus = "ready"
    error_message: str | None = None
    generated_at: str
