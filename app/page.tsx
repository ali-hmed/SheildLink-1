"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ResultPanel } from "@/components/ResultPanel";
import { HistoryList } from "@/components/HistoryList";
import { HowItWorks } from "@/components/HowItWorks";
import { Limitations } from "@/components/Limitations";
import { Footer } from "@/components/Footer";
import { ScanResponse, HealthResponse, HistoryItem } from "@/lib/types";
import { scanUrl, fetchHealth, ApiError } from "@/lib/api";
import { loadHistory, saveScanToHistory, clearHistory } from "@/lib/history";

export default function Home() {
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const lastScannedUrl = useRef<string>("");

  useEffect(() => {
    setHistory(loadHistory());
    fetchHealth()
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  const handleScan = async (urlToScan: string) => {
    setIsLoading(true);
    setApiError(null);
    lastScannedUrl.current = urlToScan;

    try {
      const result = await scanUrl(urlToScan);
      setCurrentResult(result);
      const updatedHistory = saveScanToHistory(result);
      setHistory(updatedHistory);

      // Smooth scroll to results and focus heading
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          const heading = resultsRef.current.querySelector<HTMLElement>("h3");
          heading?.focus();
        }
      }, 100);
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

  const handleRetry = () => {
    if (lastScannedUrl.current) {
      handleScan(lastScannedUrl.current);
    }
  };

  const handleSelectExample = (url: string) => {
    setInputUrl(url);
    setApiError(null);
    inputRef.current?.focus();
  };

  const handleSelectFromHistory = (item: ScanResponse) => {
    setCurrentResult(item);
    setInputUrl(item.input_url);
    setApiError(null);
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleScanAnother = () => {
    setInputUrl("");
    setCurrentResult(null);
    setApiError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between selection:bg-brand-tint selection:text-brand">
      {/* Skip to main content accessible link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50 px-3.5 py-1.5 bg-brand text-white font-semibold text-sm rounded-lg shadow-soft outline-none ring-2 ring-brand ring-offset-2"
      >
        Skip to main content
      </a>

      {/* 1. Header (60px tall) */}
      <Header health={health} />

      {/* Main page content container: max-w 64rem (1024px), side padding 24px desktop / 16px mobile, section gap 48-56px desktop / 32px mobile */}
      <main id="main-content" className="w-full max-w-[64rem] mx-auto px-4 sm:px-6 flex-1 space-y-8 sm:space-y-12">
        {/* 2. Hero with calibrated soft glows, clamp H1, 16px subtext, and scan bar */}
        <Hero
          onScan={handleScan}
          isLoading={isLoading}
          inputUrl={inputUrl}
          setInputUrl={setInputUrl}
          error={apiError}
          onSelectExample={handleSelectExample}
          inputRef={inputRef}
          onRetry={handleRetry}
        />

        {/* 3. Results Section: column max-width 44rem */}
        <div ref={resultsRef} aria-live="polite" className="w-full max-w-[44rem] mx-auto">
          {isLoading && !currentResult && (
            <div className="w-full p-4 sm:p-5 rounded-[14px] bg-surface-soft border border-border animate-pulse space-y-4" aria-busy="true">
              <div className="h-6 bg-slate-200 rounded-md w-1/3" />
              <div className="h-4 bg-slate-200 rounded-md w-2/3" />
              <div className="h-20 bg-slate-200 rounded-lg w-full" />
            </div>
          )}

          {currentResult && (
            <ResultPanel
              result={currentResult}
              onScanAnother={handleScanAnother}
            />
          )}
        </div>

        {/* 4. Recent Scans: column max-width 44rem (rendered only if history exists) */}
        {history.length > 0 && (
          <div className="w-full max-w-[44rem] mx-auto">
            <HistoryList
              history={history}
              onSelect={handleSelectFromHistory}
              onClear={handleClearHistory}
            />
          </div>
        )}

        {/* 5. How It Works */}
        <div className="w-full">
          <HowItWorks />
        </div>

        {/* 6. Limitations */}
        <div className="w-full">
          <Limitations />
        </div>
      </main>

      {/* 7. Footer */}
      <Footer />
    </div>
  );
}
