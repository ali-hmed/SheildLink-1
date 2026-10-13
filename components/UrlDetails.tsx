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
  // Check if hostname contains punycode (xn--)
  let punycodeDecoded: string | null = null;
  if (hostname.toLowerCase().includes("xn--")) {
    try {
      // Decode punycode using native URL host decoding or toUnicode
      // Modern URL parsing in browsers decodes punycode in href/host when parsed
      const u = new URL(normalizedUrl.startsWith("http") ? normalizedUrl : `http://${normalizedUrl}`);
      // If the browser decodes it, or via search
      punycodeDecoded = u.hostname !== hostname ? u.hostname : null;
    } catch {
      punycodeDecoded = null;
    }
  }

  return (
    <div className="space-y-3 py-4 border-b border-border">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
        URL Details
      </h4>

      <div className="space-y-2.5 font-mono text-sm">
        {/* Hostname */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-3 rounded-xl bg-surface-soft border border-border">
          <span className="text-xs font-sans font-medium text-ink-3 sm:w-28 shrink-0">
            Hostname:
          </span>
          <span className="font-semibold text-ink break-all select-all">
            {hostname}
          </span>
          {punycodeDecoded && (
            <span className="text-xs text-ink-2 bg-white px-2 py-0.5 rounded border border-border font-mono">
              Decoded: {punycodeDecoded}
            </span>
          )}
        </div>

        {/* Normalized URL */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 p-3 rounded-xl bg-surface-soft border border-border">
          <span className="text-xs font-sans font-medium text-ink-3 sm:w-28 shrink-0 pt-0.5">
            Normalized:
          </span>
          <span className="text-ink-2 text-xs sm:text-sm break-all select-all font-mono">
            {normalizedUrl}
          </span>
        </div>

        {/* Original Input */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 p-3 rounded-xl bg-surface-soft border border-border">
          <span className="text-xs font-sans font-medium text-ink-3 sm:w-28 shrink-0 pt-0.5">
            Original Input:
          </span>
          <span className="text-ink-3 text-xs sm:text-sm break-all select-all font-mono">
            {inputUrl}
          </span>
        </div>
      </div>
    </div>
  );
};
