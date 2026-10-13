import React from "react";
import { UrlForm } from "./UrlForm";
import { ExampleChips } from "./ExampleChips";

interface HeroProps {
  onScan: (url: string) => Promise<void>;
  isLoading: boolean;
  inputUrl: string;
  setInputUrl: (url: string) => void;
  error: string | null;
  onSelectExample: (url: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onRetry?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onScan,
  isLoading,
  inputUrl,
  setInputUrl,
  error,
  onSelectExample,
  inputRef,
  onRetry,
}) => {
  return (
    <section className="relative pt-[32px] sm:pt-[56px] pb-[24px] sm:pb-[40px] flex flex-col items-center text-center">
      {/* Scaled-down ethereal soft blurred color glows (hero only, static/subtle, fade fully to white) */}
      <div
        className="absolute inset-0 -top-12 -z-10 pointer-events-none overflow-hidden max-h-[420px]"
        aria-hidden="true"
      >
        {/* Glow 1: soft blue */}
        <div
          className="absolute -top-[10%] left-1/2 -translate-x-[65%] w-[420px] sm:w-[520px] h-[240px] rounded-full blur-[80px] opacity-40"
          style={{ backgroundColor: "var(--glow-1)" }}
        />
        {/* Glow 2: soft mint */}
        <div
          className="absolute top-[8%] left-1/2 -translate-x-[20%] w-[350px] sm:w-[440px] h-[220px] rounded-full blur-[90px] opacity-35"
          style={{ backgroundColor: "var(--glow-2)" }}
        />
        {/* Glow 3: soft violet */}
        <div
          className="absolute top-[5%] left-1/2 -translate-x-[50%] w-[280px] sm:w-[380px] h-[200px] rounded-full blur-[70px] opacity-30"
          style={{ backgroundColor: "var(--glow-3)" }}
        />
      </div>

      {/* Main Hero Headline: clamp(1.875rem, 1.4rem + 1.9vw, 2.75rem), weight 700, line-height 1.12, tracking -0.025em */}
      <div className="max-w-[36rem] sm:max-w-[40rem] mx-auto space-y-2.5 sm:space-y-3">
        <h1 className="text-[clamp(1.875rem,1.4rem+1.9vw,2.75rem)] font-bold tracking-[-0.025em] leading-[1.12] text-ink text-balance">
          Check a link before you click it.
        </h1>
        {/* Hero subtext: 16px desktop / 15px mobile, line-height 1.6, max-width 36rem */}
        <p className="text-[15px] sm:text-[16px] leading-[1.6] text-ink-2 max-w-[36rem] mx-auto text-balance">
          LinkShield inspects a URL’s structure and, if configured, checks Google Safe Browsing. It never opens the link for you.
        </p>
      </div>

      {/* Scan Bar Container: max-w 44rem */}
      <div className="w-full max-w-[44rem] mx-auto mt-6 sm:mt-7 space-y-2 text-left">
        <UrlForm
          onScan={onScan}
          isLoading={isLoading}
          inputUrl={inputUrl}
          setInputUrl={setInputUrl}
          error={error}
          inputRef={inputRef}
          onRetry={onRetry}
        />
        <ExampleChips onSelect={onSelectExample} disabled={isLoading} />
      </div>
    </section>
  );
};
