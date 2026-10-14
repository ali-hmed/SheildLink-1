import { ScanResponse } from "./types";

export function formatReportText(response: ScanResponse): string {
  const verdictLabels: Record<string, string> = {
    safe: "SAFE",
    no_issues_detected: "SAFE",
    low_risk: "LOW RISK",
    suspicious: "MEDIUM RISK",
    high_risk: "HIGH RISK",
    site_not_found: "SITE NOT FOUND",
  };

  const lines = [
    "============================================================",
    "              LINKSHIELD URL SECURITY REPORT                ",
    "============================================================",
    `Target Hostname:      ${response.hostname}`,
    `Input URL:            ${response.input_url}`,
    `Normalized URL:       ${response.normalized_url}`,
    `Scanned At (UTC):     ${response.scanned_at}`,
    "------------------------------------------------------------",
    `Verdict:              ${verdictLabels[response.verdict] || response.verdict}`,
    `Risk Score:           ${response.risk_score !== null ? `${response.risk_score} / 100` : "N/A"}`,
    `Summary:              ${response.summary}`,
    "------------------------------------------------------------",
    "CHECKS PERFORMED:",
  ];

  if (response.checks) {
    const c = response.checks;
    lines.push(`1. URL Structure:       ${c.url_structure.summary}`);
    lines.push(`2. DNS Resolution:      ${c.dns.summary}`);
    lines.push(`3. HTTPS / TLS:         ${c.tls.summary}`);
    lines.push(`4. Domain Registration: ${c.domain_registration.summary}`);
    lines.push(`5. Lookalike Check:     ${c.lookalike.summary}`);
    lines.push(`6. Safe Browsing:       ${c.safe_browsing.summary}`);
  } else {
    lines.push(`Domain Lookup:        ${response.domain_lookup ? response.domain_lookup.message : "Not performed"}`);
    lines.push(`Safe Browsing:        ${response.reputation.message}`);
  }

  lines.push("------------------------------------------------------------");
  const activeFindings = response.findings.filter((f) => f.points > 0);
  lines.push(`TRIGGERED FINDINGS (${activeFindings.length}):`);

  if (activeFindings.length === 0) {
    lines.push("  - No issues found by the checks above.");
  } else {
    activeFindings.forEach((f, idx) => {
      lines.push(`  [${idx + 1}] [${f.severity.toUpperCase()}] ${f.title} (+${f.points} pts)`);
      lines.push(`      ${f.explanation}`);
    });
  }

  lines.push("============================================================", "DISCLAIMER:", "LinkShield analyzes link structures and registries without opening the page.", "No checks can guarantee absolute safety.");

  return lines.join("\n");
}
