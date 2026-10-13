import React from "react";
import { ReputationResult, DomainLookupResult } from "@/lib/types";
import { CheckCircle2, AlertCircle, HelpCircle, MinusCircle, Clock } from "lucide-react";

interface ChecksSummaryProps {
  reputation: ReputationResult;
  domainLookup?: DomainLookupResult;
}

export const ChecksSummary: React.FC<ChecksSummaryProps> = ({ reputation, domainLookup }) => {
  const getReputationBadge = () => {
    switch (reputation.status) {
      case "checked":
        if (reputation.matches.length > 0) {
          return {
            text: `Flagged (${reputation.matches.join(", ")})`,
            icon: AlertCircle,
            color: "text-verdict-high-text bg-verdict-high-tint border-verdict-high-border",
          };
        }
        return {
          text: "Checked (Clean)",
          icon: CheckCircle2,
          color: "text-verdict-ok-text bg-verdict-ok-tint border-verdict-ok-border",
        };
      case "not_configured":
        return {
          text: "Not configured",
          icon: HelpCircle,
          color: "text-ink-3 bg-surface-soft border-border",
        };
      case "timeout":
        return {
          text: "Timed out",
          icon: Clock,
          color: "text-verdict-suspicious-text bg-verdict-suspicious-tint border-verdict-suspicious-border",
        };
      case "error":
      default:
        return {
          text: `Error (${reputation.message || "Failed"})`,
          icon: AlertCircle,
          color: "text-verdict-high-text bg-verdict-high-tint border-verdict-high-border",
        };
    }
  };

  const getDomainBadge = () => {
    if (!domainLookup) {
      return {
        text: "Not checked",
        icon: MinusCircle,
        color: "text-ink-3 bg-surface-soft border-border",
      };
    }
    switch (domainLookup.status) {
      case "resolves":
        return {
          text: "Domain resolves",
          icon: CheckCircle2,
          color: "text-verdict-ok-text bg-verdict-ok-tint border-verdict-ok-border",
        };
      case "not_found":
        return {
          text: "Domain not found, site may not exist",
          icon: AlertCircle,
          color: "text-verdict-suspicious-text bg-verdict-suspicious-tint border-verdict-suspicious-border",
        };
      case "timeout":
        return {
          text: "Lookup timed out",
          icon: Clock,
          color: "text-verdict-suspicious-text bg-verdict-suspicious-tint border-verdict-suspicious-border",
        };
      case "skipped":
        return {
          text: "Not checked (IP address)",
          icon: MinusCircle,
          color: "text-ink-3 bg-surface-soft border-border",
        };
      case "error":
      default:
        return {
          text: domainLookup.message || "DNS Error",
          icon: AlertCircle,
          color: "text-verdict-suspicious-text bg-verdict-suspicious-tint border-verdict-suspicious-border",
        };
    }
  };

  const repBadge = getReputationBadge();
  const RepIcon = repBadge.icon;

  const domBadge = getDomainBadge();
  const DomIcon = domBadge.icon;

  return (
    <div className="space-y-2 py-3 border-b border-border">
      <h4 className="text-[12px] font-semibold uppercase tracking-wider text-ink-3">
        Checks Performed
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Check 1: URL Analysis */}
        <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-surface-soft border border-border">
          <span className="text-[13px] font-medium text-ink">URL analysis</span>
          <span className="h-[22px] inline-flex items-center gap-1.5 px-2 rounded-full text-[12px] font-semibold bg-verdict-ok-tint text-verdict-ok-text border border-verdict-ok-border">
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
            <span>Completed</span>
          </span>
        </div>

        {/* Check 2: Safe Browsing */}
        <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-surface-soft border border-border">
          <span className="text-[13px] font-medium text-ink">Safe Browsing</span>
          <span
            className={`h-[22px] inline-flex items-center gap-1.5 px-2 rounded-full text-[12px] font-semibold border ${repBadge.color}`}
          >
            <RepIcon className="w-3 h-3" aria-hidden="true" />
            <span className="truncate max-w-[130px]">{repBadge.text}</span>
          </span>
        </div>

        {/* Check 3: Domain Lookup */}
        <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-surface-soft border border-border">
          <span className="text-[13px] font-medium text-ink">Domain lookup</span>
          <span
            className={`h-[22px] inline-flex items-center gap-1.5 px-2 rounded-full text-[12px] font-semibold border ${domBadge.color}`}
          >
            <DomIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[140px]">{domBadge.text}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
