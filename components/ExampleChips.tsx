import React from "react";

interface ExampleChipsProps {
  onSelect: (url: string) => void;
  disabled?: boolean;
}

const EXAMPLES = [
  { label: "IP host", url: "http://192.168.0.1:8080/login" },
  { label: "Homoglyph", url: "https://xn--pple-43d.com/secure" },
  { label: "Embedded credentials", url: "http://user:pass@example.com/verify" },
  { label: "Brand lookalike", url: "https://paypal.com.account-update.xyz" },
  { label: "Clean site", url: "https://www.wikipedia.org" },
];

export const ExampleChips: React.FC<ExampleChipsProps> = ({ onSelect, disabled }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-ink-3">
      <span className="text-sm font-medium text-ink-3 select-none">Try an example:</span>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((item, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.url)}
            className="min-h-[32px] px-3 py-1 rounded-full text-xs font-mono bg-surface-soft hover:bg-slate-200 text-ink-2 hover:text-ink border border-border transition-colors disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
