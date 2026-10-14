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
        return "bg-red-600";
      case "suspicious":
        return "bg-amber-600";
      case "low_risk":
        return "bg-amber-500";
      case "safe":
      case "no_issues_detected":
      default:
        return "bg-green-600";
    }
  };

  return (
    <div className="w-full sm:w-[160px] space-y-1.5">
      <div className="flex items-center justify-between text-[12px] font-mono">
        <span className="text-slate-500 font-sans">Risk score</span>
        <span className="font-semibold text-[#111111]">
          {clampedScore}<span className="text-slate-400 font-normal">/100</span>
        </span>
      </div>
      {/* Slim 4px bar */}
      <div
        className="w-full h-1 rounded-full bg-slate-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Risk score: ${clampedScore} out of 100`}
      >
        <div
          className={`h-full rounded-full transition-all duration-200 ${getBarColor()}`}
          style={{ width: `${Math.max(clampedScore, 3)}%` }}
        />
      </div>
    </div>
  );
};
