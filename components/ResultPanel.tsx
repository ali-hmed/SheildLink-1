import React, { useState } from "react";
import { ScanResponse } from "@/lib/types";
import { FindingItem } from "./FindingItem";
import { formatReportText } from "@/lib/report";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Layers,
  Globe,
} from "lucide-react";

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
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API not permitted
    }
  };

  // Sort findings descending by severity/points
  const severityOrder: Record<string, number> = { high: 4, medium: 3, low: 2, info: 1 };
  const sortedFindings = [...result.findings].sort((a, b) => {
    const diff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    return diff !== 0 ? diff : b.points - a.points;
  });

  const getVerdictTheme = () => {
    switch (result.verdict) {
      case "high_risk":
        return {
          label: "HIGH RISK",
          icon: ShieldAlert,
          bg: "bg-rose-950/40 border-rose-600/40 text-rose-300",
          badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
          barColor: "bg-rose-500",
        };
      case "suspicious":
        return {
          label: "SUSPICIOUS",
          icon: AlertTriangle,
          bg: "bg-amber-950/40 border-amber-600/40 text-amber-300",
          badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          barColor: "bg-amber-500",
        };
      case "low_risk":
        return {
          label: "LOW RISK",
          icon: ShieldQuestion,
          bg: "bg-sky-950/40 border-sky-600/40 text-sky-300",
          badgeBg: "bg-sky-500/20 text-sky-300 border-sky-500/30",
          barColor: "bg-sky-500",
        };
      case "no_issues_detected":
      default:
        return {
          label: "NO ISSUES DETECTED",
          icon: ShieldCheck,
          bg: "bg-emerald-950/40 border-emerald-600/40 text-emerald-300",
          badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          barColor: "bg-emerald-500",
        };
    }
  };

  const theme = getVerdictTheme();
  const VerdictIcon = theme.icon;

  return (
    <section
      aria-label="URL Security Analysis Results"
      className="w-full space-y-6 animate-fadeIn"
    >
      {/* Header Verdict Card */}
      <div className={`p-5 sm:p-6 rounded-xl border ${theme.bg} shadow-lg backdrop-blur-sm`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-surface/80 border border-surface-border/50 shrink-0 mt-0.5">
              <VerdictIcon className="w-8 h-8 shrink-0 text-current" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-2.5 py-1 text-xs font-mono font-bold tracking-wider rounded border ${theme.badgeBg}`}>
                  {theme.label}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Scanned: {new Date(result.scanned_at).toUTCString()}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-100 mt-1">
                Security Analysis Summary
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {result.verdict === "no_issues_detected"
                  ? "No suspicious anomalies or known threat signals detected by static rules."
                  : `Static heuristic analysis identified ${result.findings.length} risk factor(s).`}
              </p>
            </div>
          </div>

          {/* Heuristic Risk Score */}
          <div className="flex flex-col items-start md:items-end justify-center border-t md:border-t-0 md:border-l border-surface-border/50 pt-4 md:pt-0 md:pl-6 shrink-0">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Heuristic risk score
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-100">
                {result.risk_score}
              </span>
              <span className="text-xs sm:text-sm font-mono text-slate-400">/ 100</span>
            </div>
            <div className="w-32 h-2 bg-surface-raised rounded-full overflow-hidden mt-1.5 border border-surface-border/50">
              <div
                className={`h-full ${theme.barColor} transition-all duration-500`}
                style={{ width: `${result.risk_score}%` }}
                aria-label={`Score ${result.risk_score} percent`}
              />
            </div>
          </div>
        </div>

        {/* Action bar inside verdict */}
        <div className="mt-4 pt-4 border-t border-surface-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Shield className="w-4 h-4 text-brand-teal shrink-0" aria-hidden="true" />
            <span>Target Hostname:</span>
            <span className="font-mono text-slate-200 select-all font-semibold">
              {result.hostname}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-raised/80 border border-surface-border text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-400 font-semibold">Report Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>Copy Plain-Text Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* URL Details Card (Plain text, never clickable) */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface border border-surface-border">
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-teal" aria-hidden="true" />
          Target URL Identification
        </h4>
        <div className="space-y-2 text-xs sm:text-sm font-mono">
          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">Input URL:</span>
            <div className="p-2.5 rounded bg-surface-raised border border-surface-border/50 text-slate-200 select-all break-all">
              {result.input_url}
            </div>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">Normalized Static URL:</span>
            <div className="p-2.5 rounded bg-surface-raised border border-surface-border/50 text-brand-teal select-all break-all">
              {result.normalized_url}
            </div>
          </div>
        </div>
      </div>

      {/* Google Safe Browsing Reputation Status */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface border border-surface-border">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-teal" aria-hidden="true" />
            External Reputation Check
          </h4>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border ${
              result.reputation.status === "checked"
                ? result.reputation.matches.length > 0
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : result.reputation.status === "not_configured"
                ? "bg-slate-500/20 text-slate-300 border-slate-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}
          >
            {result.reputation.status === "checked"
              ? result.reputation.matches.length > 0
                ? "Match: Malicious"
                : "Checked: Clean"
              : result.reputation.status === "not_configured"
              ? "Not checked: provider not configured"
              : result.reputation.status === "timeout"
              ? "Lookup Timed Out"
              : "Provider Error"}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {result.reputation.message}
        </p>
        {result.reputation.matches.length > 0 && (
          <div className="mt-3 p-3 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
            <span className="font-semibold block mb-1">Threat classifications identified:</span>
            <ul className="list-disc list-inside space-y-0.5 font-mono">
              {result.reputation.matches.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Findings Breakdown */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface border border-surface-border">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-200">
            Detected Signals & Heuristic Findings ({result.findings.length})
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            Sorted by severity
          </span>
        </div>

        {sortedFindings.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-lg bg-surface-raised/40 border border-surface-border/40 text-slate-400 text-xs sm:text-sm">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" aria-hidden="true" />
            <p className="text-slate-300 font-medium">No issues detected by these checks.</p>
            <p className="text-slate-400 text-xs mt-1">
              The URL does not exhibit known deceptive heuristics in its syntax or structure.
            </p>
          </div>
        ) : (
          <ol className="space-y-3 list-none p-0 m-0">
            {sortedFindings.map((finding, idx) => (
              <FindingItem key={finding.id + idx} finding={finding} index={idx} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
};
