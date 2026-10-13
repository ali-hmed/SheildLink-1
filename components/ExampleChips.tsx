import React from "react";
import { Sparkles } from "lucide-react";

interface ExampleChipsProps {
  onSelect: (url: string) => void;
  disabled?: boolean;
}

const EXAMPLES = [
  {
    label: "Private IP & Custom Port",
    url: "http://192.168.0.1:8080/login",
    desc: "Internal IP, plain HTTP, custom port",
  },
  {
    label: "Homoglyph / Punycode",
    url: "https://xn--pple-43d.com/secure/account",
    desc: "Punycode domain impersonation",
  },
  {
    label: "Embedded Credentials",
    url: "http://user:secret123@example.com/verify",
    desc: "user:pass@host deceptive pattern",
  },
  {
    label: "Brand Subdomain Spoof",
    url: "https://paypal.com.verify-billing.xyz/login",
    desc: "Brand lookalike & abused TLD",
  },
  {
    label: "Clean Benchmark",
    url: "https://www.wikipedia.org",
    desc: "Standard HTTPS domain",
  },
];

export const ExampleChips: React.FC<ExampleChipsProps> = ({ onSelect, disabled }) => {
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-brand-teal" aria-hidden="true" />
        <span className="font-medium">Test with inert heuristic examples (fills input only):</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((example, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(example.url)}
            title={example.desc}
            className="px-2.5 py-1 rounded-lg text-xs font-mono bg-surface-raised hover:bg-surface-border text-slate-300 hover:text-brand-teal border border-surface-border/60 transition-colors focus:outline-none focus:ring-1 focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
};
