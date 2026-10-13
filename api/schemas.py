from typing import Literal
from pydantic import BaseModel, Field

SeverityLevel = Literal["info", "low", "medium", "high"]
VerdictLevel = Literal["no_issues_detected", "low_risk", "suspicious", "high_risk"]
ReputationStatus = Literal["checked", "not_configured", "error", "timeout"]
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

class ScanResponse(BaseModel):
    input_url: str
    normalized_url: str
    hostname: str
    verdict: VerdictLevel
    risk_score: int = Field(..., ge=0, le=100)
    findings: list[Finding]
    reputation: ReputationResult
    domain_lookup: DomainLookupResult
    scanned_at: str

class HealthResponse(BaseModel):
    status: Literal["ok"]
    reputation_provider: Literal["configured", "not_configured"]
