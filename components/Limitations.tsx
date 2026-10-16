import React from "react";

export const Limitations: React.FC = () => {
  return (
    <section id="limitations" className="w-full max-w-[760px] mx-auto px-5 sm:px-8">
      <div className="bg-white rounded-[4px] border-2 border-ink p-6 sm:p-7 shadow-brutal">
        <h2 className="text-[20px] sm:text-[22px] font-heading font-extrabold text-ink tracking-tight">
          Limitations
        </h2>
        {/* Small yellow underline bar */}
        <div className="w-12 h-1.5 bg-primary border border-ink mt-1.5 mb-4" />

        <p className="text-[14px] sm:text-[15px] text-ink font-medium leading-relaxed">
          LinkShield evaluates links through passive structural inspection, DNS checks, and registry metadata without downloading page content or running scripts. Heuristic analysis can miss novel attack patterns, newly registered malicious domains, or compromised legitimate sites. A safe verdict indicates no flagged anomalies by these checks, never an absolute guarantee of safety.
        </p>
      </div>
    </section>
  );
};
