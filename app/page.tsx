"use client";

import React, { useState, useEffect } from "react";
import { UrlForm } from "@/components/UrlForm";
import { ResultPanel } from "@/components/ResultPanel";
import { HistoryList } from "@/components/HistoryList";
import { ExampleChips } from "@/components/ExampleChips";
import { ScanResponse, HealthResponse, HistoryItem } from "@/lib/types";
import { scanUrl, fetchHealth, ApiError } from "@/lib/api";
import { loadHistory, saveScanToHistory, clearHistory } from "@/lib/history";
import { Shield } from "lucide-react";

export default function Home() {
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
    fetchHealth()
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  const handleScan = async (urlToScan: string) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const result = await scanUrl(urlToScan);
      setCurrentResult(result);
      const updatedHistory = saveScanToHistory(result);
      setHistory(updatedHistory);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("Unable to analyze URL. Please check network connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExample = (url: string) => {
    setInputUrl(url);
    setApiError(null);
  };

  const handleSelectFromHistory = (item: ScanResponse) => {
    setCurrentResult(item);
    setInputUrl(item.input_url);
    setApiError(null);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-between selection:bg-brand-teal selection:text-slate-950">
      {/* Minimal Header */}
      <header className="border-b border-surface-border">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-teal" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight text-slate-200">
              LinkShield
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                health?.status === "ok" ? "bg-emerald-400" : "bg-slate-500"
              }`}
            />
            <span>
              {health?.reputation_provider === "configured"
                ? "Safe Browsing active"
                : "Local static engine"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto px-4 py-12 flex-1 space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-100">
            Static URL Security Analyzer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Inspect URLs for deception and structural risks without fetching or visiting the remote server.
          </p>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <UrlForm
            onScan={handleScan}
            isLoading={isLoading}
            inputUrl={inputUrl}
            setInputUrl={setInputUrl}
            error={apiError}
          />
          <ExampleChips onSelect={handleSelectExample} disabled={isLoading} />
        </div>

        {/* Results */}
        <div aria-live="polite" className="w-full">
          {currentResult && <ResultPanel result={currentResult} />}
        </div>

        {/* Recent Scans */}
        <HistoryList
          history={history}
          onSelect={handleSelectFromHistory}
          onClear={handleClearHistory}
        />
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-surface-border py-4 text-center text-[11px] text-slate-400">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
          <span>Heuristic risk score calculation • No remote connection</span>
          <span>FastAPI + Next.js</span>
        </div>
      </footer>
    </div>
  );
}
