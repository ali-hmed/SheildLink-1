"use client";

import React, { useState } from "react";
import { ScanResponse, PreviewResponse } from "@/lib/types";
import { WebsitePreview } from "./WebsitePreview";
import { PreviewSkeleton } from "./PreviewSkeleton";
import { SecurityIntelligence } from "./SecurityIntelligence";
import { UrlDetails } from "./UrlDetails";
import { OpenSiteDialog } from "./OpenSiteDialog";

interface ResultPanelProps {
  result: ScanResponse;
  preview: PreviewResponse | null;
  previewLoading?: boolean;
  onScanAnother: () => void;
  onRescan?: (url: string) => void;
  onRetryPreview?: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  preview,
  previewLoading = false,
  onScanAnother,
  onRescan,
  onRetryPreview,
}) => {
  const [isSiteDialogOpen, setIsSiteDialogOpen] = useState(false);

  const handleOpenSiteRequest = () => {
    // If high risk or suspicious, gate with explicit security warning modal
    if (result.verdict === "high_risk" || result.verdict === "suspicious") {
      setIsSiteDialogOpen(true);
    } else {
      // Safe or low risk: still open in new tab with noopener noreferrer
      window.open(result.normalized_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="w-full space-y-6 animate-hard-fade-in">
      {/* Responsive Two-Column Layout on Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column: Website Preview & URL Details (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-6 w-full min-w-0">
          {previewLoading && !preview ? (
            <PreviewSkeleton />
          ) : (
            <WebsitePreview
              preview={preview}
              isLoading={previewLoading}
              onRetry={onRetryPreview}
              verdict={result.verdict}
            />
          )}

          <div className="w-full bg-white rounded-[4px] border-2 sm:border-3 border-ink p-4 sm:p-5 shadow-[4px_4px_0px_#111111]">
            <UrlDetails
              inputUrl={result.input_url}
              normalizedUrl={result.normalized_url}
              hostname={result.hostname}
            />
          </div>
        </div>

        {/* Complementary Column: Security Intelligence & Checks (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-6 w-full min-w-0">
          <SecurityIntelligence
            result={result}
            onScanAnother={onScanAnother}
            onRescan={onRescan}
            onOpenSiteRequest={handleOpenSiteRequest}
          />
        </div>
      </div>

      {/* Safety Gated Navigation Confirmation Modal */}
      <OpenSiteDialog
        isOpen={isSiteDialogOpen}
        onClose={() => setIsSiteDialogOpen(false)}
        hostname={result.hostname}
        normalizedUrl={result.normalized_url}
        verdict={result.verdict}
        domainLookup={result.domain_lookup}
      />
    </div>
  );
};
