import React from "react";

interface ExampleChipsProps {
  onSelect: (url: string) => void;
  disabled?: boolean;
}

const EXAMPLES = [
  { label: "IP Host", url: "http://192.168.0.1:8080/login" },
  { label: "Homoglyph", url: "https://xn--pple-43d.com/secure" },
  { label: "Credentials", url: "http://user:pass@example.com/verify" },
  { label: "Brand Spoof", url: "https://paypal.com.account-update.xyz" },
  { label: "Clean Site", url: "https://www.wikipedia.org" },
];

export const ExampleChips: React.FC<ExampleChipsProps> = ({ onSelect, disabled }) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-400">
      <span className="text-[11px] text-slate-400 mr-1 select-none">Quick tests:</span>
      {EXAMPLES.map((item, idx) => (
        <button
          key={idx}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item.url)}
          className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface hover:bg-surface-raised text-slate-400 hover:text-slate-200 border border-surface-border transition-colors disabled:opacity-40 cursor-pointer"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};
