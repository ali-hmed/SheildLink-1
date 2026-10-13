import React from "react";
import { SeverityLevel } from "@/lib/types";
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from "lucide-react";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = "" }) => {
  switch (severity) {
    case "high":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 ${className}`}
        >
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" aria-hidden="true" />
          <span>High Severity</span>
        </span>
      );
    case "medium":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" aria-hidden="true" />
          <span>Medium Severity</span>
        </span>
      );
    case "low":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 ${className}`}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-sky-400" aria-hidden="true" />
          <span>Low Severity</span>
        </span>
      );
    case "info":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30 ${className}`}
        >
          <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>Info Notice</span>
        </span>
      );
  }
};
