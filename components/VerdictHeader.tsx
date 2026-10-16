import React from "react";
import { VerdictLevel, Finding } from "@/lib/types";
import { ScoreMeter } from "./ScoreMeter";
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from "lucide-react";

interface VerdictHeaderProps {
  verdict: VerdictLevel;
  score: number | null;
  summary: string;
  findings: Finding[];
  suggestedUrl?: string | null;
  onRescan?: (url: string) => void;
}

export const VerdictHeader: React.FC<VerdictHeaderProps> = ({
  verdict,
  score,
  summary,
  suggestedUrl,
  onRescan,
}) => {
  const getVerdictMeta = () => {
    switch (verdict) {
      case "site_not_found":
        return {
          label: "Site Not Found",
          bandBg: "bg-risk-neutral",
          icon: <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-ink stroke-[2.5]" aria-hidden="true" />,
        };
      case "high_risk":
        return {
          label: "High Risk",
          bandBg: "bg-risk-high",
          icon: <AlertOctagon className="w-6 h-6 sm:w-7 sm:h-7 text-ink stroke-[2.5]" aria-hidden="true" />,
        };
      case "suspicious":
        return {
          label: "Medium Risk",
          bandBg: "bg-risk-medium",
          icon: <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-ink stroke-[2.5]" aria-hidden="true" />,
        };
      case "low_risk":
        return {
          label: "Low Risk",
          bandBg: "bg-risk-low",
          icon: <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-ink stroke-[2.5]" aria-hidden="true" />,
        };
      case "safe":
      case "no_issues_detected":
      default:
        return {
          label: "Safe",
          bandBg: "bg-risk-safe",
          icon: <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-ink stroke-[2.5]" aria-hidden="true" />,
        };
    }
  };

  const meta = getVerdictMeta();

  // Render summary sentence, with clickable suggestion if applicable
  const renderSummary = () => {
    if (verdict === "site_not_found" && suggestedUrl && onRescan) {
      const displayDomain = suggestedUrl.replace(/^https?:\/\//, "");
      return (
        <span>
          This domain does not exist in DNS and may be mistyped. Did you mean{" "}
          <button
            type="button"
            onClick={() => onRescan(suggestedUrl)}
            className="inline-block px-2 py-0.5 border border-ink bg-primary font-mono font-bold text-ink hover:underline rounded-[2px] shadow-[2px_2px_0px_#111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            {displayDomain}
          </button>
          ?
        </span>
      );
    }
    return summary;
  };

  return (
    <div className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6 mb-5">
      {/* Solid risk-colored band across top of card with 2px/3px bottom border */}
      <div
        className={`w-full ${meta.bandBg} text-ink px-5 sm:px-6 py-4 sm:py-5 border-b-2 sm:border-b-3 border-ink flex flex-col sm:flex-row sm:items-center justify-between gap-3.5`}
      >
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-[3px] border-2 border-ink bg-white/40 shrink-0">
            {meta.icon}
          </div>
          <h3 className="text-[22px] sm:text-[26px] font-heading font-extrabold uppercase tracking-tight text-ink">
            {meta.label}
          </h3>
        </div>

        {/* Chunky score meter inside band */}
        <div className="shrink-0 self-start sm:self-center">
          <ScoreMeter score={score} verdict={verdict} />
        </div>
      </div>

      {/* One-line plain-language summary below on pure white */}
      <div className="px-5 sm:px-6 pt-4 pb-1">
        <p className="text-[15px] sm:text-[16px] text-ink font-medium leading-relaxed max-w-2xl">
          {renderSummary()}
        </p>
      </div>
    </div>
  );
};
