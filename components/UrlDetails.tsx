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
    <div className="space-y-3 py-4 border-b-2 border-ink">
      <div className="flex items-center gap-2">
        <h4 className="text-[12px] font-heading font-extrabold uppercase tracking-wider text-ink bg-primary px-2 py-0.5 border border-ink rounded-[2px] shadow-brutal-sm inline-block">
          URL Details
        </h4>
      </div>

      <div className="divide-y-2 divide-ink rounded-[4px] border-2 border-ink bg-white overflow-hidden shadow-brutal-sm">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 hover:bg-paper/70 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 min-w-0 flex-1">
              <span className="text-[13px] font-heading font-bold text-ink sm:w-28 shrink-0 uppercase tracking-tight">
                {row.label}
              </span>
              <span className="font-mono font-medium text-[13px] text-ink break-all select-all">
                {row.value}
              </span>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(row.value, row.key)}
              className="self-end sm:self-center h-[34px] px-3 inline-flex items-center gap-1.5 rounded-[4px] border-2 border-ink bg-white hover:bg-primary text-[12px] font-heading font-bold text-ink shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 shrink-0 cursor-pointer"
              aria-label={`Copy ${row.label}`}
            >
              {copiedKey === row.key ? (
                <>
                  <Check className="w-3.5 h-3.5 text-ink stroke-[3]" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-ink stroke-[2.5]" aria-hidden="true" />
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
