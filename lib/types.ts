export type SeverityLevel = "info" | "low" | "medium" | "high";
export type VerdictLevel = "safe" | "low_risk" | "suspicious" | "high_risk" | "site_not_found" | "no_issues_detected";
export type ReputationStatus = "checked" | "not_configured" | "error" | "timeout" | "skipped";

export interface Finding {
  id: string;
  title: string;
  severity: SeverityLevel;
  points: number;
  explanation: string;
}

export interface ReputationResult {
  provider: "google_safe_browsing";
  status: ReputationStatus;
  matches: string[];
  message: string;
}

export type DomainLookupStatus = "resolves" | "not_found" | "timeout" | "error" | "skipped";

export interface DomainLookupResult {
  status: DomainLookupStatus;
  message: string;
  ips?: string[];
}

export interface UrlStructureCheck {
  name: string;
  status: "ok" | "warning" | "error";
  summary: string;
  scheme: string;
  host: string;
  port?: number | null;
  path: string;
  has_credentials: boolean;
}

export interface DnsCheck {
  name: string;
  status: "resolves" | "not_found" | "timeout" | "error" | "skipped";
  summary: string;
  ips: string[];
}

export interface TlsCheck {
  name: string;
  status: "valid" | "invalid" | "error" | "skipped";
  summary: string;
  valid?: boolean | null;
  issuer?: string | null;
  expiry_date?: string | null;
  hostname_match?: boolean | null;
  disclaimer: string;
}

export interface DomainRegistrationCheck {
  name: string;
  status: "available" | "unavailable" | "skipped" | "not_found";
  summary: string;
  registrar?: string | null;
  creation_date?: string | null;
  domain_age?: string | null;
  expiration_date?: string | null;
  last_changed_date?: string | null;
  age_days?: number | null;
}

export interface LookalikeCheck {
  name: string;
  status: "match_found" | "no_match" | "skipped";
  summary: string;
  resembles?: string | null;
  edit_distance?: number | null;
}

export interface SafeBrowsingCheck {
  name: string;
  status: "clean" | "threat_detected" | "not_configured" | "skipped" | "error" | "timeout";
  summary: string;
  matches: string[];
}

export interface ChecksResult {
  url_structure: UrlStructureCheck;
  dns: DnsCheck;
  tls: TlsCheck;
  domain_registration: DomainRegistrationCheck;
  lookalike: LookalikeCheck;
  safe_browsing: SafeBrowsingCheck;
}

export interface ScanResponse {
  input_url: string;
  normalized_url: string;
  hostname: string;
  verdict: VerdictLevel;
  risk_score: number | null;
  summary: string;
  findings: Finding[];
  checks: ChecksResult;
  suggested_url?: string | null;
  reputation: ReputationResult;
  domain_lookup: DomainLookupResult;
  scanned_at: string;
}

export interface HealthResponse {
  status: "ok";
  reputation_provider: "configured" | "not_configured";
}

export interface HistoryItem {
  id: string;
  url: string;
  normalized_url: string;
  hostname: string;
  verdict: VerdictLevel;
  risk_score: number | null;
  scanned_at: string;
  response: ScanResponse;
}
