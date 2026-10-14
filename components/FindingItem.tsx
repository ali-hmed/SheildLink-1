import React from "react";
import { Finding } from "@/lib/types";
import { SeverityPill } from "./SeverityPill";

interface FindingItemProps {
  finding: Finding;
  index: number;
}

export const FindingItem: React.FC<FindingItemProps> = ({ finding }) => {
  return (
    <li className="p-3.5 rounded-xl border border-[#EAECF0] bg-white transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
        <h4 className="text-[14px] font-semibold text-[#111111]">
          {finding.title}
        </h4>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[12px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-[#EAECF0]">
            +{finding.points} pts
          </span>
          <SeverityPill severity={finding.severity} />
        </div>
      </div>
      <p className="text-[13px] text-slate-600 leading-relaxed [overflow-wrap:anywhere]">
        {finding.explanation}
      </p>
    </li>
  );
};
