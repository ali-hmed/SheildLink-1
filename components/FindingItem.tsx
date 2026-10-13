import React from "react";
import { Finding } from "@/lib/types";
import { SeverityPill } from "./SeverityPill";

interface FindingItemProps {
  finding: Finding;
  index: number;
}

export const FindingItem: React.FC<FindingItemProps> = ({ finding, index }) => {
  return (
    <li className="p-3 sm:p-3.5 rounded-[12px] bg-surface-soft border border-border transition-colors hover:border-slate-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[12px] font-mono font-medium text-ink-3 shrink-0">
            #{String(index + 1).padStart(2, "0")}
          </span>
          <h4 className="text-[14px] sm:text-[15px] font-semibold text-ink truncate">
            {finding.title}
          </h4>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[12px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white border border-border text-ink-2">
            +{finding.points}
          </span>
          <SeverityPill severity={finding.severity} />
        </div>
      </div>
      <p className="text-[13px] sm:text-[14px] text-ink-2 leading-relaxed">
        {finding.explanation}
      </p>
    </li>
  );
};
