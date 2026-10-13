import React from "react";
import { SeverityLevel } from "@/lib/types";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = "" }) => {
  switch (severity) {
    case "high":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" aria-hidden="true" />
          <span>High</span>
        </span>
      );
    case "medium":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
          <span>Medium</span>
        </span>
      );
    case "low":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" aria-hidden="true" />
          <span>Low</span>
        </span>
      );
    case "info":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />
          <span>Notice</span>
        </span>
      );
  }
};
