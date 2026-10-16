import React from "react";
import { VerdictLevel } from "@/lib/types";

interface ScoreMeterProps {
  score: number | null;
  verdict: VerdictLevel;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({ score, verdict }) => {
  if (score === null || score === undefined || verdict === "site_not_found") {
    return null;
  }

  const clampedScore = Math.min(100, Math.max(0, score));

  const getBarColor = () => {
    switch (verdict) {
      case "high_risk":
        return "bg-risk-high";
      case "suspicious":
        return "bg-risk-medium";
      case "low_risk":
        return "bg-risk-low";
      case "safe":
      case "no_issues_detected":
      default:
        return "bg-risk-safe";
    }
  };

  return (
    <div className="w-full sm:w-[170px] space-y-1.5">
      <div className="flex items-center justify-between text-[13px] font-mono">
        <span className="font-heading font-bold text-ink uppercase text-[11px] tracking-wider">
          Risk score
        </span>
        <span className="font-bold text-ink font-mono bg-white px-1.5 py-0.5 border border-ink rounded-[2px]">
          {clampedScore}<span className="text-ink/60 font-semibold">/100</span>
        </span>
      </div>
      {/* Chunky solid-filled bar with 2px border */}
      <div
        className="w-full h-4 rounded-[3px] bg-white border-2 border-ink overflow-hidden p-[1px]"
        role="progressbar"
        aria-valuenow={clampedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Risk score: ${clampedScore} out of 100`}
      >
        <div
          className={`h-full rounded-[1px] border-r-2 border-ink transition-all duration-150 ${getBarColor()}`}
          style={{ width: `${Math.max(clampedScore, clampedScore > 0 ? 5 : 0)}%` }}
        />
      </div>
    </div>
  );
};
