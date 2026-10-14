import React from "react";
import { SeverityLevel } from "@/lib/types";

interface SeverityPillProps {
  severity: SeverityLevel;
  className?: string;
}

export const SeverityPill: React.FC<SeverityPillProps> = ({ severity, className = "" }) => {
  switch (severity) {
    case "high":
      return (
        <span
          className={`h-[22px] inline-flex items-center px-2 rounded-md text-[12px] font-medium bg-red-50 text-red-700 border border-red-200 shrink-0 ${className}`}
        >
          High
        </span>
      );
    case "medium":
      return (
        <span
          className={`h-[22px] inline-flex items-center px-2 rounded-md text-[12px] font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0 ${className}`}
        >
          Medium
        </span>
      );
    case "low":
      return (
        <span
          className={`h-[22px] inline-flex items-center px-2 rounded-md text-[12px] font-medium bg-slate-100 text-slate-700 border border-slate-200 shrink-0 ${className}`}
        >
          Low
        </span>
      );
    case "info":
    default:
      return (
        <span
          className={`h-[22px] inline-flex items-center px-2 rounded-md text-[12px] font-medium bg-slate-50 text-slate-600 border border-slate-200 shrink-0 ${className}`}
        >
          Info
        </span>
      );
  }
};
