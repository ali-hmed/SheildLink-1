import React from "react";
import { VerdictLevel, Finding } from "@/lib/types";
import { ScoreMeter } from "./ScoreMeter";

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
          label: "Site not found",
          dotClass: "bg-slate-400",
          textClass: "text-slate-700",
        };
      case "high_risk":
        return {
          label: "High Risk",
          dotClass: "bg-red-600",
          textClass: "text-red-700",
        };
      case "suspicious":
        return {
          label: "Medium Risk",
          dotClass: "bg-amber-600",
          textClass: "text-amber-700",
        };
      case "low_risk":
        return {
          label: "Low Risk",
          dotClass: "bg-amber-500",
          textClass: "text-amber-700",
        };
      case "safe":
      case "no_issues_detected":
      default:
        return {
          label: "Safe",
          dotClass: "bg-green-600",
          textClass: "text-green-700",
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
            className="text-accent underline font-mono font-medium hover:text-accent-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded cursor-pointer"
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAECF0]">
      <div className="space-y-1">
        {/* Small status dot + verdict word. No big icon box! */}
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dotClass}`} aria-hidden="true" />
          <h3 className={`text-[19px] sm:text-[21px] font-bold tracking-tight text-[#111111]`}>
            {meta.label}
          </h3>
        </div>

        {/* One-sentence plain-language summary */}
        <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed max-w-xl">
          {renderSummary()}
        </p>
      </div>

      {/* Slim score bar (only when score exists) */}
      <div className="shrink-0 self-start sm:self-center">
        <ScoreMeter score={score} verdict={verdict} />
      </div>
    </div>
  );
};
