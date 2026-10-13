import React, { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

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
      className="w-full space-y-2"
      noValidate
      aria-label="URL Security Submission Form"
    >
      <div className="relative flex items-center bg-surface border border-surface-border rounded-xl focus-within:border-brand-teal/50 focus-within:ring-2 focus-within:ring-brand-teal/10 transition-all shadow-soft">
        <label htmlFor="url-input" className="sr-only">
          Target URL
        </label>
        <input
          id="url-input"
          type="text"
          value={inputUrl}
          onChange={(e) => {
            setInputUrl(e.target.value);
            if (localValidation) setLocalValidation(null);
          }}
          placeholder="Paste or type URL (e.g. https://example.com or http://192.168.0.1:8080)"
          aria-invalid={activeError ? "true" : "false"}
          aria-describedby={activeError ? "url-input-error" : undefined}
          disabled={isLoading}
          className="w-full bg-transparent px-4 py-3.5 text-sm text-slate-100 placeholder-slate-400 font-mono outline-none"
        />
        <div className="pr-2 shrink-0">
          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-brand-teal hover:bg-brand-teal-hover active:bg-brand-dim text-slate-950 font-medium text-xs tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>Checking</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>

      {activeError && (
        <p
          id="url-input-error"
          role="alert"
          className="text-xs text-rose-400 font-normal px-1"
        >
          {activeError}
        </p>
      )}
    </form>
  );
};
