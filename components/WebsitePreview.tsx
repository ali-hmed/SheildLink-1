"use client";

import React, { useState } from "react";
import { PreviewResponse } from "@/lib/types";
import {
  ExternalLink,
  Maximize2,
  X,
  RotateCw,
  Globe,
  ArrowRight,
  ShieldAlert,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";

interface WebsitePreviewProps {
  preview: PreviewResponse | null;
  isLoading: boolean;
  onRetry?: () => void;
  verdict?: string;
}

export const WebsitePreview: React.FC<WebsitePreviewProps> = ({
  preview,
  isLoading,
  onRetry,
  verdict,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showFullRedirects, setShowFullRedirects] = useState(false);

  if (isLoading && !preview) {
    return null; // Handled by PreviewSkeleton
  }

  if (!preview) {
    return (
      <div className="w-full bg-white rounded-[4px] border-2 sm:border-3 border-ink p-5 sm:p-6 shadow-[4px_4px_0px_#111111]">
        <div className="flex items-center justify-between border-b-2 border-ink pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-ink stroke-[2.5]" aria-hidden="true" />
            <h3 className="text-[14px] font-heading font-extrabold uppercase tracking-wider text-ink">
              Website Preview
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 border border-ink bg-paper rounded-[2px]">
            Unavailable
          </span>
        </div>
        <p className="text-[14px] text-ink/80 font-medium">
          No preview information has been requested yet.
        </p>
      </div>
    );
  }

  const hasScreenshot = Boolean(preview.screenshot_url && !imgError);
  const hasOgImage = Boolean(preview.og_image_url);
  const hasRedirects = preview.redirect_chain && preview.redirect_chain.length > 1;

  const formattedTime = preview.generated_at
    ? new Date(preview.generated_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const getStatusBadge = () => {
    switch (preview.status) {
      case "ready":
        return {
          label: "Preview Verified",
          bg: "bg-risk-safe",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-ink stroke-[3]" />,
        };
      case "screenshot_failed":
        return {
          label: "Metadata Only",
          bg: "bg-risk-low",
          icon: <Info className="w-3.5 h-3.5 text-ink stroke-[2.5]" />,
        };
      case "blocked":
        return {
          label: "Destination Blocked",
          bg: "bg-risk-high",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-ink stroke-[2.5]" />,
        };
      case "site_not_found":
        return {
          label: "Domain Not Found",
          bg: "bg-risk-neutral",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-ink stroke-[2.5]" />,
        };
      case "failed":
      default:
        return {
          label: "Capture Unavailable",
          bg: "bg-risk-neutral",
          icon: <Info className="w-3.5 h-3.5 text-ink stroke-[2.5]" />,
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <>
      <section
        aria-label="Website Visual Preview and Metadata"
        className="w-full bg-white rounded-[4px] border-2 sm:border-3 border-ink p-4 sm:p-6 shadow-[4px_4px_0px_#111111] sm:shadow-[6px_6px_0px_#111111] space-y-4"
      >
        {/* Browser Window Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-3 h-3 rounded-full border border-ink bg-risk-high inline-block" />
              <span className="w-3 h-3 rounded-full border border-ink bg-risk-low inline-block" />
              <span className="w-3 h-3 rounded-full border border-ink bg-risk-safe inline-block" />
            </div>
            <h3 className="text-[13px] sm:text-[14px] font-heading font-extrabold uppercase tracking-wider text-ink ml-1">
              Website Preview &amp; Intel
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border border-ink font-heading font-extrabold text-[11px] uppercase tracking-wide shadow-brutal-sm ${statusBadge.bg}`}
            >
              {statusBadge.icon}
              <span>{statusBadge.label}</span>
            </span>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isLoading}
                title="Refresh preview screenshot and metadata"
                className="h-[30px] px-2.5 rounded-[2px] border border-ink bg-paper hover:bg-white text-ink text-[11px] font-heading font-bold shadow-brutal-sm flex items-center gap-1 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-60"
              >
                <RotateCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* Destination & Favicon Bar */}
        <div className="flex items-center justify-between gap-3 bg-paper p-2.5 rounded-[3px] border border-ink">
          <div className="flex items-center gap-2.5 min-w-0">
            {preview.favicon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.favicon_url}
                alt=""
                width={18}
                height={18}
                className="w-4.5 h-4.5 rounded-[2px] border border-ink/40 bg-white object-contain shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <Globe className="w-4 h-4 text-ink shrink-0 stroke-[2]" aria-hidden="true" />
            )}
            <span className="font-mono font-bold text-[13px] sm:text-[14px] text-ink truncate select-all">
              {preview.domain || "Unknown Destination"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasScreenshot && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-ink hover:underline cursor-pointer px-2 py-1 bg-white border border-ink rounded-[2px] shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
                title="Expand screenshot full screen"
              >
                <Maximize2 className="w-3 h-3 stroke-[2.5]" />
                <span className="hidden xs:inline">Enlarge</span>
              </button>
            )}
          </div>
        </div>

        {/* Screenshot Viewport Container */}
        <div className="relative w-full aspect-[16/10] bg-paper rounded-[3px] border-2 border-ink overflow-hidden group shadow-brutal-sm">
          {hasScreenshot ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.screenshot_url!}
                alt={`Screenshot of ${preview.domain}`}
                className="w-full h-full object-cover object-top cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]"
                onClick={() => setIsModalOpen(true)}
                onError={() => setImgError(true)}
              />
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                aria-label="Click to enlarge website screenshot"
                className="absolute inset-0 w-full h-full bg-ink/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <span className="bg-white/95 border-2 border-ink text-ink font-heading font-extrabold text-[12px] px-3 py-1.5 rounded-[3px] shadow-brutal flex items-center gap-1.5 uppercase tracking-wider">
                  <Maximize2 className="w-4 h-4 stroke-[2.5]" />
                  Click to inspect
                </span>
              </button>
            </>
          ) : hasOgImage ? (
            /* Fallback to verified Open Graph image with clear distinguishing label */
            <div className="w-full h-full relative flex flex-col items-center justify-center bg-paper p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.og_image_url!}
                alt={`Open Graph preview for ${preview.domain}`}
                className="w-full h-full object-contain max-h-[80%]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="absolute top-2 left-2 bg-primary px-2 py-0.5 border border-ink rounded-[2px] font-heading font-extrabold text-[10px] text-ink uppercase tracking-wider shadow-brutal-sm flex items-center gap-1">
                <ImageIcon className="w-3 h-3 stroke-[2.5]" />
                Supplementary: Open Graph image
              </div>
            </div>
          ) : (
            /* Clear, honest unavailable state */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-paper/60">
              <div className="w-12 h-12 rounded-[4px] border-2 border-ink bg-white flex items-center justify-center mb-3 shadow-brutal-sm">
                <Globe className="w-6 h-6 text-ink/70 stroke-[2]" aria-hidden="true" />
              </div>
              <h4 className="font-heading font-extrabold text-[15px] uppercase tracking-tight text-ink">
                Screenshot Not Available
              </h4>
              <p className="text-[12px] sm:text-[13px] text-ink/70 font-medium max-w-sm mt-1 leading-normal">
                {preview.screenshot_error ||
                  (preview.status === "blocked"
                    ? "Screenshot capture was safely blocked due to restricted network address policy."
                    : preview.status === "site_not_found"
                    ? "Domain does not resolve in public DNS, preventing remote capture."
                    : "The destination website could not be rendered in the isolated browser sandbox.")}
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isLoading}
                  className="mt-4 px-3 py-1.5 border-2 border-ink bg-white hover:bg-paper font-heading font-extrabold text-[12px] rounded-[3px] shadow-brutal-sm cursor-pointer flex items-center gap-1.5 transition-transform active:translate-x-0.5 active:translate-y-0.5"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Retry capture</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Metadata Details Card */}
        <div className="rounded-[4px] border-2 border-ink bg-paper p-3.5 sm:p-4 space-y-3 shadow-brutal-sm">
          {/* Website Title */}
          <div>
            <div className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-ink/60 mb-0.5">
              Website Title
            </div>
            {preview.title ? (
              <h4 className="text-[15px] sm:text-[16px] font-heading font-bold text-ink leading-snug break-words">
                {preview.title}
              </h4>
            ) : (
              <p className="text-[13px] text-ink/50 italic font-medium">
                No verified &lt;title&gt; extracted from page
              </p>
            )}
          </div>

          {/* Meta Description */}
          <div>
            <div className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-ink/60 mb-0.5">
              Meta Description
            </div>
            {preview.description ? (
              <p className="text-[13px] text-ink font-medium leading-relaxed [overflow-wrap:anywhere] break-words">
                {preview.description}
              </p>
            ) : (
              <p className="text-[13px] text-ink/50 italic font-medium">
                No meta description provided by destination
              </p>
            )}
          </div>

          {/* Destination & Redirect Information */}
          <div className="pt-2 border-t border-ink/20 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1 font-mono">
              <span className="text-ink/60 font-bold uppercase font-sans text-[10px] tracking-wider">
                Submitted URL:
              </span>
              <span className="text-ink truncate max-w-full sm:max-w-[70%] select-all">
                {preview.input_url}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1 font-mono">
              <span className="text-ink/60 font-bold uppercase font-sans text-[10px] tracking-wider">
                Final URL:
              </span>
              <span className="text-ink truncate max-w-full sm:max-w-[70%] font-bold select-all">
                {preview.final_url}
              </span>
            </div>

            {/* Redirect Chain Indicator */}
            {hasRedirects && (
              <div className="mt-2 pt-2 border-t border-ink/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-ink flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-risk-low border border-ink" />
                    Redirect Chain ({preview.redirect_chain.length} hops)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFullRedirects(!showFullRedirects)}
                    className="text-[11px] font-heading font-bold text-ink underline cursor-pointer"
                  >
                    {showFullRedirects ? "Hide hops" : "Show all hops"}
                  </button>
                </div>

                {showFullRedirects ? (
                  <ol className="space-y-1.5 mt-2 bg-white p-2.5 rounded-[3px] border border-ink list-decimal list-inside font-mono text-[11px]">
                    {preview.redirect_chain.map((hop, idx) => (
                      <li key={idx} className="truncate select-all text-ink">
                        {hop}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink truncate bg-white px-2 py-1 rounded-[2px] border border-ink">
                    <span className="truncate">{preview.redirect_chain[0]}</span>
                    <ArrowRight className="w-3 h-3 shrink-0 stroke-[2.5]" />
                    <span className="truncate font-bold text-ink">
                      {preview.redirect_chain[preview.redirect_chain.length - 1]}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timestamp and Verification Note */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-ink/20 text-[10px] text-ink/70 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Captured: {formattedTime || "Just now"}</span>
            </span>
            <span className="font-sans font-medium text-[10px]">
              Rendered in isolated sandbox &bull; No code executed locally
            </span>
          </div>
        </div>
      </section>

      {/* Fullscreen Inspection Lightbox Modal */}
      {isModalOpen && preview.screenshot_url && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Inspect website screenshot"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/80 backdrop-blur-xs animate-hard-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl bg-white rounded-[4px] border-3 border-ink shadow-[8px_8px_0px_#111111] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink bg-paper">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 text-ink shrink-0 stroke-[2.5]" />
                <span className="font-mono font-bold text-[14px] text-ink truncate">
                  {preview.domain} &mdash; Visual Inspection
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-[2px] border-2 border-ink bg-white hover:bg-risk-high hover:text-white flex items-center justify-center text-ink transition-colors cursor-pointer shadow-brutal-sm"
                aria-label="Close screenshot inspection"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Modal Image Viewport */}
            <div className="overflow-auto p-4 flex-1 bg-paper/40 flex items-center justify-center min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.screenshot_url}
                alt={`Full resolution preview of ${preview.domain}`}
                className="max-w-full h-auto rounded-[2px] border-2 border-ink shadow-brutal"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 border-t-2 border-ink bg-white flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <span className="font-mono text-ink/70 truncate max-w-md select-all">
                {preview.final_url}
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-[36px] px-4 rounded-[3px] border-2 border-ink bg-primary text-ink font-heading font-extrabold text-[13px] shadow-brutal cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
