import React from "react";
import { Loader2 } from "lucide-react";

export const PreviewSkeleton: React.FC = () => {
  return (
    <div
      aria-busy="true"
      aria-label="Loading website preview"
      className="w-full bg-white rounded-[4px] border-2 sm:border-3 border-ink p-4 sm:p-5 shadow-[4px_4px_0px_#111111] space-y-4 animate-pulse"
    >
      {/* Mock Browser Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border border-ink bg-risk-high" />
          <div className="w-3 h-3 rounded-full border border-ink bg-risk-low" />
          <div className="w-3 h-3 rounded-full border border-ink bg-risk-safe" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-paper border border-ink rounded-[2px] w-48 sm:w-64">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-ink stroke-[2.5]" aria-hidden="true" />
          <span className="text-[11px] font-mono text-ink/70 uppercase tracking-wider font-bold truncate">
            Capturing preview...
          </span>
        </div>
        <div className="w-12 h-4 skeleton-block rounded-[2px]" />
      </div>

      {/* Mock Screenshot Viewport (16:10 aspect ratio) */}
      <div className="w-full aspect-[16/10] skeleton-block rounded-[2px] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-ink stroke-[2.5] mb-2" aria-hidden="true" />
        <span className="text-[13px] font-heading font-extrabold uppercase tracking-tight text-ink">
          Rendering in isolated browser
        </span>
        <span className="text-[11px] text-ink/70 font-sans mt-0.5">
          Safely inspecting destination content without executing code on your machine
        </span>
      </div>

      {/* Mock Metadata Rows */}
      <div className="space-y-3 pt-2">
        <div className="h-5 skeleton-block rounded-[2px] w-3/4" />
        <div className="h-3.5 skeleton-block rounded-[2px] w-full" />
        <div className="h-3.5 skeleton-block rounded-[2px] w-5/6" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-24 skeleton-block rounded-[2px]" />
          <div className="h-6 w-32 skeleton-block rounded-[2px]" />
        </div>
      </div>
    </div>
  );
};
