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
      className="w-full space-y-2.5"
      noValidate
      aria-label="URL Security Submission Form"
    >
      {/* 52px desktop / 48px mobile input row, radius 14px, horizontal padding 16px */}
      <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white border border-border rounded-[14px] shadow-layered focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2 transition-all p-1 sm:p-1.5 gap-2 sm:gap-2">
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
          className="w-full bg-transparent px-3 sm:px-4 h-[44px] sm:h-[46px] text-[15px] sm:text-[16px] text-ink placeholder-ink-3 font-mono outline-none"
        />

        <div className="shrink-0 flex items-center justify-end">
          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full sm:w-auto h-[48px] sm:h-[40px] min-w-[104px] px-4 inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-brand hover:bg-brand-hover active:bg-brand-press text-white font-semibold text-[15px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer shadow-soft"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
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

      {/* Helper text: 14px */}
      <p id="url-input-helper" className="text-[14px] text-ink-3 px-1">
        Paste a link. We analyze it without opening it.
      </p>

      {/* Error display with Retry button */}
      {activeError && (
        <div
          id="url-input-error"
          role="alert"
          className="p-3.5 rounded-[12px] bg-verdict-high-tint border border-verdict-high-border text-verdict-high-text text-[14px] flex items-center justify-between gap-3 animate-fadeInSlide"
        >
          <span>{activeError}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-[13px] font-semibold underline hover:no-underline px-2 py-0.5 rounded bg-white border border-verdict-high-border text-verdict-high-text shrink-0 cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </form>
  );
};
