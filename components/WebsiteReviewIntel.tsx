"use client";

import React, { useState, useEffect } from "react";
import { ScanResponse, PreviewResponse } from "@/lib/types";
import { ScoreMeter } from "./ScoreMeter";
import { FindingItem } from "./FindingItem";
import { ChecksSummary } from "./ChecksSummary";
import { formatReportText } from "@/lib/report";
import {
  ExternalLink,
  Maximize2,
  X,
  RotateCw,
  Globe,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Lock,
  Server,
  Calendar,
  Layers,
  Image as ImageIcon,
  Clock,
} from "lucide-react";

interface WebsiteReviewIntelProps {
  result: ScanResponse;
  preview: PreviewResponse | null;
  previewLoading: boolean;
  onScanAnother: () => void;
  onRescan?: (url: string) => void;
  onRetryPreview?: () => void;
  onOpenSiteRequest: (url: string) => void;
}

export const WebsiteReviewIntel: React.FC<WebsiteReviewIntelProps> = ({
  result,
  preview,
  previewLoading,
  onScanAnother,
  onRescan,
  onRetryPreview,
  onOpenSiteRequest,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [showRedirectDetails, setShowRedirectDetails] = useState(false);
  const [showAdditionalIntel, setShowAdditionalIntel] = useState(false);
  const [intelTab, setIntelTab] = useState<"findings" | "raw_checks">("findings");

  // Prevent background scrolling when screenshot modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsModalOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isModalOpen]);

  // Destination URLs
  const finalDestinationUrl =
    preview?.final_url || result.normalized_url || result.input_url;
  const destinationDomain =
    preview?.domain || result.hostname || "unknown";

  const hasScreenshot = Boolean(preview?.screenshot_url && !imgError);
  const hasOgImage = Boolean(preview?.og_image_url);
  const redirectChain = preview?.redirect_chain || [];
  const hasRedirects = redirectChain.length > 1;

  const dnsResolves =
    result.checks?.dns?.status === "resolves" ||
    result.domain_lookup?.status === "resolves" ||
    result.domain_lookup?.status === "skipped";

  const isNotFound =
    result.verdict === "site_not_found" ||
    result.checks?.dns?.status === "not_found" ||
    result.domain_lookup?.status === "not_found";

  const isHighOrSuspicious =
    result.verdict === "high_risk" || result.verdict === "suspicious";

  // Active findings sorted by severity
  const severityOrder: Record<string, number> = {
    high: 4,
    medium: 3,
    low: 2,
    info: 1,
  };
  const activeFindings = result.findings.filter((f) => f.points > 0);
  const sortedFindings = [...activeFindings].sort((a, b) => {
    const diff =
      (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    return diff !== 0 ? diff : b.points - a.points;
  });

  // Copy helpers
  const handleCopyDestinationUrl = async () => {
    try {
      await navigator.clipboard.writeText(finalDestinationUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyReport = async () => {
    const text = formatReportText(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Verdict metadata configuration
  const getVerdictConfig = () => {
    switch (result.verdict) {
      case "high_risk":
        return {
          label: "MALICIOUS",
          badgeBg: "bg-risk-high text-white",
          bandBg: "bg-risk-high/15 border-risk-high",
          icon: <AlertOctagon className="w-4 h-4 stroke-[2.5]" />,
        };
      case "suspicious":
        return {
          label: "SUSPICIOUS",
          badgeBg: "bg-risk-medium text-ink",
          bandBg: "bg-risk-medium/15 border-risk-medium",
          icon: <AlertTriangle className="w-4 h-4 stroke-[2.5]" />,
        };
      case "low_risk":
        return {
          label: "LOW RISK",
          badgeBg: "bg-risk-low text-ink",
          bandBg: "bg-risk-low/15 border-risk-low",
          icon: <AlertTriangle className="w-4 h-4 stroke-[2.5]" />,
        };
      case "site_not_found":
        return {
          label: "SITE NOT FOUND",
          badgeBg: "bg-risk-neutral text-ink",
          bandBg: "bg-risk-neutral/30 border-ink",
          icon: <HelpCircle className="w-4 h-4 stroke-[2.5]" />,
        };
      case "safe":
      case "no_issues_detected":
      default:
        return {
          label: "SAFE",
          badgeBg: "bg-risk-safe text-ink",
          bandBg: "bg-risk-safe/15 border-risk-safe",
          icon: <CheckCircle2 className="w-4 h-4 stroke-[3]" />,
        };
    }
  };

  const verdictConfig = getVerdictConfig();

  // Summary rendering
  const renderSummaryText = () => {
    if (result.verdict === "site_not_found" && result.suggested_url && onRescan) {
      const displayDomain = result.suggested_url.replace(/^https?:\/\//, "");
      return (
        <span>
          Domain not found in DNS and may be mistyped. Did you mean{" "}
          <button
            type="button"
            onClick={() => onRescan(result.suggested_url!)}
            className="inline-block px-1.5 py-0.2 bg-primary font-mono font-bold text-ink underline rounded-[2px] cursor-pointer"
          >
            {displayDomain}
          </button>
          ?
        </span>
      );
    }
    return result.summary;
  };

  // Performance / Inspection checks data (6 distinct signals, 2 per row on desktop)
  const tlsCheck = result.checks?.tls;
  const dnsCheck = result.checks?.dns;
  const regCheck = result.checks?.domain_registration;
  const sbCheck = result.checks?.safe_browsing;
  const lookalikeCheck = result.checks?.lookalike;

  const performanceChecks = [
    // 1. HTTPS / TLS Transport
    {
      id: "tls",
      label: "HTTPS & TLS Security",
      icon: <Lock className="w-4 h-4 text-ink stroke-[2.5]" />,
      statusText:
        tlsCheck?.status === "valid"
          ? "Valid Certificate"
          : tlsCheck?.status === "invalid"
          ? "Invalid TLS"
          : tlsCheck?.status === "skipped"
          ? "Insecure HTTP"
          : "TLS Error",
      badgeClass:
        tlsCheck?.status === "valid"
          ? "bg-risk-safe"
          : tlsCheck?.status === "invalid"
          ? "bg-risk-high text-white"
          : "bg-risk-medium",
      detail:
        tlsCheck?.issuer
          ? `Issued by ${tlsCheck.issuer}`
          : tlsCheck?.disclaimer || "Transport layer check",
    },
    // 2. DNS & Host Resolution
    {
      id: "dns",
      label: "DNS Resolution",
      icon: <Server className="w-4 h-4 text-ink stroke-[2.5]" />,
      statusText:
        dnsCheck?.status === "resolves"
          ? "Resolves"
          : dnsCheck?.status === "not_found"
          ? "NXDOMAIN (Unresolved)"
          : dnsCheck?.status === "skipped"
          ? "Direct IP Target"
          : "DNS Timeout / Error",
      badgeClass:
        dnsCheck?.status === "resolves" || dnsCheck?.status === "skipped"
          ? "bg-risk-safe"
          : dnsCheck?.status === "not_found"
          ? "bg-risk-neutral"
          : "bg-risk-medium",
      detail:
        dnsCheck?.ips && dnsCheck.ips.length > 0
          ? `${dnsCheck.ips.slice(0, 2).join(", ")}${
              dnsCheck.ips.length > 2 ? ` (+${dnsCheck.ips.length - 2} more)` : ""
            }`
          : isNotFound
          ? "No A/AAAA records exist"
          : dnsCheck?.summary || "Public DNS lookup",
    },
    // 3. Domain Registration & Age
    {
      id: "registration",
      label: "Domain Age & Registrar",
      icon: <Calendar className="w-4 h-4 text-ink stroke-[2.5]" />,
      statusText:
        regCheck?.domain_age ||
        (regCheck?.status === "available"
          ? "Registered"
          : regCheck?.status === "not_found"
          ? "Not Registered"
          : "Unavailable"),
      badgeClass:
        regCheck?.status === "available"
          ? regCheck.age_days && regCheck.age_days < 30
            ? "bg-risk-medium"
            : "bg-risk-safe"
          : "bg-risk-neutral",
      detail:
        regCheck?.registrar
          ? `Registrar: ${regCheck.registrar}`
          : regCheck?.creation_date
          ? `Created ${regCheck.creation_date}`
          : "RDAP registry database lookup",
    },
    // 4. Threat Intelligence (Google Safe Browsing)
    {
      id: "threat_intel",
      label: "Threat Intelligence",
      icon: <ShieldCheck className="w-4 h-4 text-ink stroke-[2.5]" />,
      statusText:
        sbCheck?.status === "threat_detected"
          ? "Blacklisted Threat"
          : sbCheck?.status === "clean"
          ? "No Match Found"
          : sbCheck?.status === "not_configured"
          ? "Provider Not Configured"
          : "Checked",
      badgeClass:
        sbCheck?.status === "threat_detected"
          ? "bg-risk-high text-white"
          : sbCheck?.status === "clean"
          ? "bg-risk-safe"
          : "bg-paper",
      detail:
        sbCheck?.matches && sbCheck.matches.length > 0
          ? `Threats: ${sbCheck.matches.join(", ")}`
          : "Google Safe Browsing v4 lists",
    },
    // 5. Navigation & Redirect Path
    {
      id: "redirects",
      label: "Redirect Path",
      icon: <ArrowRight className="w-4 h-4 text-ink stroke-[2.5]" />,
      statusText: hasRedirects
        ? `${redirectChain.length} Hops Detected`
        : "Direct Navigation",
      badgeClass:
        redirectChain.length > 3
          ? "bg-risk-medium"
          : hasRedirects
          ? "bg-risk-low"
          : "bg-risk-safe",
      detail: hasRedirects
        ? `Initial ${result.hostname} → Final ${destinationDomain}`
        : "Zero intermediate redirect hops",
    },
    // 6. Lookalike & Brand Safety
    {
      id: "lookalike",
      label: "Brand Impersonation",
      icon: <Layers className="w-4 h-4 text-ink stroke-[2.5]" />,
      statusText:
        lookalikeCheck?.status === "match_found"
          ? "Lookalike Detected"
          : lookalikeCheck?.status === "skipped"
          ? "Skipped (IP/Literal)"
          : "No Spoofing Detected",
      badgeClass:
        lookalikeCheck?.status === "match_found"
          ? "bg-risk-high text-white"
          : "bg-risk-safe",
      detail:
        lookalikeCheck?.resembles
          ? `Resembles ${lookalikeCheck.resembles}`
          : "Heuristic homoglyph & brand analysis",
    },
  ];

  return (
    <>
      <section
        aria-label="Website Review Intel & Security Analysis"
        className="w-full bg-white rounded-[4px] border-2 sm:border-3 border-ink shadow-[4px_4px_0px_#111111] sm:shadow-[6px_6px_0px_#111111] overflow-hidden"
      >
        {/* 1. Header: Website Review Intel title + Integrated Security Verdict & Risk Score */}
        <div className="border-b-2 sm:border-b-3 border-ink bg-paper p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Title & Window Dots */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="w-3 h-3 rounded-full border border-ink bg-risk-high inline-block" />
                <span className="w-3 h-3 rounded-full border border-ink bg-risk-low inline-block" />
                <span className="w-3 h-3 rounded-full border border-ink bg-risk-safe inline-block" />
              </div>
              <h2 className="text-[15px] sm:text-[17px] font-heading font-extrabold uppercase tracking-wider text-ink ml-1">
                Website Review Intel
              </h2>
            </div>

            {/* Integrated Security Status Area */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Verdict Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] border-2 border-ink font-heading font-extrabold text-[12px] sm:text-[13px] tracking-wide shadow-brutal-sm ${verdictConfig.badgeBg}`}
              >
                {verdictConfig.icon}
                <span>{verdictConfig.label}</span>
              </div>

              {/* Compact Risk Score Meter */}
              {result.risk_score !== null && result.verdict !== "site_not_found" ? (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-ink rounded-[3px] shadow-brutal-sm">
                  <span className="text-[10px] font-heading font-extrabold uppercase text-ink/70">
                    Risk Score
                  </span>
                  <span className="font-mono font-bold text-[13px] text-ink">
                    {result.risk_score}/100
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/70 border border-ink rounded-[3px] shadow-brutal-sm text-[11px] font-mono font-medium text-ink/70">
                  <span>Score: N/A</span>
                </div>
              )}

              {/* Refresh preview button */}
              {onRetryPreview && (
                <button
                  type="button"
                  onClick={onRetryPreview}
                  disabled={previewLoading}
                  title="Refresh website preview capture"
                  className="h-[32px] px-2.5 rounded-[3px] border border-ink bg-white hover:bg-paper text-ink text-[11px] font-heading font-bold shadow-brutal-sm flex items-center gap-1 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-60"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${previewLoading ? "animate-spin" : ""}`} />
                  <span className="hidden xs:inline">Refresh</span>
                </button>
              )}
            </div>
          </div>

          {/* Short explanatory message describing the verdict */}
          <div className="mt-3 pt-2.5 border-t border-ink/20 flex items-start gap-2">
            <p className="text-[13px] sm:text-[14px] text-ink font-medium leading-relaxed">
              {renderSummaryText()}
            </p>
          </div>
        </div>

        {/* Inner Card Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* 2. Website Identity: Favicon, Title, Domain, Description */}
          <div className="rounded-[4px] border-2 border-ink bg-paper p-4 space-y-2.5 shadow-brutal-sm">
            <div className="flex items-start gap-3">
              {preview?.favicon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.favicon_url}
                  alt=""
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-[2px] border border-ink/40 bg-white object-contain shrink-0 mt-0.5"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-[2px] border border-ink/40 bg-white flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-4 h-4 text-ink stroke-[2]" aria-hidden="true" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[16px] sm:text-[18px] font-heading font-extrabold text-ink leading-tight break-words">
                    {preview?.title || destinationDomain}
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-white border border-ink rounded-[2px] text-ink/80 truncate">
                    {destinationDomain}
                  </span>
                </div>

                {preview?.description ? (
                  <p className="text-[13px] text-ink/90 font-medium leading-relaxed mt-1.5 [overflow-wrap:anywhere] break-words">
                    {preview.description}
                  </p>
                ) : (
                  <p className="text-[12px] text-ink/50 italic mt-1 font-sans">
                    No meta description extracted from destination HTML
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 3. Website Screenshot: Prominent visual preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-heading font-extrabold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary border border-ink" />
                Destination Visual Preview
              </span>

              {hasScreenshot && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-heading font-extrabold text-ink hover:underline cursor-pointer px-2.5 py-1 bg-paper border border-ink rounded-[2px] shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Expand Preview</span>
                </button>
              )}
            </div>

            <div className="relative w-full aspect-[16/10] bg-paper rounded-[4px] border-2 sm:border-3 border-ink overflow-hidden group shadow-brutal-sm">
              {previewLoading && !preview ? (
                <div className="w-full h-full skeleton-block flex flex-col items-center justify-center p-6 text-center">
                  <RotateCw className="w-7 h-7 animate-spin text-ink stroke-[2.5] mb-2" />
                  <span className="font-heading font-extrabold text-[14px] uppercase text-ink">
                    Rendering in isolated sandbox...
                  </span>
                </div>
              ) : hasScreenshot ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview!.screenshot_url!}
                    alt={`Screenshot of ${destinationDomain}`}
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
                    <span className="bg-white/95 border-2 border-ink text-ink font-heading font-extrabold text-[12px] px-3.5 py-2 rounded-[3px] shadow-brutal flex items-center gap-2 uppercase tracking-wider">
                      <Maximize2 className="w-4 h-4 stroke-[2.5]" />
                      Click to expand full screen
                    </span>
                  </button>
                </>
              ) : hasOgImage ? (
                <div className="w-full h-full relative flex flex-col items-center justify-center bg-paper p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview!.og_image_url!}
                    alt={`Open Graph preview for ${destinationDomain}`}
                    className="w-full h-full object-contain max-h-[85%]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-primary px-2.5 py-1 border border-ink rounded-[2px] font-heading font-extrabold text-[10px] text-ink uppercase tracking-wider shadow-brutal-sm flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    Supplementary: Open Graph image
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-paper/60">
                  <div className="w-12 h-12 rounded-[4px] border-2 border-ink bg-white flex items-center justify-center mb-2 shadow-brutal-sm">
                    <Globe className="w-6 h-6 text-ink/70 stroke-[2]" aria-hidden="true" />
                  </div>
                  <h4 className="font-heading font-extrabold text-[15px] uppercase tracking-tight text-ink">
                    Screenshot Unavailable
                  </h4>
                  <p className="text-[12px] sm:text-[13px] text-ink/70 font-medium max-w-sm mt-1 leading-normal">
                    {preview?.screenshot_error ||
                      (isNotFound
                        ? "Domain does not resolve in public DNS, preventing remote capture."
                        : "The isolated browser sandbox could not render this destination.")}
                  </p>
                  {onRetryPreview && (
                    <button
                      type="button"
                      onClick={onRetryPreview}
                      disabled={previewLoading}
                      className="mt-3 px-3 py-1.5 border-2 border-ink bg-white hover:bg-paper font-heading font-extrabold text-[12px] rounded-[3px] shadow-brutal-sm cursor-pointer flex items-center gap-1.5 transition-transform active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${previewLoading ? "animate-spin" : ""}`} />
                      <span>Retry capture</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. Destination Action: Final Destination URL + Open Site & Copy */}
          <div className="p-3.5 sm:p-4 rounded-[4px] border-2 border-ink bg-paper flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-brutal-sm">
            <div className="min-w-0 flex-1 space-y-0.5">
              <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-ink/70 block">
                Resolved Destination URL
              </span>
              <div
                title={finalDestinationUrl}
                className="font-mono text-[13px] sm:text-[14px] text-ink font-bold truncate select-all [overflow-wrap:anywhere]"
              >
                {finalDestinationUrl}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Copy URL Button */}
              <button
                type="button"
                onClick={handleCopyDestinationUrl}
                className="h-[42px] px-3 rounded-[3px] border-2 border-ink bg-white hover:bg-paper text-ink font-heading font-extrabold text-[12px] shadow-brutal-sm flex items-center gap-1.5 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
                title="Copy final URL to clipboard"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3] text-ink" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              {/* Open Site Button: Gated based on security verdict */}
              {dnsResolves && !isNotFound ? (
                <button
                  type="button"
                  onClick={() => onOpenSiteRequest(finalDestinationUrl)}
                  className={`h-[42px] px-4 rounded-[3px] border-2 border-ink font-heading font-extrabold text-[13px] shadow-brutal flex items-center gap-2 cursor-pointer transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
                    isHighOrSuspicious
                      ? "bg-risk-high text-white hover:bg-risk-high/90"
                      : "bg-primary text-ink hover:bg-primary-hover"
                  }`}
                  title={
                    isHighOrSuspicious
                      ? "Warning: Risky site. Confirmation required."
                      : "Open destination website in a new tab"
                  }
                >
                  <span>{isHighOrSuspicious ? "Open Site (Risky)" : "Open Site"}</span>
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Destination domain does not resolve in DNS"
                  className="h-[42px] px-4 rounded-[3px] border-2 border-ink bg-risk-neutral/60 text-ink/50 font-heading font-bold text-[13px] shadow-brutal-sm cursor-not-allowed opacity-60 flex items-center gap-2"
                >
                  <span>Open Site</span>
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* 5. Website Checks: Responsive 2-column grid on desktop, equal heights */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-heading font-extrabold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary border border-ink" />
                Website Inspection &amp; Performance Checks
              </span>
              <span className="text-[11px] font-sans text-ink/60">
                2 per row &bull; Verified signals
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {performanceChecks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[4px] border-2 border-ink bg-paper p-3.5 flex flex-col justify-between gap-2 shadow-brutal-sm hover:bg-white transition-colors min-h-[92px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 rounded-[2px] border border-ink bg-white shrink-0">
                        {item.icon}
                      </div>
                      <span className="text-[12px] font-heading font-extrabold uppercase tracking-wider text-ink truncate">
                        {item.label}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-[2px] border border-ink text-[10px] font-heading font-extrabold tracking-wide uppercase shrink-0 ${item.badgeClass}`}
                    >
                      {item.statusText}
                    </span>
                  </div>

                  <div className="text-[12px] font-medium text-ink/80 leading-snug line-clamp-2">
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Additional Scan Information & Expandable Details */}
          <div className="pt-2 border-t-2 border-ink space-y-3">
            {/* Redirects expansion toggle if present */}
            {hasRedirects && (
              <div className="rounded-[4px] border-2 border-ink bg-paper p-3 shadow-brutal-sm">
                <button
                  type="button"
                  onClick={() => setShowRedirectDetails(!showRedirectDetails)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-[12px] font-heading font-extrabold text-ink uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full bg-risk-low border border-ink" />
                    <span>Redirect Chain ({redirectChain.length} hops)</span>
                  </div>
                  {showRedirectDetails ? (
                    <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  )}
                </button>

                {showRedirectDetails && (
                  <ol className="mt-3 pt-2.5 border-t border-ink/20 space-y-1.5 font-mono text-[12px] list-decimal list-inside bg-white p-3 rounded-[3px] border border-ink">
                    {redirectChain.map((hop, idx) => (
                      <li key={idx} className="truncate select-all text-ink">
                        {hop}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {/* Expandable Security Findings & Deep Details */}
            <div className="rounded-[4px] border-2 border-ink bg-white shadow-brutal-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdditionalIntel(!showAdditionalIntel)}
                className="w-full flex items-center justify-between p-3.5 bg-paper hover:bg-white text-left cursor-pointer border-b-2 border-transparent data-[open=true]:border-ink transition-colors"
                data-open={showAdditionalIntel}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-heading font-extrabold uppercase tracking-wider text-ink bg-primary px-2 py-0.5 border border-ink rounded-[2px] shadow-brutal-sm">
                    Detailed Security Findings ({sortedFindings.length})
                  </span>
                  <span className="text-[12px] font-sans font-medium text-ink/70 hidden sm:inline">
                    &bull; Inspection rules &amp; raw checks
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[12px] font-heading font-bold text-ink">
                  <span>{showAdditionalIntel ? "Collapse" : "Expand"}</span>
                  {showAdditionalIntel ? (
                    <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  )}
                </div>
              </button>

              {showAdditionalIntel && (
                <div className="p-4 space-y-4">
                  {/* Sub-tabs: Findings vs All 6 Checks */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIntelTab("findings")}
                      className={`h-[32px] px-3 rounded-[2px] border-2 border-ink text-[11px] font-heading font-extrabold uppercase tracking-wider cursor-pointer ${
                        intelTab === "findings"
                          ? "bg-primary text-ink shadow-brutal-sm"
                          : "bg-paper text-ink/70 hover:bg-white"
                      }`}
                    >
                      Triggered Findings ({sortedFindings.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntelTab("raw_checks")}
                      className={`h-[32px] px-3 rounded-[2px] border-2 border-ink text-[11px] font-heading font-extrabold uppercase tracking-wider cursor-pointer ${
                        intelTab === "raw_checks"
                          ? "bg-primary text-ink shadow-brutal-sm"
                          : "bg-paper text-ink/70 hover:bg-white"
                      }`}
                    >
                      All 6 Raw Checks
                    </button>
                  </div>

                  {intelTab === "findings" && (
                    <div className="space-y-2.5">
                      {sortedFindings.length === 0 ? (
                        <div className="py-3 px-4 rounded-[4px] border-2 border-ink bg-paper text-[13px] font-medium text-ink flex items-center gap-2 shadow-brutal-sm">
                          <CheckCircle2 className="w-4 h-4 text-risk-safe stroke-[3]" />
                          <span>No security risk findings triggered for this destination.</span>
                        </div>
                      ) : (
                        <ol className="space-y-2.5 list-none p-0 m-0">
                          {sortedFindings.map((finding, idx) => (
                            <FindingItem key={`${finding.id}-${idx}`} finding={finding} index={idx} />
                          ))}
                        </ol>
                      )}
                    </div>
                  )}

                  {intelTab === "raw_checks" && (
                    <div className="space-y-2">
                      <ChecksSummary checks={result.checks} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Row: Copy Report, Scan Another */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-ink">
            <button
              type="button"
              onClick={handleCopyReport}
              className="h-[42px] px-4 rounded-[3px] border-2 border-ink bg-white hover:bg-paper text-ink font-heading font-extrabold text-[13px] shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-2"
            >
              {copiedReport ? (
                <>
                  <Check className="w-4 h-4 stroke-[3] text-ink" />
                  <span>Report Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 stroke-[2.5]" />
                  <span>Copy Full Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onScanAnother}
              className="h-[42px] px-5 rounded-[3px] border-2 border-ink bg-primary text-ink font-heading font-extrabold text-[13px] shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>Scan Another URL</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. Large Fullscreen Lightbox Modal Experience (90-95% viewport, max 92vh, scroll lock) */}
      {isModalOpen && preview?.screenshot_url && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="screenshot-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-8 bg-ink/80 backdrop-blur-xs animate-hard-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-[94vw] lg:max-w-6xl max-h-[92vh] bg-white rounded-[4px] border-3 border-ink shadow-[8px_8px_0px_#111111] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b-2 sm:border-b-3 border-ink bg-paper">
              <div className="flex items-center gap-2.5 min-w-0">
                <Globe className="w-4 h-4 text-ink shrink-0 stroke-[2.5]" />
                <span
                  id="screenshot-modal-title"
                  className="font-mono font-bold text-[13px] sm:text-[15px] text-ink truncate"
                >
                  {destinationDomain} &mdash; Visual Inspection
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 border border-ink bg-white font-mono text-[11px] text-ink/80 rounded-[2px]">
                  16:10 Browser Capture
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-[36px] w-[36px] rounded-[3px] border-2 border-ink bg-white hover:bg-risk-high hover:text-white flex items-center justify-center text-ink transition-colors cursor-pointer shadow-brutal-sm"
                  aria-label="Close website inspection preview"
                >
                  <X className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Modal Image Viewport with Natural Aspect Ratio & Scrollability */}
            <div className="overflow-auto p-4 sm:p-6 flex-1 bg-paper/40 flex items-center justify-center min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.screenshot_url}
                alt={`Full resolution preview of ${destinationDomain}`}
                className="max-w-full h-auto max-h-[75vh] object-contain rounded-[3px] border-2 border-ink shadow-brutal bg-white"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-5 py-3 border-t-2 border-ink bg-white flex flex-wrap items-center justify-between gap-3 text-[12px]">
              <div className="flex items-center gap-2 min-w-0 max-w-xl">
                <span className="font-heading font-extrabold uppercase text-[10px] text-ink/60">
                  Target:
                </span>
                <span className="font-mono text-ink text-[12px] truncate select-all">
                  {finalDestinationUrl}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {dnsResolves && !isNotFound && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      onOpenSiteRequest(finalDestinationUrl);
                    }}
                    className={`h-[36px] px-3.5 rounded-[3px] border-2 border-ink font-heading font-extrabold text-[12px] shadow-brutal flex items-center gap-1.5 cursor-pointer ${
                      isHighOrSuspicious
                        ? "bg-risk-high text-white"
                        : "bg-primary text-ink hover:bg-primary-hover"
                    }`}
                  >
                    <span>{isHighOrSuspicious ? "Visit Site (Risky)" : "Visit Site"}</span>
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-[36px] px-4 rounded-[3px] border-2 border-ink bg-paper hover:bg-white text-ink font-heading font-extrabold text-[12px] shadow-brutal cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
