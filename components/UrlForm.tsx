import React, { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";

interface UrlFormProps {
  onScan: (url: string) => Promise<void>;
  isLoading: boolean;
  inputUrl: string;
  setInputUrl: (url: string) => void;
  error: string | null;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onRetry?: () => void;
}

export const UrlForm: React.FC<UrlFormProps> = ({
  onScan,
  isLoading,
  inputUrl,
  setInputUrl,
  error,
  inputRef,
  onRetry,
}) => {
  const [localValidation, setLocalValidation] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setLocalValidation("Please enter a link to inspect.");
      return;
    }
    if (trimmed.length > 2048) {
      setLocalValidation("URL exceeds 2048 characters limit.");
      return;
    }
    setLocalValidation(null);
    onScan(trimmed);
  };

  const activeError = localValidation || error;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-3"
      noValidate
      aria-label="URL Security Submission Form"
    >
      {/* 64px desktop / 56px mobile input row */}
      <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white border border-border rounded-[20px] shadow-layered focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2 transition-all p-1.5 sm:p-2 gap-2 sm:gap-3">
        <label htmlFor="url-input" className="sr-only">
          Paste a link to analyze
        </label>
        <input
          ref={inputRef}
          id="url-input"
          type="text"
          value={inputUrl}
          onChange={(e) => {
            setInputUrl(e.target.value);
            if (localValidation) setLocalValidation(null);
          }}
          placeholder="Paste a link (e.g. https://example.com or http://192.168.0.1:8080)"
          aria-invalid={activeError ? "true" : "false"}
          aria-describedby={activeError ? "url-input-error" : "url-input-helper"}
          disabled={isLoading}
          className="w-full bg-transparent px-4 sm:px-5 h-[48px] sm:h-[52px] text-base sm:text-[18px] text-ink placeholder-ink-3 font-mono outline-none"
        />

        <div className="shrink-0 flex items-center justify-end">
          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full sm:w-auto h-[48px] min-w-[120px] px-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand hover:bg-brand-hover active:bg-brand-press text-white font-semibold text-base sm:text-[17px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer shadow-soft"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <span>Scan</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Helper text */}
      <p id="url-input-helper" className="text-sm text-ink-3 px-2">
        Paste a link. We analyze it without opening it.
      </p>

      {/* Error display with Retry button */}
      {activeError && (
        <div
          id="url-input-error"
          role="alert"
          className="p-4 rounded-2xl bg-verdict-high-tint border border-verdict-high-border text-verdict-high-text text-sm flex items-center justify-between gap-3 animate-fadeInSlide"
        >
          <span>{activeError}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs font-semibold underline hover:no-underline px-2 py-1 rounded bg-white border border-verdict-high-border text-verdict-high-text shrink-0 cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </form>
  );
};
