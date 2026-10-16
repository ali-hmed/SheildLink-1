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
    <div className="flex flex-wrap items-center gap-2.5 text-[13px] font-medium text-ink">
      <span className="select-none font-bold text-ink shrink-0 mr-0.5">Try:</span>
      <div className="flex flex-wrap items-center gap-2">
        {EXAMPLES.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.url)}
            className="h-[34px] px-3 rounded-[4px] border-2 border-ink bg-paper font-mono text-[13px] font-bold text-ink shadow-brutal-sm hover:bg-primary hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
