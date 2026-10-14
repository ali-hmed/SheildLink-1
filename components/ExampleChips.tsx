import React from "react";

interface ExampleChipsProps {
  onSelect: (url: string) => void;
  disabled?: boolean;
}

const EXAMPLES = [
  { label: "example.com", url: "https://example.com" },
  { label: "reanime.t0", url: "https://reanime.t0" },
  { label: "192.168.1.1", url: "http://192.168.1.1" },
];

export const ExampleChips: React.FC<ExampleChipsProps> = ({ onSelect, disabled }) => {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 text-[13px] text-slate-500">
      <span className="select-none text-slate-400 shrink-0">Try:</span>
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        {EXAMPLES.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.url)}
            className="h-[32px] px-2.5 rounded-lg font-mono text-[13px] text-slate-600 hover:text-[#111111] hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
