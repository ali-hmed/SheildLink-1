import React from "react";
import { SeverityLevel } from "@/lib/types";
import { ShieldCheck, Info, AlertTriangle, AlertOctagon } from "lucide-react";

interface SeverityPillProps {
  severity: SeverityLevel;
  className?: string;
}

export const SeverityPill: React.FC<SeverityPillProps> = ({ severity, className = "" }) => {
  switch (severity) {
    case "high":
      return (
        <span
          className={`h-[24px] inline-flex items-center gap-1.5 px-2.5 rounded-full text-[13px] font-semibold bg-verdict-high-tint text-verdict-high-text border border-verdict-high-border shrink-0 ${className}`}
        >
          <AlertOctagon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>High Risk</span>
        </span>
      );
    case "medium":
      return (
        <span
          className={`h-[24px] inline-flex items-center gap-1.5 px-2.5 rounded-full text-[13px] font-semibold bg-verdict-suspicious-tint text-verdict-suspicious-text border border-verdict-suspicious-border shrink-0 ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Medium Risk</span>
        </span>
      );
    case "low":
      return (
        <span
          className={`h-[24px] inline-flex items-center gap-1.5 px-2.5 rounded-full text-[13px] font-semibold bg-verdict-low-tint text-verdict-low-text border border-verdict-low-border shrink-0 ${className}`}
        >
          <Info className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Low Risk</span>
        </span>
      );
    case "info":
    default:
      return (
        <span
          className={`h-[24px] inline-flex items-center gap-1.5 px-2.5 rounded-full text-[13px] font-semibold bg-verdict-info-tint text-verdict-info-text border border-verdict-info-border shrink-0 ${className}`}
        >
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Informational</span>
        </span>
      );
  }
};
