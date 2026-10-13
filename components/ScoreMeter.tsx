import React from "react";
import { VerdictLevel } from "@/lib/types";

interface ScoreMeterProps {
  score: number;
  verdict: VerdictLevel;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({ score, verdict }) => {
  const getFillColor = () => {
    switch (verdict) {
      case "high_risk":
        return "bg-verdict-high-text";
      case "suspicious":
        return "bg-verdict-suspicious-text";
      case "low_risk":
        return "bg-verdict-low-text";
      case "no_issues_detected":
      default:
        return "bg-verdict-ok-text";
    }
  };

  const clampedScore = Math.min(100, Math.max(0, score));

  return (
    <div className="w-full sm:w-56 space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">
          Heuristic risk score
        </span>
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-2xl font-bold text-ink">{clampedScore}</span>
          <span className="text-xs text-ink-3">/ 100</span>
        </div>
      </div>
      {/* Slim horizontal meter */}
      <div
        className="w-full h-2 rounded-full bg-slate-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Heuristic risk score: ${clampedScore} out of 100`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${getFillColor()}`}
          style={{ width: `${Math.max(clampedScore, 2)}%` }}
        />
      </div>
    </div>
  );
};
