import React from "react";
import { ChecksResult } from "@/lib/types";
import { CheckCircle2, AlertCircle, AlertTriangle, MinusCircle, HelpCircle } from "lucide-react";

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
      getIcon: () => {
        if (checks.url_structure.status === "warning") {
          return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />;
      },
    },
    // 2. DNS
    {
      name: "DNS",
      summary: checks.dns.summary,
      status: checks.dns.status,
      getIcon: () => {
        if (checks.dns.status === "resolves") {
          return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        if (checks.dns.status === "not_found") {
          return <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        if (checks.dns.status === "skipped") {
          return <MinusCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />;
      },
    },
    // 3. HTTPS/TLS
    {
      name: "HTTPS / TLS",
      summary: checks.tls.summary,
      status: checks.tls.status,
      getIcon: () => {
        if (checks.tls.status === "valid") {
          return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        if (checks.tls.status === "invalid") {
          return <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        if (checks.tls.status === "skipped") {
          return <MinusCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />;
      },
    },
    // 4. Domain registration
    {
      name: "Domain registration",
      summary: checks.domain_registration.summary,
      status: checks.domain_registration.status,
      getIcon: () => {
        if (checks.domain_registration.status === "available") {
          return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        return <MinusCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />;
      },
    },
    // 5. Lookalike check
    {
      name: "Lookalike check",
      summary: checks.lookalike.summary,
      status: checks.lookalike.status,
      getIcon: () => {
        if (checks.lookalike.status === "match_found") {
          return <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        if (checks.lookalike.status === "skipped") {
          return <MinusCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />;
      },
    },
    // 6. Google Safe Browsing
    {
      name: "Google Safe Browsing",
      summary: checks.safe_browsing.summary,
      status: checks.safe_browsing.status,
      getIcon: () => {
        if (checks.safe_browsing.status === "threat_detected") {
          return <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        if (checks.safe_browsing.status === "clean") {
          return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        if (checks.safe_browsing.status === "not_configured") {
          return <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />;
        }
        return <MinusCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />;
      },
    },
  ];

  return (
    <div className="space-y-3 py-4 border-b border-[#EAECF0]">
      <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">
        Checks Performed
      </h4>

      {/* Clean vertical list (NOT clipped pills), text wraps never truncates */}
      <div className="divide-y divide-[#EAECF0] rounded-xl border border-[#EAECF0] bg-white overflow-hidden">
        {rows.map((row) => (
          <div
            key={row.name}
            className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-4 p-3.5 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              {row.getIcon()}
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#111111]">
                  {row.name}
                </div>
                <div className="text-[13px] text-slate-600 leading-relaxed [overflow-wrap:anywhere] break-words">
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
