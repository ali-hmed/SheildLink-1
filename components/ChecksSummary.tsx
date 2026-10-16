import React from "react";
import { ChecksResult } from "@/lib/types";
import { Check, AlertTriangle, Minus, HelpCircle, X } from "lucide-react";

interface ChecksSummaryProps {
  checks: ChecksResult;
}

export const ChecksSummary: React.FC<ChecksSummaryProps> = ({ checks }) => {
  if (!checks) return null;

  const rows = [
    // 1. URL structure
    {
      name: "URL structure",
      summary: checks.url_structure.summary,
      status: checks.url_structure.status,
      getBadge: () => {
        if (checks.url_structure.status === "warning") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-medium flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
            </div>
          );
        }
        return (
          <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-safe flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
            <Check className="w-3.5 h-3.5 text-ink stroke-[3]" aria-hidden="true" />
          </div>
        );
      },
    },
    // 2. DNS
    {
      name: "DNS",
      summary: checks.dns.summary,
      status: checks.dns.status,
      getBadge: () => {
        if (checks.dns.status === "resolves") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-safe flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <Check className="w-3.5 h-3.5 text-ink stroke-[3]" aria-hidden="true" />
            </div>
          );
        }
        if (checks.dns.status === "not_found") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-neutral flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <X className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
            </div>
          );
        }
        if (checks.dns.status === "skipped") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-paper flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <Minus className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
            </div>
          );
        }
        return (
          <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-medium flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
          </div>
        );
      },
    },
    // 3. HTTPS/TLS
    {
      name: "HTTPS / TLS",
      summary: checks.tls.summary,
      status: checks.tls.status,
      getBadge: () => {
        if (checks.tls.status === "valid") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-safe flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <Check className="w-3.5 h-3.5 text-ink stroke-[3]" aria-hidden="true" />
            </div>
          );
        }
        if (checks.tls.status === "invalid") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-high flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <X className="w-3.5 h-3.5 text-ink stroke-[3]" aria-hidden="true" />
            </div>
          );
        }
        if (checks.tls.status === "skipped") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-paper flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <Minus className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
            </div>
          );
        }
        return (
          <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-medium flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
          </div>
        );
      },
    },
    // 4. Domain registration
    {
      name: "Domain registration",
      summary: checks.domain_registration.summary,
      status: checks.domain_registration.status,
      getBadge: () => {
        if (checks.domain_registration.status === "available") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-safe flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <Check className="w-3.5 h-3.5 text-ink stroke-[3]" aria-hidden="true" />
            </div>
          );
        }
        if (checks.domain_registration.status === "not_found") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-neutral flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <X className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
            </div>
          );
        }
        return (
          <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-paper flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
            <Minus className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
          </div>
        );
      },
    },
    // 5. Lookalike check
    {
      name: "Lookalike check",
      summary: checks.lookalike.summary,
      status: checks.lookalike.status,
      getBadge: () => {
        if (checks.lookalike.status === "match_found") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-high flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
            </div>
          );
        }
        if (checks.lookalike.status === "skipped") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-paper flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <Minus className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
            </div>
          );
        }
        return (
          <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-safe flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
            <Check className="w-3.5 h-3.5 text-ink stroke-[3]" aria-hidden="true" />
          </div>
        );
      },
    },
    // 6. Google Safe Browsing
    {
      name: "Google Safe Browsing",
      summary: checks.safe_browsing.summary,
      status: checks.safe_browsing.status,
      getBadge: () => {
        if (checks.safe_browsing.status === "threat_detected") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-high flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <X className="w-3.5 h-3.5 text-ink stroke-[3]" aria-hidden="true" />
            </div>
          );
        }
        if (checks.safe_browsing.status === "clean") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-risk-safe flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <Check className="w-3.5 h-3.5 text-ink stroke-[3]" aria-hidden="true" />
            </div>
          );
        }
        if (checks.safe_browsing.status === "not_configured") {
          return (
            <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-paper flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
              <HelpCircle className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
            </div>
          );
        }
        return (
          <div className="w-6 h-6 rounded-[2px] border-2 border-ink bg-paper flex items-center justify-center shrink-0 mt-0.5 shadow-brutal-sm">
            <Minus className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-3 py-4 border-b-2 border-ink">
      <div className="flex items-center gap-2">
        <h4 className="text-[12px] font-heading font-extrabold uppercase tracking-wider text-ink bg-primary px-2 py-0.5 border border-ink rounded-[2px] shadow-brutal-sm inline-block">
          Checks Performed
        </h4>
      </div>

      {/* Rows separated by 2px solid borders */}
      <div className="divide-y-2 divide-ink rounded-[4px] border-2 border-ink bg-white overflow-hidden shadow-brutal-sm">
        {rows.map((row) => (
          <div
            key={row.name}
            className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 p-3.5 hover:bg-paper/70 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {row.getBadge()}
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="text-[14px] font-heading font-bold text-ink">
                  {row.name}
                </div>
                <div className="text-[13px] text-ink font-medium leading-relaxed [overflow-wrap:anywhere] break-words">
                  {row.summary}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
