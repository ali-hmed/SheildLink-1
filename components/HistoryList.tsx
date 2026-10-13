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
  if (history.length === 0) return null;

  const getVerdictPresentation = (verdict: string) => {
    switch (verdict) {
      case "high_risk":
        return {
          dotClass: "bg-verdict-high-text",
          label: "High Risk",
          textClass: "text-verdict-high-text",
        };
      case "suspicious":
        return {
          dotClass: "bg-verdict-suspicious-text",
          label: "Suspicious",
          textClass: "text-verdict-suspicious-text",
        };
      case "low_risk":
        return {
          dotClass: "bg-verdict-low-text",
          label: "Low Risk",
          textClass: "text-verdict-low-text",
        };
      case "no_issues_detected":
      default:
        return {
          dotClass: "bg-verdict-ok-text",
          label: "No Issues",
          textClass: "text-verdict-ok-text",
        };
    }
  };

  const formatTimeAgo = (isoString: string) => {
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
    <section aria-labelledby="history-heading" className="w-full pt-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 id="history-heading" className="text-sm font-semibold uppercase tracking-wider text-ink-3">
          Recent Scans
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-ink-3 hover:text-ink transition-colors px-2 py-1 rounded hover:bg-surface-soft cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Clear history
        </button>
      </div>

      <div className="divide-y divide-border">
        {history.map((item) => {
          const v = getVerdictPresentation(item.verdict);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.response)}
              className="w-full py-3.5 px-3 flex items-center justify-between text-left hover:bg-surface-soft rounded-xl transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${v.dotClass}`} aria-hidden="true" />
                <span className={`text-xs font-semibold ${v.textClass} shrink-0`}>
                  {v.label}
                </span>
                <span className="text-sm font-mono text-ink-2 truncate group-hover:text-ink font-medium">
                  {item.hostname}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs text-ink-3">
                <span className="font-mono">{item.risk_score} pts</span>
                <span>•</span>
                <span>{formatTimeAgo(item.scanned_at)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
