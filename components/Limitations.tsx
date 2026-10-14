import React from "react";

export const Limitations: React.FC = () => {
  return (
    <section id="limitations" className="w-full py-6 border-t border-[#EAECF0]">
      <div className="max-w-[720px] mx-auto space-y-2">
        <h2 className="text-[18px] sm:text-[20px] font-bold text-[#111111] tracking-tight">
          Limitations
        </h2>
        <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed">
          LinkShield evaluates links through passive structural inspection, DNS checks, and registry metadata without downloading page content or running scripts. Heuristic analysis can miss novel attack patterns, newly registered malicious domains, or compromised legitimate sites. A safe verdict indicates no flagged anomalies by these checks, never an absolute guarantee of safety.
        </p>
      </div>
    </section>
  );
};
