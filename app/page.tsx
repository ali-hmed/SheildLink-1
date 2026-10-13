"use client";

import React, { useState, useEffect } from "react";
import { UrlForm } from "@/components/UrlForm";
import { ResultPanel } from "@/components/ResultPanel";
import { HistoryList } from "@/components/HistoryList";
import { ExampleChips } from "@/components/ExampleChips";
import { ScanResponse, HealthResponse, HistoryItem } from "@/lib/types";
import { scanUrl, fetchHealth, ApiError } from "@/lib/api";
import { loadHistory, saveScanToHistory, clearHistory } from "@/lib/history";
import {
  ShieldCheck,
  ShieldAlert,
  Info,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
} from "lucide-react";

export default function Home() {
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState(false);

  // Load history and health check on mount
  useEffect(() => {
    setHistory(loadHistory());
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
      setHealthError(false);
    } catch {
      setHealthError(true);
    }
  };

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
        setApiError("A network or server error occurred while scanning the URL.");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-between">
      {/* Top Navigation / Status Header */}
      <header className="border-b border-surface-border/60 bg-surface/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-teal/10 border border-brand-teal/30 flex items-center justify-center text-brand-teal">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
                LinkShield
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-raised text-brand-teal border border-surface-border">
                  SEC-ANALYZE
                </span>
              </span>
            </div>
          </div>

          {/* System Health & Reputation Provider Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    healthError ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                />
                API: {healthError ? "Offline" : "Online"}
              </span>
              <span>•</span>
              <span className="text-slate-300">
                Safe Browsing:{" "}
                {health?.reputation_provider === "configured" ? (
                  <span className="text-emerald-400 font-semibold">Active</span>
                ) : (
                  <span className="text-slate-400">Unconfigured</span>
                )}
              </span>
            </div>
            {healthError && (
              <button
                type="button"
                onClick={checkHealth}
                title="Retry connecting to API"
                className="p-1 rounded text-slate-400 hover:text-brand-teal transition-colors focus:outline-none focus:ring-1 focus:ring-brand-teal cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-5xl w-full mx-auto px-4 py-8 sm:px-6 flex-1 space-y-8">
        {/* Intro Banner */}
        <section className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            URL Security Analyzer
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Performs local static heuristic evaluation and reputation lookup without visiting,
            fetching, or following redirects from the remote host.
          </p>
        </section>

        {/* Scan Input Section */}
        <section className="space-y-3">
          <UrlForm
            onScan={handleScan}
            isLoading={isLoading}
            inputUrl={inputUrl}
            setInputUrl={setInputUrl}
            error={apiError}
          />
          <ExampleChips onSelect={handleSelectExample} disabled={isLoading} />
        </section>

        {/* Error Alert Box */}
        {apiError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-sm flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="font-semibold block mb-0.5">Analysis Request Error:</strong>
                <span>{apiError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleScan(inputUrl)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-medium focus:outline-none focus:ring-1 focus:ring-rose-400 transition-colors shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results Panel */}
        <div aria-live="polite" className="w-full">
          {currentResult && <ResultPanel result={currentResult} />}
        </div>

        {/* History List */}
        <HistoryList
          history={history}
          onSelect={handleSelectFromHistory}
          onClear={handleClearHistory}
        />

        {/* Heuristic Framework Explainer */}
        <section className="p-5 rounded-xl bg-surface/60 border border-surface-border text-xs text-slate-400 space-y-3">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Info className="w-4 h-4 text-brand-teal" aria-hidden="true" />
            <span>Inspection Methodology & Boundaries</span>
          </div>
          <p className="leading-relaxed">
            The risk score is a <strong className="text-slate-200">transparent heuristic calculation</strong>{" "}
            derived purely from structural, syntactical, and lexical signals (e.g. deceptive IP encodings,
            embedded user credentials, brand lookalikes in subdomains, and punycode). It never constitutes a
            mathematical probability of compromise.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-surface-border/40 text-[11px]">
            <div>
              <span className="font-semibold text-slate-300 block mb-0.5">1. Zero Outbound Visits</span>
              <span>The backend engine never opens TCP sockets or executes HTTP requests to the target host.</span>
            </div>
            <div>
              <span className="font-semibold text-slate-300 block mb-0.5">2. Safe Browsing Integration</span>
              <span>Optional check against Google Safe Browsing lists with strict 5s timeout and error isolation.</span>
            </div>
            <div>
              <span className="font-semibold text-slate-300 block mb-0.5">3. Clean Heuristic Baseline</span>
              <span>&ldquo;No issues detected&rdquo; signifies no anomalies identified by static rules, never a guarantee of safety.</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border/40 py-6 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-mono text-slate-400">
            LinkShield v1.0 • Pure Heuristic Static Analysis
          </span>
          <span className="text-slate-400">
            Built with Next.js App Router & FastAPI
          </span>
        </div>
      </footer>
    </div>
  );
}
