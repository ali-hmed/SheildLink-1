import React from "react";
import { VerdictLevel, Finding } from "@/lib/types";
import { ScoreMeter } from "./ScoreMeter";
import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from "lucide-react";

interface VerdictHeaderProps {
  verdict: VerdictLevel;
  score: number;
  findings: Finding[];
}

export const VerdictHeader: React.FC<VerdictHeaderProps> = ({ verdict, score, findings }) => {
  const getVerdictMeta = () => {
    switch (verdict) {
      case "high_risk":
        return {
          label: "High Risk",
          Icon: AlertOctagon,
          textColor: "text-verdict-high-text",
          tintBg: "bg-verdict-high-tint",
          borderColor: "border-verdict-high-border",
        };
      case "suspicious":
        return {
          label: "Suspicious",
          Icon: AlertTriangle,
          textColor: "text-verdict-suspicious-text",
          tintBg: "bg-verdict-suspicious-tint",
          borderColor: "border-verdict-suspicious-border",
        };
      case "low_risk":
        return {
          label: "Low Risk",
          Icon: Info,
          textColor: "text-verdict-low-text",
          tintBg: "bg-verdict-low-tint",
          borderColor: "border-verdict-low-border",
        };
      case "no_issues_detected":
      default:
        return {
          label: "No Issues Detected",
          Icon: CheckCircle2,
          textColor: "text-verdict-ok-text",
          tintBg: "bg-verdict-ok-tint",
          borderColor: "border-verdict-ok-border",
        };
    }
  };

  const meta = getVerdictMeta();
  const Icon = meta.Icon;

  // Derive plain-English summary sentence from real findings
  const getSummarySentence = () => {
    if (findings.length === 0) {
      return "No deceptive patterns or syntactic anomalies were identified by these checks.";
    }
    const highFindings = findings.filter((f) => f.severity === "high");
    const mediumFindings = findings.filter((f) => f.severity === "medium");

    if (highFindings.length > 0) {
      const topTitle = highFindings[0].title;
      return `Flagged high risk primarily due to ${topTitle.toLowerCase()}${
        findings.length > 1 ? ` and ${findings.length - 1} other indicator(s)` : ""
      }.`;
    }
    if (mediumFindings.length > 0) {
      const topTitle = mediumFindings[0].title;
      return `Potential risk observed: ${topTitle.toLowerCase()}${
        findings.length > 1 ? ` alongside ${findings.length - 1} other signal(s)` : ""
      }.`;
    }
    return `Minor anomalies detected (${findings[0].title.toLowerCase()}) that warrant awareness.`;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${meta.borderColor} ${meta.tintBg} ${meta.textColor}`}>
            <Icon className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true" />
          </div>
          <h3 className={`text-[28px] sm:text-[32px] font-bold tracking-tight ${meta.textColor}`}>
            {meta.label}
          </h3>
        </div>
        <p className="text-base sm:text-[17px] text-ink-2 max-w-xl leading-relaxed">
          {getSummarySentence()}
        </p>
      </div>

      <div className="shrink-0 self-start md:self-center">
        <ScoreMeter score={score} verdict={verdict} />
      </div>
    </div>
  );
};
