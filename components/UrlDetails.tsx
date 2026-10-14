"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface UrlDetailsProps {
  inputUrl: string;
  normalizedUrl: string;
  hostname: string;
}

export const UrlDetails: React.FC<UrlDetailsProps> = ({
  inputUrl,
  normalizedUrl,
  hostname,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const rows = [
    { key: "hostname", label: "Hostname", value: hostname },
    { key: "normalized", label: "Normalized", value: normalizedUrl },
    { key: "original", label: "Original", value: inputUrl },
  ];

  return (
    <div className="space-y-3 py-4 border-b border-[#EAECF0]">
      <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">
        URL Details
      </h4>

      <div className="divide-y divide-[#EAECF0] rounded-xl border border-[#EAECF0] bg-white overflow-hidden">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 min-w-0 flex-1">
              <span className="text-[13px] font-medium text-slate-500 sm:w-24 shrink-0">
                {row.label}
              </span>
              <span className="font-mono text-[13px] text-[#111111] break-all select-all">
                {row.value}
              </span>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(row.value, row.key)}
              className="self-end sm:self-center h-[34px] px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[#EAECF0] bg-white hover:bg-slate-50 text-[12px] font-medium text-slate-600 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent cursor-pointer"
              aria-label={`Copy ${row.label}`}
            >
              {copiedKey === row.key ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
                  <span className="text-green-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
