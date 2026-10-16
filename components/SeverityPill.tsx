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
          className={`h-[24px] inline-flex items-center px-2.5 rounded-full text-[11px] font-heading font-extrabold uppercase tracking-wide bg-risk-high text-ink border-2 border-ink shadow-brutal-sm shrink-0 ${className}`}
        >
          High
        </span>
      );
    case "medium":
      return (
        <span
          className={`h-[24px] inline-flex items-center px-2.5 rounded-full text-[11px] font-heading font-extrabold uppercase tracking-wide bg-risk-medium text-ink border-2 border-ink shadow-brutal-sm shrink-0 ${className}`}
        >
          Medium
        </span>
      );
    case "low":
      return (
        <span
          className={`h-[24px] inline-flex items-center px-2.5 rounded-full text-[11px] font-heading font-extrabold uppercase tracking-wide bg-risk-low text-ink border-2 border-ink shadow-brutal-sm shrink-0 ${className}`}
        >
          Low
        </span>
      );
    case "info":
    default:
      return (
        <span
          className={`h-[24px] inline-flex items-center px-2.5 rounded-full text-[11px] font-heading font-extrabold uppercase tracking-wide bg-risk-neutral text-ink border-2 border-ink shadow-brutal-sm shrink-0 ${className}`}
        >
          Info
        </span>
      );
  }
};
