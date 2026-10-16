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
      className="w-full bg-white rounded-[4px] border-2 sm:border-3 border-ink p-5 sm:p-6 shadow-[4px_4px_0px_#111111] sm:shadow-[6px_6px_0px_#111111] animate-hard-fade-in"
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
      <div className="space-y-3 py-4 border-b-2 border-ink">
        <div className="flex items-center justify-between">
          <h4 className="text-[12px] font-heading font-extrabold uppercase tracking-wider text-ink bg-primary px-2 py-0.5 border border-ink rounded-[2px] shadow-brutal-sm">
            Findings ({sortedFindings.length})
          </h4>
          {sortedFindings.length > 0 && (
            <span className="text-[12px] font-heading font-bold text-ink uppercase tracking-tight">
              Sorted by severity
            </span>
          )}
        </div>

        {sortedFindings.length === 0 ? (
          <div className="py-4 px-4 rounded-[4px] border-2 border-ink bg-paper text-[14px] font-medium text-ink leading-normal shadow-brutal-sm">
            No issues found by the checks above.
          </div>
        ) : (
          <ol className="space-y-3 list-none p-0 m-0">
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

      {/* 5. Actions: Open site (white), Copy report (white), Scan another (yellow) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Open site action: white with 2px/3px border, hard shadow */}
          {dnsResolves && !isNotFound ? (
            <a
              href={result.normalized_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[44px] inline-flex items-center gap-2 px-5 rounded-[4px] border-2 border-ink bg-white hover:bg-paper text-ink font-heading font-extrabold text-[14px] shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 cursor-pointer"
            >
              <span>Open site</span>
              <ExternalLink className="w-4 h-4 text-ink stroke-[2.5]" aria-hidden="true" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Site was not found in DNS"
              className="h-[44px] inline-flex items-center gap-2 px-5 rounded-[4px] border-2 border-ink bg-risk-neutral/60 text-ink/50 font-heading font-bold text-[14px] shadow-brutal-sm cursor-not-allowed opacity-60"
            >
              <span>Open site</span>
              <ExternalLink className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            </button>
          )}

          {/* Copy report: white with 2px border, hard shadow */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="h-[44px] inline-flex items-center gap-2 px-5 rounded-[4px] border-2 border-ink bg-white hover:bg-paper text-ink font-heading font-extrabold text-[14px] shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-ink stroke-[3]" aria-hidden="true" />
                <span className="text-ink">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-ink stroke-[2.5]" aria-hidden="true" />
                <span>Copy report</span>
              </>
            )}
          </button>
        </div>

        {/* Scan another: yellow with 2px border, hard shadow */}
        <button
          type="button"
          onClick={onScanAnother}
          className="h-[44px] inline-flex items-center gap-2 px-5 rounded-[4px] border-2 border-ink bg-primary text-ink font-heading font-extrabold text-[14px] shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 cursor-pointer shrink-0"
        >
          <RotateCcw className="w-4 h-4 text-ink stroke-[2.5]" aria-hidden="true" />
          <span>Scan another</span>
        </button>
      </div>
    </section>
  );
};
