import React from "react";
import { Finding } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";

interface FindingItemProps {
  finding: Finding;
  index: number;
}

export const FindingItem: React.FC<FindingItemProps> = ({ finding, index }) => {
  return (
    <li className="p-4 rounded-lg bg-surface border border-surface-border/60 hover:border-surface-border transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 bg-surface-raised px-2 py-0.5 rounded border border-surface-border/40">
            #{index + 1}
          </span>
          <h4 className="text-sm font-semibold text-slate-200">
            {finding.title}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-brand-teal px-2 py-0.5 rounded bg-brand-teal/10 border border-brand-teal/20">
            +{finding.points} pts
          </span>
          <SeverityBadge severity={finding.severity} />
        </div>
      </div>
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
        {finding.explanation}
      </p>
      <div className="mt-2 pt-2 border-t border-surface-border/30 text-[11px] font-mono text-slate-400">
        Rule ID: <span className="text-slate-300">{finding.id}</span>
      </div>
    </li>
  );
};
