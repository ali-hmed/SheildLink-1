import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface UrlFormProps {
  onScan: (url: string) => Promise<void>;
  isLoading: boolean;
  inputUrl: string;
  setInputUrl: (url: string) => void;
  error: string | null;
}

export const UrlForm: React.FC<UrlFormProps> = ({
  onScan,
  isLoading,
  inputUrl,
  setInputUrl,
  error,
}) => {
  const [localValidation, setLocalValidation] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setLocalValidation("Please enter a URL to inspect.");
      return;
    }
    if (trimmed.length > 2048) {
      setLocalValidation("URL exceeds maximum length of 2048 characters.");
      return;
    }
    setLocalValidation(null);
    onScan(trimmed);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputUrl(e.target.value);
    if (localValidation) setLocalValidation(null);
  };

  const activeError = localValidation || error;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-2"
      noValidate
      aria-label="URL Security Submission Form"
    >
      <div className="relative flex flex-col sm:flex-row items-stretch gap-2">
        <div className="relative flex-1">
          <label htmlFor="url-input" className="sr-only">
            Target URL to analyze
          </label>
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" aria-hidden="true" />
          </div>
          <input
            id="url-input"
            type="text"
            value={inputUrl}
            onChange={handleInputChange}
            placeholder="Enter URL to inspect (e.g. http://192.168.0.1:8080/login or https://example.com)"
            aria-invalid={activeError ? "true" : "false"}
            aria-describedby={activeError ? "input-error-msg" : undefined}
            disabled={isLoading}
            className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-xl font-mono text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-colors ${
              activeError ? "border-rose-500/80 ring-1 ring-rose-500/50" : "border-surface-border"
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-teal hover:bg-brand-teal-hover active:bg-brand-teal-dim text-slate-950 font-bold text-sm tracking-wide transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" aria-hidden="true" />
              <span>Analyzing...</span>
            </>
          ) : (
            <span>Scan URL</span>
          )}
        </button>
      </div>

      {activeError && (
        <div
          id="input-error-msg"
          role="alert"
          className="text-xs text-rose-400 font-medium px-1 flex items-center gap-1.5"
        >
          <span>•</span>
          <span>{activeError}</span>
        </div>
      )}
    </form>
  );
};
