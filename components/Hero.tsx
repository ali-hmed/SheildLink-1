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
    <section className="w-full max-w-[880px] mx-auto px-5 sm:px-8 pt-10 sm:pt-16">
      <div className="flex flex-col items-center text-center">
        {/*
          Heading:
          Single line at >=1024px: font-size clamp(2.25rem, 4.2vw, 3.25rem), font-weight 600,
          letter-spacing -0.02em, line-height 1.1, whitespace-nowrap on desktop only.
          Mobile (<640px): 2 balanced lines, 28-30px, line-height 1.15, centered, never overflows.
        */}
        <h1 className="text-[28px] sm:text-[34px] lg:text-[clamp(2.25rem,4.2vw,3.25rem)] font-semibold text-[#111111] tracking-[-0.02em] leading-[1.15] lg:leading-[1.1] [text-wrap:balance] lg:whitespace-nowrap text-center">
          Check a link before you click it.
        </h1>

        {/*
          Subtext:
          16-17px desktop, 15px mobile, slate-600, max-w-[520px] centered, with 12px gap below heading.
        */}
        <p className="text-[15px] sm:text-[16px] lg:text-[17px] text-slate-600 max-w-[520px] mx-auto leading-normal text-center mt-3">
          Paste any URL. We analyze it without opening it.
        </p>

        {/* Input container with 32px gap below subtext */}
        <div className="w-full mt-8 text-left">
          <UrlForm
            onScan={onScan}
            isLoading={isLoading}
            inputUrl={inputUrl}
            setInputUrl={setInputUrl}
            error={error}
            inputRef={inputRef}
            onRetry={onRetry}
          />
          {/* Example chips with 16px gap below input */}
          <div className="mt-4">
            <ExampleChips onSelect={onSelectExample} disabled={isLoading} />
          </div>
        </div>
      </div>
    </section>
  );
};
