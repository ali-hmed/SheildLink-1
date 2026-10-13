import React, { useState } from "react";
import { ScanResponse } from "@/lib/types";
import { VerdictHeader } from "./VerdictHeader";
import { ChecksSummary } from "./ChecksSummary";
import { FindingItem } from "./FindingItem";
import { UrlDetails } from "./UrlDetails";
import { OpenSiteDialog } from "./OpenSiteDialog";
import { formatReportText } from "@/lib/report";
import { Copy, Check, ExternalLink, RotateCcw } from "lucide-react";

interface ResultPanelProps {
  result: ScanResponse;
  onScanAnother: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ result, onScanAnother }) => {
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  return (
    <section
      aria-label="URL Security Analysis Results"
      className="w-full bg-white rounded-[14px] border border-border shadow-layered p-4 sm:p-5 space-y-4 animate-fadeInSlide"
    >
      {/* 1. Verdict & Score Header */}
      <VerdictHeader
        verdict={result.verdict}
        score={result.risk_score}
        findings={result.findings}
      />

      {/* 2. Checks Performed Summary */}
      <ChecksSummary
        reputation={result.reputation}
        domainLookup={result.domain_lookup}
      />

      {/* 3. Static Findings List */}
      <div className="space-y-3 py-1 border-b border-border">
        <div className="flex items-center justify-between">
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-ink-3">
            Findings ({result.findings.length})
          </h4>
          <span className="text-[12px] text-ink-3">
            Sorted by severity
          </span>
        </div>

        {sortedFindings.length === 0 ? (
          <div className="py-6 px-4 rounded-[12px] bg-surface-soft border border-border text-center text-[14px] text-ink-2">
            No issues were detected by these checks. This does not guarantee the site is safe.
          </div>
        ) : (
          <ol className="space-y-2 list-none p-0 m-0">
            {sortedFindings.map((finding, idx) => (
              <FindingItem key={`${finding.id}-${idx}`} finding={finding} index={idx} />
            ))}
          </ol>
        )}
      </div>

      {/* 4. URL Details (Selectable text, not links) */}
      <UrlDetails
        inputUrl={result.input_url}
        normalizedUrl={result.normalized_url}
        hostname={result.hostname}
      />

      {/* 5. Primary Actions: 38-40px height, 14px text */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Open site action */}
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="h-[38px] sm:h-[40px] inline-flex items-center gap-1.5 px-4 rounded-[10px] bg-surface-soft hover:bg-slate-200 text-ink font-semibold text-[14px] transition-colors border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer"
          >
            <span>Open site</span>
            <ExternalLink className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
          </button>

          {/* Copy report */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="h-[38px] sm:h-[40px] inline-flex items-center gap-1.5 px-4 rounded-[10px] bg-surface-soft hover:bg-slate-200 text-ink font-semibold text-[14px] transition-colors border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-verdict-ok-text" aria-hidden="true" />
                <span className="text-verdict-ok-text">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-ink-3" aria-hidden="true" />
                <span>Copy report</span>
              </>
            )}
          </button>
        </div>

        {/* Scan another link */}
        <button
          type="button"
          onClick={onScanAnother}
          className="h-[38px] sm:h-[40px] inline-flex items-center gap-1.5 px-3.5 rounded-[10px] text-brand hover:text-brand-hover hover:bg-brand-tint font-semibold text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Scan another</span>
        </button>
      </div>

      {/* Open Site Confirmation Dialog */}
      <OpenSiteDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        hostname={result.hostname}
        normalizedUrl={result.normalized_url}
        verdict={result.verdict}
        domainLookup={result.domain_lookup}
      />
    </section>
  );
};
