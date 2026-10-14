"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ResultPanel } from "@/components/ResultPanel";
import { HistoryList } from "@/components/HistoryList";
import { HowItWorks } from "@/components/HowItWorks";
import { Limitations } from "@/components/Limitations";
import { Footer } from "@/components/Footer";
import { ScanResponse, HistoryItem } from "@/lib/types";
import { scanUrl, ApiError } from "@/lib/api";
import { loadHistory, saveScanToHistory, clearHistory } from "@/lib/history";

export default function Home() {
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const lastScannedUrl = useRef<string>("");

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleScan = async (urlToScan: string) => {
    setIsLoading(true);
    setApiError(null);
    lastScannedUrl.current = urlToScan;
    setInputUrl(urlToScan);

    try {
      const result = await scanUrl(urlToScan);
      setCurrentResult(result);
      const updatedHistory = saveScanToHistory(result);
      setHistory(updatedHistory);

      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
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
    handleScan(url);
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
    <div className="min-h-screen bg-white text-slate-600 flex flex-col justify-between overflow-x-hidden">
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50 px-3.5 py-1.5 bg-accent text-white font-medium text-sm rounded-lg outline-none ring-2 ring-accent ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Header container: max-w-[1200px] */}
      <Header />

      <main id="main-content" className="w-full flex-1">
        {/* Hero container: max-w-[880px] */}
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

        {/* Results Section container: max-w-[760px], 56px desktop / 40px mobile below hero */}
        {(isLoading || currentResult) && (
          <div
            ref={resultsRef}
            aria-live="polite"
            className="w-full max-w-[760px] mx-auto px-5 sm:px-8 mt-10 sm:mt-14"
          >
            {isLoading && !currentResult && (
              <div
                className="w-full p-5 sm:p-6 rounded-2xl border border-[#EAECF0] bg-white space-y-4 animate-pulse"
                aria-busy="true"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="h-5 bg-slate-200 rounded-md w-28" />
                </div>
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="divide-y divide-[#EAECF0] rounded-xl border border-[#EAECF0] bg-white overflow-hidden mt-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-3.5 space-y-2">
                      <div className="h-3.5 bg-slate-200 rounded w-24" />
                      <div className="h-3 bg-slate-100 rounded w-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentResult && (
              <ResultPanel
                result={currentResult}
                onScanAnother={handleScanAnother}
                onRescan={handleScan}
              />
            )}
          </div>
        )}

        {/* Recent Scans container: max-w-[760px], 72px desktop / 48px mobile gap */}
        {history.length > 0 && (
          <div className="w-full max-w-[760px] mx-auto px-5 sm:px-8 mt-12 sm:mt-[72px]">
            <HistoryList
              history={history}
              onSelect={handleSelectFromHistory}
              onClear={handleClearHistory}
            />
          </div>
        )}

        {/* How It Works container: max-w-[760px], 72px desktop / 48px mobile gap */}
        <div className="w-full mt-12 sm:mt-[72px]">
          <HowItWorks />
        </div>

        {/* Limitations container: max-w-[760px], 72px desktop / 48px mobile gap */}
        <div className="w-full mt-12 sm:mt-[72px]">
          <Limitations />
        </div>
      </main>

      {/* Footer container: max-w-[1200px] */}
      <Footer />
    </div>
  );
}
