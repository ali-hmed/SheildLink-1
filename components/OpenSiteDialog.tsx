import React, { useEffect, useRef } from "react";
import { VerdictLevel, DomainLookupResult } from "@/lib/types";
import { AlertTriangle, ExternalLink, X } from "lucide-react";

interface OpenSiteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hostname: string;
  normalizedUrl: string;
  verdict: VerdictLevel;
  domainLookup?: DomainLookupResult;
}

export const OpenSiteDialog: React.FC<OpenSiteDialogProps> = ({
  isOpen,
  onClose,
  hostname,
  normalizedUrl,
  verdict,
  domainLookup,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        // Autofocus cancel button as required for safety
        cancelBtnRef.current?.focus();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Handle native ESC press
  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onClose();
  };

  // Validate URL with new URL() as http:/https: only
  let safeDestinationHref: string | null = null;
  try {
    const parsed = new URL(normalizedUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      safeDestinationHref = parsed.toString();
    }
  } catch {
    safeDestinationHref = null;
  }

  const isHighOrSuspicious = verdict === "high_risk" || verdict === "suspicious";
  const isNotFound = domainLookup?.status === "not_found";

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      className="fixed inset-0 z-50 m-auto p-0 bg-transparent backdrop:bg-ink/40 backdrop:backdrop-blur-sm max-w-lg w-[calc(100%-2rem)] rounded-2xl shadow-dialog border-0 overflow-visible"
      aria-labelledby="open-site-dialog-title"
      aria-describedby="open-site-dialog-desc"
    >
      <div className="bg-bg border border-border rounded-2xl p-6 sm:p-7 space-y-5 animate-fadeInSlide">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3
              id="open-site-dialog-title"
              className="text-xl sm:text-2xl font-bold text-ink"
            >
              Open this site?
            </h3>
            <p className="font-mono text-sm font-semibold text-ink-2 break-all">
              {hostname}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Informational notice */}
        <p id="open-site-dialog-desc" className="text-[15px] text-ink-2 leading-relaxed">
          LinkShield has not visited this site. It opens in a new tab.
        </p>

        {/* Warning if suspicious or high risk */}
        {isHighOrSuspicious && (
          <div className="p-4 rounded-xl bg-verdict-high-tint border border-verdict-high-border flex items-start gap-3 text-verdict-high-text">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm font-medium leading-snug">
              This link has risk indicators. Only continue if you trust it.
            </div>
          </div>
        )}

        {/* Note if domain not found */}
        {isNotFound && (
          <div className="p-3.5 rounded-xl bg-verdict-suspicious-tint border border-verdict-suspicious-border text-verdict-suspicious-text text-sm">
            DNS lookup indicated the domain does not exist. The page will probably not load.
          </div>
        )}

        {/* Actions row */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-surface-soft hover:bg-slate-200 text-ink font-semibold text-sm transition-colors border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer"
          >
            Cancel
          </button>

          {safeDestinationHref ? (
            <a
              href={safeDestinationHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={onClose}
              className={`w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer ${
                isHighOrSuspicious
                  ? "bg-verdict-high-text hover:bg-red-800"
                  : "bg-brand hover:bg-brand-hover active:bg-brand-press"
              }`}
            >
              <span>{isHighOrSuspicious ? "Open anyway" : "Open site"}</span>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          ) : (
            <span className="text-xs text-ink-3">Invalid or unsupported destination URL</span>
          )}
        </div>
      </div>
    </dialog>
  );
};
