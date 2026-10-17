"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ResultPanel } from "@/components/ResultPanel";
import { HistoryList } from "@/components/HistoryList";
import { HowItWorks } from "@/components/HowItWorks";
import { Limitations } from "@/components/Limitations";
import { Footer } from "@/components/Footer";
import { ScanResponse, HistoryItem, PreviewResponse } from "@/lib/types";
import { scanUrl, fetchPreview, ApiError } from "@/lib/api";
import { loadHistory, saveScanToHistory, clearHistory } from "@/lib/history";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanResponse | null>(null);
  const [currentPreview, setCurrentPreview] = useState<PreviewResponse | null>(null);
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
    setIsPreviewLoading(true);
    setApiError(null);
    setCurrentPreview(null);
    lastScannedUrl.current = urlToScan;
    setInputUrl(urlToScan);

    // 1. Kick off website preview concurrently without blocking the security scan
    fetchPreview(urlToScan)
      .then((previewData) => {
        setCurrentPreview(previewData);
      })
      .catch((err) => {
        console.warn("[LinkShield] Preview fetch warning:", err);
      })
      .finally(() => {
        setIsPreviewLoading(false);
      });

    // 2. Execute security scan
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

  const handleRetryScan = () => {
    if (lastScannedUrl.current) {
      handleScan(lastScannedUrl.current);
    }
  };

  const handleRetryPreview = async () => {
    if (!lastScannedUrl.current) return;
    setIsPreviewLoading(true);
    try {
      const previewData = await fetchPreview(lastScannedUrl.current);
      setCurrentPreview(previewData);
    } catch (err) {
      console.warn("[LinkShield] Preview retry error:", err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSelectFromHistory = (item: ScanResponse) => {
    setCurrentResult(item);
    setInputUrl(item.input_url);
    setApiError(null);
    lastScannedUrl.current = item.input_url;

    // Load preview for selected history entry
    setIsPreviewLoading(true);
    setCurrentPreview(null);
    fetchPreview(item.input_url)
      .then((data) => setCurrentPreview(data))
      .catch((err) => console.warn("[LinkShield] History item preview error:", err))
      .finally(() => setIsPreviewLoading(false));

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
    setCurrentPreview(null);
    setApiError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between overflow-x-hidden selection:bg-primary selection:text-ink">
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50 px-4 py-2 bg-primary text-ink font-heading font-extrabold text-sm border-2 border-ink rounded-[4px] shadow-brutal outline-none"
      >
        Skip to main content
      </a>

      {/* Header container: max-w-[1200px] */}
      <Header />

      <main id="main-content" className="w-full flex-1 pb-10">
        {/* Hero container: max-w-[880px] */}
        <Hero
          onScan={handleScan}
          isLoading={isLoading}
          inputUrl={inputUrl}
          setInputUrl={setInputUrl}
          error={apiError}
          inputRef={inputRef}
          onRetry={handleRetryScan}
        />

        {/* Results Section container: max-w-[1200px] for balanced 2-column layout */}
        {(isLoading || currentResult) && (
          <div
            ref={resultsRef}
            aria-live="polite"
            className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-14 scroll-mt-20 sm:scroll-mt-24"
          >
            {/* Blocky striped Neo-Brutalist skeleton loader while initial scan executes */}
            {isLoading && !currentResult && (
              <div
                className="w-full max-w-[760px] mx-auto bg-white rounded-[4px] border-2 sm:border-3 border-ink p-5 sm:p-6 shadow-[4px_4px_0px_#111111] sm:shadow-[6px_6px_0px_#111111] space-y-4"
                aria-busy="true"
              >
                <div className="flex items-center justify-between border-b-2 border-ink pb-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-ink stroke-[2.5]" aria-hidden="true" />
                    <span className="font-heading font-extrabold text-lg text-ink uppercase tracking-tight">
                      Analyzing URL &amp; Link Intelligence...
                    </span>
                  </div>
                  <div className="w-24 h-6 border-2 border-ink bg-primary rounded-[2px]" />
                </div>

                <div className="h-5 skeleton-block rounded-[2px] w-3/4" />

                <div className="divide-y-2 divide-ink rounded-[4px] border-2 border-ink bg-white overflow-hidden mt-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-3.5 space-y-2">
                      <div className="h-4 skeleton-block rounded-[2px] w-36" />
                      <div className="h-3.5 skeleton-block rounded-[2px] w-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentResult && (
              <ResultPanel
                result={currentResult}
                preview={currentPreview}
                previewLoading={isPreviewLoading}
                onScanAnother={handleScanAnother}
                onRescan={handleScan}
                onRetryPreview={handleRetryPreview}
              />
            )}
          </div>
        )}

        {/* Recent Scans container: max-w-[880px], 72px desktop / 48px mobile gap */}
        {history.length > 0 && (
          <div className="w-full max-w-[880px] mx-auto px-5 sm:px-8 mt-12 sm:mt-[72px]">
            <HistoryList
              history={history}
              onSelect={handleSelectFromHistory}
              onClear={handleClearHistory}
            />
          </div>
        )}

        {/* How It Works container: max-w-[880px], 72px desktop / 48px mobile gap */}
        <div className="w-full mt-12 sm:mt-[72px]">
          <HowItWorks />
        </div>

        {/* Limitations container: max-w-[880px], 72px desktop / 48px mobile gap */}
        <div className="w-full mt-12 sm:mt-[72px]">
          <Limitations />
        </div>
      </main>

      {/* Footer container: max-w-[1200px] */}
      <Footer />
    </div>
  );
}
