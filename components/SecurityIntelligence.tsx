"use client";

import React, { useState } from "react";
import { ScanResponse } from "@/lib/types";
import { VerdictHeader } from "./VerdictHeader";
import { ChecksSummary } from "./ChecksSummary";
import { FindingItem } from "./FindingItem";
import { formatReportText } from "@/lib/report";
import {
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Calendar,
  Lock,
  Server,
  Layers,
} from "lucide-react";

interface SecurityIntelligenceProps {
  result: ScanResponse;
  onScanAnother: () => void;
  onRescan?: (url: string) => void;
  onOpenSiteRequest?: () => void;
}

export const SecurityIntelligence: React.FC<SecurityIntelligenceProps> = ({
  result,
  onScanAnother,
  onRescan,
  onOpenSiteRequest,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"findings" | "technical">("findings");

  const handleCopyReport = async () => {
    const text = formatReportText(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const severityOrder: Record<string, number> = { high: 4, medium: 3, low: 2, info: 1 };
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

  const isHighOrSuspicious =
    result.verdict === "high_risk" || result.verdict === "suspicious";

  // Quick signals
  const hasLookalike = result.findings.some(
    (f) => f.id === "lookalike_domain" || f.id === "brand_lookalike"
  );
  const hasThreatMatch = Boolean(
    result.checks?.safe_browsing?.matches?.length ||
      result.reputation?.matches?.length
  );
  const domainAge = result.checks?.domain_registration?.domain_age;
  const registrar = result.checks?.domain_registration?.registrar;
  const tlsIssuer = result.checks?.tls?.issuer;

  return (
    <div
      aria-label="Security Intelligence Findings and Risk Analysis"
      className="w-full bg-white rounded-[4px] border-2 sm:border-3 border-ink p-4 sm:p-6 shadow-[4px_4px_0px_#111111] sm:shadow-[6px_6px_0px_#111111] space-y-4"
    >
      {/* 1. Verdict & Risk Score Header Band */}
      <VerdictHeader
        verdict={result.verdict}
        score={result.risk_score}
        summary={result.summary}
        findings={result.findings}
        suggestedUrl={result.suggested_url}
        onRescan={onRescan}
      />

      {/* 2. Critical Threat Alert Callouts if detected */}
      {hasThreatMatch && (
        <div className="p-3 bg-risk-high/15 border-2 border-risk-high rounded-[3px] flex items-start gap-2.5">
          <AlertOctagon className="w-5 h-5 text-risk-high shrink-0 stroke-[2.5] mt-0.5" />
          <div className="text-[12px] font-sans text-ink leading-tight">
            <span className="font-heading font-extrabold text-[13px] text-ink uppercase block mb-0.5">
              Blacklist Match Detected
            </span>
            Target URL matches known malicious listings in threat intelligence databases.
          </div>
        </div>
      )}

      {hasLookalike && (
        <div className="p-3 bg-risk-medium/15 border-2 border-risk-medium rounded-[3px] flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-ink shrink-0 stroke-[2.5] mt-0.5" />
          <div className="text-[12px] font-sans text-ink leading-tight">
            <span className="font-heading font-extrabold text-[13px] text-ink uppercase block mb-0.5">
              Potential Brand Impersonation
            </span>
            Domain name closely mimics a trusted popular brand, a tactic typical of credential phishing.
          </div>
        </div>
      )}

      {/* 3. Domain Quick Signals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        {/* Domain Age */}
        <div className="p-2.5 bg-paper rounded-[3px] border border-ink space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] font-heading font-extrabold uppercase tracking-wider text-ink/70">
            <Calendar className="w-3 h-3 stroke-[2.5]" />
            <span>Domain Age</span>
          </div>
          <div className="text-[12px] font-heading font-bold text-ink truncate" title={domainAge || "Unknown"}>
            {domainAge || "Unavailable"}
          </div>
        </div>

        {/* TLS Certificate */}
        <div className="p-2.5 bg-paper rounded-[3px] border border-ink space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] font-heading font-extrabold uppercase tracking-wider text-ink/70">
            <Lock className="w-3 h-3 stroke-[2.5]" />
            <span>HTTPS Certificate</span>
          </div>
          <div className="text-[12px] font-heading font-bold text-ink truncate" title={tlsIssuer || "Unknown"}>
            {result.checks?.tls?.status === "valid"
              ? "Valid TLS"
              : result.checks?.tls?.status === "invalid"
              ? "Invalid Certificate"
              : "Not verified"}
          </div>
        </div>

        {/* DNS Status */}
        <div className="p-2.5 bg-paper rounded-[3px] border border-ink space-y-0.5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1 text-[10px] font-heading font-extrabold uppercase tracking-wider text-ink/70">
            <Server className="w-3 h-3 stroke-[2.5]" />
            <span>DNS Resolution</span>
          </div>
          <div className="text-[12px] font-heading font-bold text-ink truncate">
            {dnsResolves ? "Resolves" : isNotFound ? "NXDOMAIN" : "Pending"}
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation: Triggered Findings vs All Checks */}
      <div className="pt-2 border-t-2 border-ink">
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setActiveTab("findings")}
            className={`h-[34px] px-3.5 rounded-[3px] border-2 border-ink text-[12px] font-heading font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
              activeTab === "findings"
                ? "bg-primary text-ink shadow-brutal-sm"
                : "bg-paper text-ink/70 hover:bg-white"
            }`}
          >
            Findings ({sortedFindings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("technical")}
            className={`h-[34px] px-3.5 rounded-[3px] border-2 border-ink text-[12px] font-heading font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
              activeTab === "technical"
                ? "bg-primary text-ink shadow-brutal-sm"
                : "bg-paper text-ink/70 hover:bg-white"
            }`}
          >
            All 6 Checks
          </button>
        </div>

        {/* Tab 1: Findings List */}
        {activeTab === "findings" && (
          <div className="space-y-2.5">
            {sortedFindings.length === 0 ? (
              <div className="py-4 px-4 rounded-[4px] border-2 border-ink bg-paper text-[13px] font-medium text-ink leading-normal shadow-brutal-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-risk-safe stroke-[3] shrink-0" />
                <span>No security risk indicators identified by any applied checks.</span>
              </div>
            ) : (
              <ol className="space-y-2.5 list-none p-0 m-0">
                {sortedFindings.map((finding, idx) => (
                  <FindingItem key={`${finding.id}-${idx}`} finding={finding} index={idx} />
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Tab 2: All Checks Summary */}
        {activeTab === "technical" && (
          <div className="space-y-2">
            <ChecksSummary checks={result.checks} />
          </div>
        )}
      </div>

      {/* 5. Gated Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t-2 border-ink">
        <div className="flex flex-wrap items-center gap-2">
          {/* Open site action: Clearly gated if suspicious/high risk */}
          {dnsResolves && !isNotFound ? (
            <button
              type="button"
              onClick={onOpenSiteRequest}
              className={`h-[42px] inline-flex items-center gap-2 px-4 rounded-[3px] border-2 border-ink font-heading font-extrabold text-[13px] shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${
                isHighOrSuspicious
                  ? "bg-risk-high text-white hover:bg-risk-high/90"
                  : "bg-white hover:bg-paper text-ink"
              }`}
            >
              <span>{isHighOrSuspicious ? "Visit site (Risky)" : "Open site"}</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="Site does not exist in DNS"
              className="h-[42px] inline-flex items-center gap-2 px-4 rounded-[3px] border-2 border-ink bg-risk-neutral/60 text-ink/50 font-heading font-bold text-[13px] shadow-brutal-sm cursor-not-allowed opacity-60"
            >
              <span>Open site</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
            </button>
          )}

          {/* Copy Report */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="h-[42px] inline-flex items-center gap-2 px-3.5 rounded-[3px] border-2 border-ink bg-white hover:bg-paper text-ink font-heading font-extrabold text-[13px] shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-ink stroke-[3]" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
                <span>Copy report</span>
              </>
            )}
          </button>
        </div>

        {/* Scan Another */}
        <button
          type="button"
          onClick={onScanAnother}
          className="h-[42px] inline-flex items-center gap-1.5 px-4 rounded-[3px] border-2 border-ink bg-primary text-ink font-heading font-extrabold text-[13px] shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
          <span>Scan another</span>
        </button>
      </div>
    </div>
  );
};
