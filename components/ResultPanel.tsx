"use client";

import React, { useState } from "react";
import { ScanResponse, PreviewResponse } from "@/lib/types";
import { WebsiteReviewIntel } from "./WebsiteReviewIntel";
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
  const [targetUrlToOpen, setTargetUrlToOpen] = useState<string>("");

  const handleOpenSiteRequest = (urlToOpen: string) => {
    setTargetUrlToOpen(urlToOpen || result.normalized_url);
    // If high risk or suspicious, gate with explicit security warning confirmation dialog
    if (result.verdict === "high_risk" || result.verdict === "suspicious") {
      setIsSiteDialogOpen(true);
    } else {
      // Safe or low risk: open directly in new tab with noopener noreferrer
      window.open(urlToOpen || result.normalized_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="w-full space-y-6 animate-hard-fade-in">
      {/* Website Review Intel as the Dominant Primary Card */}
      <WebsiteReviewIntel
        result={result}
        preview={preview}
        previewLoading={previewLoading}
        onScanAnother={onScanAnother}
        onRescan={onRescan}
        onRetryPreview={onRetryPreview}
        onOpenSiteRequest={handleOpenSiteRequest}
      />

      {/* Safety Gated Navigation Confirmation Modal for Risky/Suspicious Destinations */}
      <OpenSiteDialog
        isOpen={isSiteDialogOpen}
        onClose={() => setIsSiteDialogOpen(false)}
        hostname={result.hostname}
        normalizedUrl={targetUrlToOpen || result.normalized_url}
        verdict={result.verdict}
        domainLookup={result.domain_lookup}
      />
    </div>
  );
};
