import React from "react";
import { Finding } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";

interface FindingItemProps {
  finding: Finding;
  index: number;
}

export const FindingItem: React.FC<FindingItemProps> = ({ finding, index }) => {
  return (
    <li className="p-3.5 rounded-lg bg-surface-subtle/50 border border-surface-border transition-colors hover:border-surface-border-hover">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-mono text-slate-400">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-xs sm:text-sm font-medium text-slate-200 truncate">
            {finding.title}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-slate-400">
            +{finding.points}
          </span>
          <SeverityBadge severity={finding.severity} />
        </div>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed pl-6">
        {finding.explanation}
      </p>
    </li>
  );
};
