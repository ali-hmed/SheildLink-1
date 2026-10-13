import React, { useState } from "react";
import { ScanResponse } from "@/lib/types";
import { FindingItem } from "./FindingItem";
import { formatReportText } from "@/lib/report";
import { Copy, Check } from "lucide-react";

interface ResultPanelProps {
  result: ScanResponse;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyReport = async () => {
    const text = formatReportText(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const severityOrder: Record<string, number> = { high: 4, medium: 3, low: 2, info: 1 };
  const sortedFindings = [...result.findings].sort((a, b) => {
    const diff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    return diff !== 0 ? diff : b.points - a.points;
  });

  const getVerdictPresentation = () => {
    switch (result.verdict) {
      case "high_risk":
        return {
          label: "High Risk",
          color: "text-rose-400",
          barColor: "bg-rose-500",
          desc: "Multiple high-severity risk signals or known threat indicators detected.",
        };
      case "suspicious":
        return {
          label: "Suspicious",
          color: "text-amber-400",
          barColor: "bg-amber-500",
          desc: "Unusual structural patterns or risk indicators found in URL syntax.",
        };
      case "low_risk":
        return {
          label: "Low Risk",
          color: "text-sky-400",
          barColor: "bg-sky-500",
          desc: "Minor anomalies present (such as unencrypted HTTP or shortener).",
        };
      case "no_issues_detected":
      default:
        return {
          label: "No Issues Detected",
          color: "text-emerald-400",
          barColor: "bg-emerald-500",
          desc: "No known deceptive heuristics or anomalies flagged by static rules.",
        };
    }
  };

  const verdict = getVerdictPresentation();

  return (
    <section
      aria-label="URL Security Analysis Results"
      className="w-full space-y-4 animate-fadeIn"
    >
      {/* Primary Verdict & Summary Header */}
      <div className="p-5 sm:p-6 rounded-xl bg-surface border border-surface-border shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${verdict.barColor}`} />
              <h3 className={`text-base sm:text-lg font-semibold ${verdict.color}`}>
                {verdict.label}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              {verdict.desc}
            </p>
          </div>

          <div className="flex items-baseline sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-surface-border/50 pt-3 sm:pt-0">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Heuristic risk score
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-mono font-bold text-slate-100">
                {result.risk_score}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* Clean Target URL Info */}
        <div className="mt-4 pt-4 border-t border-surface-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0 font-mono">
            <span className="text-slate-400 shrink-0">Host:</span>
            <span className="text-slate-200 truncate select-all">{result.hostname}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Reputation status pill */}
            <span className="text-slate-400">
              Safe Browsing:{" "}
              <span className="text-slate-300">
                {result.reputation.status === "checked"
                  ? result.reputation.matches.length > 0
                    ? "Flagged"
                    : "Clean"
                  : result.reputation.status === "not_configured"
                  ? "Not configured"
                  : result.reputation.status}
              </span>
            </span>

            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-raised hover:bg-surface-border text-slate-300 text-xs transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>Copy report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Normalized URL row (plain text, never link) */}
        <div className="mt-2 text-[11px] font-mono text-slate-400 truncate select-all">
          <span className="text-slate-400 mr-1.5">Normalized:</span>
          {result.normalized_url}
        </div>
      </div>

      {/* Findings List */}
      <div className="p-5 rounded-xl bg-surface border border-surface-border shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Static Findings ({result.findings.length})
          </h4>
          <span className="text-[11px] text-slate-400">
            Rule-based signals
          </span>
        </div>

        {sortedFindings.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No issues detected by these checks.
          </div>
        ) : (
          <ol className="space-y-2 list-none p-0 m-0">
            {sortedFindings.map((finding, idx) => (
              <FindingItem key={finding.id + idx} finding={finding} index={idx} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
};
