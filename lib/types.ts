export type SeverityLevel = "info" | "low" | "medium" | "high";
export type VerdictLevel = "no_issues_detected" | "low_risk" | "suspicious" | "high_risk";
export type ReputationStatus = "checked" | "not_configured" | "error" | "timeout";

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

export interface ScanResponse {
  input_url: string;
  normalized_url: string;
  hostname: string;
  verdict: VerdictLevel;
  risk_score: number;
  findings: Finding[];
  reputation: ReputationResult;
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
  risk_score: number;
  scanned_at: string;
  response: ScanResponse;
}
