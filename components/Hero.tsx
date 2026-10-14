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
    <section className="pt-10 sm:pt-16 pb-6 sm:pb-8 flex flex-col items-center text-center">
      <div className="w-full max-w-[720px] mx-auto space-y-4">
        {/* H1: 40-48px desktop / 30-34px mobile, tracking-tight, #111 */}
        <h1 className="text-[30px] sm:text-[44px] font-bold text-[#111111] tracking-tight leading-[1.15]">
          Check a link before you click it.
        </h1>

        {/* One-line subtext */}
        <p className="text-[15px] sm:text-[16px] text-slate-600 max-w-[600px] mx-auto leading-normal">
          Paste any URL. We analyze it without opening it.
        </p>

        {/* Scan form and example chips */}
        <div className="pt-4 text-left">
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
      </div>
    </section>
  );
};
