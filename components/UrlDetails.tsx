import React from "react";

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
  let punycodeDecoded: string | null = null;
  if (hostname.toLowerCase().includes("xn--")) {
    try {
      const u = new URL(normalizedUrl.startsWith("http") ? normalizedUrl : `http://${normalizedUrl}`);
      punycodeDecoded = u.hostname !== hostname ? u.hostname : null;
    } catch {
      punycodeDecoded = null;
    }
  }

  return (
    <div className="space-y-2 py-3 border-b border-border">
      <h4 className="text-[12px] font-semibold uppercase tracking-wider text-ink-3">
        URL Details
      </h4>

      <div className="space-y-1.5 font-mono text-[13px] sm:text-[14px]">
        {/* Hostname */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 p-2.5 rounded-[10px] bg-surface-soft border border-border">
          <span className="text-[12px] font-sans font-medium text-ink-3 sm:w-24 shrink-0">
            Hostname:
          </span>
          <span className="font-semibold text-ink break-all select-all">
            {hostname}
          </span>
          {punycodeDecoded && (
            <span className="text-[12px] text-ink-2 bg-white px-1.5 py-0.5 rounded border border-border font-mono">
              Decoded: {punycodeDecoded}
            </span>
          )}
        </div>

        {/* Normalized URL */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2.5 p-2.5 rounded-[10px] bg-surface-soft border border-border">
          <span className="text-[12px] font-sans font-medium text-ink-3 sm:w-24 shrink-0 pt-0.5">
            Normalized:
          </span>
          <span className="text-ink-2 break-all select-all font-mono">
            {normalizedUrl}
          </span>
        </div>

        {/* Original Input */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2.5 p-2.5 rounded-[10px] bg-surface-soft border border-border">
          <span className="text-[12px] font-sans font-medium text-ink-3 sm:w-24 shrink-0 pt-0.5">
            Original:
          </span>
          <span className="text-ink-3 break-all select-all font-mono">
            {inputUrl}
          </span>
        </div>
      </div>
    </div>
  );
};
