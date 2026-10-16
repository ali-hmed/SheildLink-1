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
        cancelBtnRef.current?.focus();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onClose();
  };

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
      className="fixed inset-0 z-50 m-auto p-0 bg-transparent backdrop:bg-ink/60 w-[min(28rem,calc(100vw-32px))] max-h-[calc(100dvh-32px)] border-0 overflow-y-auto"
      aria-labelledby="open-site-dialog-title"
      aria-describedby="open-site-dialog-desc"
    >
      <div className="bg-white border-2 sm:border-3 border-ink rounded-[4px] shadow-[4px_4px_0px_#111111] sm:shadow-[6px_6px_0px_#111111] p-5 sm:p-6 space-y-4 animate-hard-fade-in">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-ink pb-3">
          <div className="space-y-1">
            <h3
              id="open-site-dialog-title"
              className="text-[18px] sm:text-[20px] font-heading font-extrabold text-ink leading-snug"
            >
              Open this site?
            </h3>
            <p className="font-mono text-[13px] font-bold text-ink bg-paper px-2 py-0.5 border border-ink rounded-[2px] inline-block break-all">
              {hostname}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[4px] border-2 border-ink bg-white hover:bg-primary text-ink shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
          </button>
        </div>

        {/* Informational notice */}
        <p id="open-site-dialog-desc" className="text-[14px] sm:text-[15px] text-ink font-medium leading-relaxed">
          LinkShield has not visited this site. It opens in a new tab.
        </p>

        {/* Warning if suspicious or high risk */}
        {isHighOrSuspicious && (
          <div className="p-3.5 rounded-[4px] bg-risk-high border-2 border-ink shadow-brutal-sm flex items-start gap-2.5 text-ink">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-ink stroke-[2.5]" aria-hidden="true" />
            <div className="text-[13px] font-bold leading-snug">
              This link has risk indicators. Only continue if you trust it.
            </div>
          </div>
        )}

        {/* Note if domain not found */}
        {isNotFound && (
          <div className="p-3.5 rounded-[4px] bg-risk-neutral border-2 border-ink shadow-brutal-sm text-ink text-[13px] font-bold">
            DNS lookup indicated the domain does not exist. The page will probably not load.
          </div>
        )}

        {/* Actions row: 44px buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t-2 border-ink">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-[44px] px-5 rounded-[4px] bg-white hover:bg-paper text-ink font-heading font-extrabold text-[14px] border-2 border-ink shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 cursor-pointer"
          >
            Cancel
          </button>

          {safeDestinationHref ? (
            <a
              href={safeDestinationHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={onClose}
              className={`w-full sm:w-auto h-[44px] inline-flex items-center justify-center gap-2 px-6 rounded-[4px] text-[14px] font-heading font-extrabold text-ink border-2 border-ink shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 cursor-pointer ${
                isHighOrSuspicious
                  ? "bg-risk-high hover:bg-risk-high"
                  : "bg-primary hover:bg-primary"
              }`}
            >
              <span>{isHighOrSuspicious ? "Open anyway" : "Open site"}</span>
              <ExternalLink className="w-4 h-4 text-ink stroke-[2.5]" aria-hidden="true" />
            </a>
          ) : (
            <span className="text-[13px] font-bold text-ink/70">Invalid or unsupported destination URL</span>
          )}
        </div>
      </div>
    </dialog>
  );
};
