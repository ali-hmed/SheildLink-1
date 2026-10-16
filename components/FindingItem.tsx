import React from "react";
import { Finding } from "@/lib/types";
import { SeverityPill } from "./SeverityPill";

interface FindingItemProps {
  finding: Finding;
  index: number;
}

export const FindingItem: React.FC<FindingItemProps> = ({ finding }) => {
  return (
    <li className="p-4 rounded-[4px] border-2 border-ink bg-white shadow-brutal-sm space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h4 className="text-[15px] font-heading font-extrabold text-ink leading-snug">
          {finding.title}
        </h4>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="text-[12px] font-mono font-bold text-ink bg-paper px-2 py-0.5 rounded-[2px] border-2 border-ink shadow-brutal-sm">
            +{finding.points} pts
          </span>
          <SeverityPill severity={finding.severity} />
        </div>
      </div>
      <p className="text-[13px] sm:text-[14px] text-ink font-medium leading-relaxed [overflow-wrap:anywhere]">
        {finding.explanation}
      </p>
    </li>
  );
};
