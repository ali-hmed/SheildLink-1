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
    <section className="relative pt-16 sm:pt-24 pb-12 sm:pb-16 flex flex-col items-center text-center">
      {/* 2-3 Ethereal soft blurred color glows (hero only, static/subtle, fade fully to white) */}
      <div
        className="absolute inset-0 -top-20 -z-10 pointer-events-none overflow-hidden max-h-[600px]"
        aria-hidden="true"
      >
        {/* Glow 1: soft blue */}
        <div
          className="absolute -top-[10%] left-1/2 -translate-x-[65%] w-[550px] sm:w-[700px] h-[350px] rounded-full blur-[100px] opacity-40"
          style={{ backgroundColor: "var(--glow-1)" }}
        />
        {/* Glow 2: soft mint */}
        <div
          className="absolute top-[10%] left-1/2 -translate-x-[20%] w-[450px] sm:w-[600px] h-[320px] rounded-full blur-[110px] opacity-35"
          style={{ backgroundColor: "var(--glow-2)" }}
        />
        {/* Glow 3: soft violet */}
        <div
          className="absolute top-[5%] left-1/2 -translate-x-[50%] w-[380px] sm:w-[500px] h-[300px] rounded-full blur-[90px] opacity-30"
          style={{ backgroundColor: "var(--glow-3)" }}
        />
      </div>

      {/* Main Hero Headline */}
      <div className="max-w-[48rem] mx-auto space-y-4 sm:space-y-5">
        <h1 className="text-[clamp(2.5rem,1.9rem+3vw,4.25rem)] font-bold tracking-[-0.03em] leading-[1.05] text-ink text-balance">
          Check a link before you click it.
        </h1>
        <p className="text-[17px] sm:text-[19px] leading-[1.6] text-ink-2 max-w-[40rem] mx-auto text-balance">
          LinkShield inspects a URL’s structure and, if configured, checks Google Safe Browsing. It never opens the link for you.
        </p>
      </div>

      {/* Scan Bar Container */}
      <div className="w-full max-w-[48rem] mx-auto mt-8 sm:mt-10 space-y-3 text-left">
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
