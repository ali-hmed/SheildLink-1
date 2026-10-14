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

  const getDotColor = (verdict: string) => {
    switch (verdict) {
      case "site_not_found":
        return "bg-slate-400";
      case "high_risk":
        return "bg-red-600";
      case "suspicious":
        return "bg-amber-600";
      case "low_risk":
        return "bg-amber-500";
      case "safe":
      case "no_issues_detected":
      default:
        return "bg-green-600";
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
      <div className="flex items-center justify-between pb-2 border-b border-[#EAECF0]">
        <h3 id="history-heading" className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">
          Recent Scans
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded px-1"
        >
          Clear history
        </button>
      </div>

      <div className="divide-y divide-[#EAECF0]">
        {history.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.response)}
            className="w-full py-2.5 px-1.5 flex items-center justify-between text-left hover:bg-slate-50 rounded-lg transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${getDotColor(item.verdict)}`} aria-hidden="true" />
              <span className="text-[13px] sm:text-[14px] font-mono text-slate-700 group-hover:text-[#111111] truncate">
                {item.hostname}
              </span>
              <span className="text-[12px] text-slate-400 shrink-0">
                ({getVerdictLabel(item.verdict)})
              </span>
            </div>

            <span className="text-[12px] text-slate-400 shrink-0 font-mono">
              {formatRelativeTime(item.scanned_at)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
