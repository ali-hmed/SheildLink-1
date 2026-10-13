import React from "react";
import { HistoryItem, ScanResponse } from "@/lib/types";
import { Clock, Trash2, ArrowUpRight } from "lucide-react";

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

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "high_risk":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      case "suspicious":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "low_risk":
        return "text-sky-400 bg-sky-500/10 border-sky-500/30";
      default:
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    }
  };

  return (
    <div className="w-full p-4 sm:p-5 rounded-xl bg-surface border border-surface-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-teal" aria-hidden="true" />
          Recent Local Scans (Last 10)
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-rose-400 inline-flex items-center gap-1 transition-colors focus:outline-none focus:underline cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Clear History</span>
        </button>
      </div>

      <ul className="divide-y divide-surface-border/40 list-none p-0 m-0">
        {history.map((item) => (
          <li
            key={item.id}
            className="py-2.5 flex items-center justify-between gap-3 group"
          >
            <button
              type="button"
              onClick={() => onSelect(item.response)}
              className="text-left flex-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-brand-teal rounded px-1.5 py-1 -mx-1.5 transition-colors group-hover:bg-surface-raised/60 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-slate-200 truncate block">
                  {item.hostname}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  {new Date(item.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-md">
                {item.normalized_url}
              </p>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getVerdictColor(
                  item.verdict
                )}`}
              >
                {item.risk_score} pts
              </span>
              <button
                type="button"
                onClick={() => onSelect(item.response)}
                title="View scan details"
                className="p-1 rounded text-slate-400 hover:text-brand-teal transition-colors focus:outline-none focus:ring-1 focus:ring-brand-teal cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
