"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

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

  // Autofocus on desktop only
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      inputRef?.current?.focus();
    }
  }, [inputRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setLocalValidation("Please enter a URL to inspect.");
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
      {/* 
        Desktop (>=640px): one single row, input flex-1 h-56px, rounded-xl, 1px border.
        Scan button inside field on the right (h-48px), fixed horizontal padding, never wrapping.
        Mobile (<640px): stacked in two lines, input line 1, button line 2 (48px, gap-3).
      */}
      <div className="flex flex-col sm:relative gap-3 sm:gap-0 w-full">
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
          placeholder="Paste any URL, e.g. example.com"
          aria-invalid={activeError ? "true" : "false"}
          disabled={isLoading}
          className={`w-full h-[48px] sm:h-[56px] px-4 sm:pr-[118px] text-[16px] rounded-xl border border-[#EAECF0] bg-white outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors truncate ${
            inputUrl ? "font-mono text-[#111111]" : "font-sans text-slate-400"
          } placeholder:font-sans placeholder:text-slate-400`}
        />

        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="w-full sm:w-auto h-[48px] px-6 inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-lg bg-accent hover:bg-accent-hover text-white text-[15px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer shrink-0 sm:absolute sm:right-1 sm:top-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
              <span>Scanning...</span>
            </>
          ) : (
            <span>Scan</span>
          )}
        </button>
      </div>

      {/* Error display with clear message and Retry */}
      {activeError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-risk-high-bg border border-risk-high-border text-risk-high text-[14px] flex items-center justify-between gap-3 animate-fade-in"
        >
          <span className="leading-snug">{activeError}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-[13px] font-semibold underline hover:no-underline px-2.5 py-1 rounded bg-white border border-risk-high-border text-risk-high shrink-0 cursor-pointer min-h-[36px]"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </form>
  );
};
