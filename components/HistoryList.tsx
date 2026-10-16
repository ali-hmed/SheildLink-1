import React from "react";
import { HistoryItem, ScanResponse } from "@/lib/types";

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: ScanResponse) => void;
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onSelect,
  onClear,
}) => {
  // Empty history: hide the section completely
  if (!history || history.length === 0) return null;

  const getVerdictSquareColor = (verdict: string) => {
    switch (verdict) {
      case "site_not_found":
        return "bg-risk-neutral";
      case "high_risk":
        return "bg-risk-high";
      case "suspicious":
        return "bg-risk-medium";
      case "low_risk":
        return "bg-risk-low";
      case "safe":
      case "no_issues_detected":
      default:
        return "bg-risk-safe";
    }
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case "site_not_found":
        return "Site not found";
      case "high_risk":
        return "High Risk";
      case "suspicious":
        return "Medium Risk";
      case "low_risk":
        return "Low Risk";
      case "safe":
      case "no_issues_detected":
      default:
        return "Safe";
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const scannedDate = new Date(isoString);
      const diffMs = Date.now() - scannedDate.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return "just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return scannedDate.toLocaleDateString();
    } catch {
      return "recently";
    }
  };

  return (
    <section aria-labelledby="history-heading" className="w-full pt-2">
      <div className="flex items-center justify-between pb-3">
        <h3
          id="history-heading"
          className="text-[12px] font-heading font-extrabold uppercase tracking-wider text-ink bg-primary px-2.5 py-0.5 border border-ink rounded-[2px] shadow-brutal-sm inline-block"
        >
          Recent Scans
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="px-2.5 py-1 text-xs font-heading font-extrabold text-ink bg-white border-2 border-ink rounded-[4px] shadow-brutal-sm hover:bg-primary active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 cursor-pointer"
        >
          Clear history
        </button>
      </div>

      <div className="divide-y-2 divide-ink rounded-[4px] border-2 border-ink bg-white overflow-hidden shadow-brutal-sm">
        {history.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.response)}
            className="w-full py-3 px-4 flex items-center justify-between text-left hover:bg-paper/70 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0 pr-3">
              <span
                className={`w-3.5 h-3.5 rounded-[2px] border-2 border-ink shrink-0 ${getVerdictSquareColor(
                  item.verdict
                )} shadow-[1px_1px_0px_#111]`}
                aria-hidden="true"
              />
              <span className="text-[14px] font-mono font-bold text-ink truncate">
                {item.hostname}
              </span>
              <span className="text-[12px] font-heading font-bold text-ink/60 shrink-0">
                ({getVerdictLabel(item.verdict)})
              </span>
            </div>

            <span className="text-[12px] text-ink font-mono font-semibold shrink-0">
              {formatRelativeTime(item.scanned_at)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
