"use client";

import React, { useState } from "react";
import { ScanResponse } from "@/lib/types";
import { VerdictHeader } from "./VerdictHeader";
import { ChecksSummary } from "./ChecksSummary";
import { FindingItem } from "./FindingItem";
import { UrlDetails } from "./UrlDetails";
import { formatReportText } from "@/lib/report";
import { Copy, Check, ExternalLink, RotateCcw } from "lucide-react";

interface ResultPanelProps {
  result: ScanResponse;
  onScanAnother: () => void;
  onRescan?: (url: string) => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  onScanAnother,
  onRescan,
}) => {
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
  // Only real triggered findings with points > 0
  const activeFindings = result.findings.filter((f) => f.points > 0);
  const sortedFindings = [...activeFindings].sort((a, b) => {
    const diff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    return diff !== 0 ? diff : b.points - a.points;
  });

  const dnsResolves =
    result.checks?.dns?.status === "resolves" ||
    result.domain_lookup?.status === "resolves" ||
    result.domain_lookup?.status === "skipped";

  const isNotFound =
    result.verdict === "site_not_found" ||
    result.checks?.dns?.status === "not_found" ||
    result.domain_lookup?.status === "not_found";

  return (
    <section
      aria-label="URL Security Analysis Results"
      className="w-full bg-white rounded-2xl border border-[#EAECF0] p-5 sm:p-6 space-y-2 animate-fade-in"
    >
      {/* 1. Verdict & Score Header */}
      <VerdictHeader
        verdict={result.verdict}
        score={result.risk_score}
        summary={result.summary}
        findings={result.findings}
        suggestedUrl={result.suggested_url}
        onRescan={onRescan}
      />

      {/* 2. Checks Performed as Clean Vertical List */}
      <ChecksSummary checks={result.checks} />

      {/* 3. Triggered Findings */}
      <div className="space-y-3 py-4 border-b border-[#EAECF0]">
        <div className="flex items-center justify-between">
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">
            Findings ({sortedFindings.length})
          </h4>
          {sortedFindings.length > 0 && (
            <span className="text-[12px] text-slate-400">
              Sorted by severity
            </span>
          )}
        </div>

        {sortedFindings.length === 0 ? (
          <div className="py-4 px-4 rounded-xl border border-[#EAECF0] bg-slate-50/50 text-[14px] text-slate-600 leading-normal">
            No issues found by the checks above.
          </div>
        ) : (
          <ol className="space-y-2.5 list-none p-0 m-0">
            {sortedFindings.map((finding, idx) => (
              <FindingItem key={`${finding.id}-${idx}`} finding={finding} index={idx} />
            ))}
          </ol>
        )}
      </div>

      {/* 4. URL Details */}
      <UrlDetails
        inputUrl={result.input_url}
        normalizedUrl={result.normalized_url}
        hostname={result.hostname}
      />

      {/* 5. Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Open site action: only if DNS resolved; disabled with tooltip if site was not found */}
          {dnsResolves && !isNotFound ? (
            <a
              href={result.normalized_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[40px] inline-flex items-center gap-2 px-4 rounded-lg bg-accent hover:bg-accent-hover text-white text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              <span>Open site</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Site was not found in DNS"
              className="h-[40px] inline-flex items-center gap-2 px-4 rounded-lg border border-[#EAECF0] bg-slate-50 text-slate-400 text-[14px] font-medium cursor-not-allowed"
            >
              <span>Open site</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}

          {/* Copy report */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="h-[40px] inline-flex items-center gap-2 px-4 rounded-lg border border-[#EAECF0] bg-white hover:bg-slate-50 text-slate-700 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
                <span className="text-green-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>Copy report</span>
              </>
            )}
          </button>
        </div>

        {/* Scan another */}
        <button
          type="button"
          onClick={onScanAnother}
          className="h-[40px] inline-flex items-center gap-1.5 px-3.5 text-slate-600 hover:text-[#111111] hover:bg-slate-50 rounded-lg text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Scan another</span>
        </button>
      </div>
    </section>
  );
};
