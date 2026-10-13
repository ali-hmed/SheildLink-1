import React from "react";
import { Finding } from "@/lib/types";
import { SeverityPill } from "./SeverityPill";

interface FindingItemProps {
  finding: Finding;
  index: number;
}

export const FindingItem: React.FC<FindingItemProps> = ({ finding, index }) => {
  return (
    <li className="p-4 sm:p-5 rounded-2xl bg-surface-soft border border-border transition-colors hover:border-slate-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono font-medium text-ink-3 shrink-0">
            #{String(index + 1).padStart(2, "0")}
          </span>
          <h4 className="text-base sm:text-lg font-semibold text-ink truncate">
            {finding.title}
          </h4>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs sm:text-sm font-mono font-semibold px-2 py-0.5 rounded bg-white border border-border text-ink-2">
            +{finding.points}
          </span>
          <SeverityPill severity={finding.severity} />
        </div>
      </div>
      <p className="text-sm sm:text-[15px] text-ink-2 leading-relaxed">
        {finding.explanation}
      </p>
    </li>
  );
};
