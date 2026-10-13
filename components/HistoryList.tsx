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

  const getVerdictDot = (verdict: string) => {
    switch (verdict) {
      case "high_risk":
        return "bg-rose-400";
      case "suspicious":
        return "bg-amber-400";
      case "low_risk":
        return "bg-sky-400";
      default:
        return "bg-emerald-400";
    }
  };

  return (
    <div className="w-full pt-2">
      <div className="flex items-center justify-between pb-2 border-b border-surface-border text-xs text-slate-400">
        <span className="font-medium text-slate-400">Recent Scans</span>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>

      <div className="divide-y divide-surface-border/50">
        {history.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.response)}
            className="w-full py-2.5 flex items-center justify-between text-left hover:text-slate-100 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getVerdictDot(item.verdict)}`} />
              <span className="text-xs font-mono text-slate-300 truncate group-hover:text-slate-100">
                {item.hostname}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-slate-400">
              <span>{item.risk_score} pts</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
