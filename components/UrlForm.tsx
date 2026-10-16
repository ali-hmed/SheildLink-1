"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertOctagon } from "lucide-react";

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
      className="w-full space-y-4"
      noValidate
      aria-label="URL Security Submission Form"
    >
      {/* 
        Desktop (>=640px): one single row, 3px border, 5px hard shadow.
        Mobile (<640px): stacked two lines, 2px border, 3px hard shadow.
        Scan button: yellow, hover translates (-2px, -2px) shadow 7px, active translates (2px, 2px) shadow 0.
      */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-3.5 items-stretch w-full">
        <label htmlFor="url-input" className="sr-only">
          Paste a link to analyze
        </label>
        <div className="flex-1 relative">
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
            className={`w-full h-[48px] sm:h-[56px] px-4 text-[16px] rounded-[4px] border-2 sm:border-3 border-ink bg-white shadow-[3px_3px_0px_#111111] sm:shadow-[5px_5px_0px_#111111] outline-none transition-colors truncate ${
              inputUrl ? "font-mono font-medium text-ink" : "font-sans text-stone-500"
            } placeholder:font-sans placeholder:text-stone-400`}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="w-full sm:w-auto h-[48px] sm:h-[56px] px-8 inline-flex items-center justify-center gap-2 rounded-[4px] border-2 sm:border-3 border-ink bg-primary text-ink font-heading font-extrabold text-[16px] sm:text-[17px] tracking-tight shadow-[3px_3px_0px_#111111] sm:shadow-[5px_5px_0px_#111111] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#111111] sm:hover:shadow-[7px_7px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 ease-out disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin shrink-0 text-ink stroke-[2.5]" aria-hidden="true" />
              <span>Scanning...</span>
            </>
          ) : (
            <span>Scan</span>
          )}
        </button>
      </div>

      {/* High-red bordered banner error state */}
      {activeError && (
        <div
          role="alert"
          className="p-3.5 sm:p-4 rounded-[4px] bg-risk-high border-2 sm:border-3 border-ink text-ink shadow-brutal flex items-center justify-between gap-3 animate-hard-fade-in font-medium text-[14px]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertOctagon className="w-5 h-5 text-ink shrink-0 stroke-[2.5]" aria-hidden="true" />
            <span className="leading-snug break-words font-semibold">{activeError}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1 rounded-[4px] bg-white border-2 border-ink text-ink font-bold text-[13px] shadow-brutal-sm hover:bg-primary active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 shrink-0 cursor-pointer min-h-[38px]"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </form>
  );
};
