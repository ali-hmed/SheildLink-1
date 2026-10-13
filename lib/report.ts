import { ScanResponse } from "./types";

export function formatReportText(response: ScanResponse): string {
  const verdictLabels: Record<string, string> = {
    no_issues_detected: "NO ISSUES DETECTED",
    low_risk: "LOW RISK",
    suspicious: "SUSPICIOUS",
    high_risk: "HIGH RISK",
  };

  const lines = [
    "============================================================",
    "              LINKSHIELD URL SECURITY REPORT                ",
    "============================================================",
    `Target Hostname:    ${response.hostname}`,
    `Input URL:          ${response.input_url}`,
    `Normalized URL:     ${response.normalized_url}`,
    `Scanned At (UTC):   ${response.scanned_at}`,
    "------------------------------------------------------------",
    `Verdict:            ${verdictLabels[response.verdict] || response.verdict}`,
    `Heuristic Risk Score: ${response.risk_score} / 100`,
    "------------------------------------------------------------",
    "CHECKS PERFORMED:",
    `URL Analysis:       Completed`,
    `Domain Lookup:      ${response.domain_lookup ? response.domain_lookup.message : "Not performed"}`,
    `Safe Browsing:      ${response.reputation.provider} (${response.reputation.status}) - ${response.reputation.message}`,
  ];

  if (response.reputation.matches.length > 0) {
    lines.push(`Threat Matches:     ${response.reputation.matches.join(", ")}`);
  }

  lines.push("------------------------------------------------------------");
  lines.push(`STATIC FINDINGS (${response.findings.length} detected):`);

  if (response.findings.length === 0) {
    lines.push("  - No issues detected by current static heuristic rules.");
  } else {
    response.findings.forEach((f, idx) => {
      lines.push(`  [${idx + 1}] [${f.severity.toUpperCase()}] ${f.title} (+${f.points} pts)`);
      lines.push(`      ID: ${f.id}`);
      lines.push(`      Explanation: ${f.explanation}`);
    });
  }

  lines.push("============================================================");
  lines.push("DISCLAIMER:");
  lines.push("LinkShield evaluates URLs strictly via static heuristics");
  lines.push("and reputation records without visiting the remote host.");
  lines.push("Heuristic score reflects rule triggers, not compromise probability.");
  lines.push("============================================================");

  return lines.join("\n");
}
