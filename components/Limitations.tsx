import React from "react";

export const Limitations: React.FC = () => {
  return (
    <section id="limitations" className="w-full py-8 sm:py-10 border-t border-border">
      <div className="max-w-2xl space-y-2.5">
        <h2 className="text-[20px] sm:text-[22px] font-bold text-ink tracking-tight">
          Limitations
        </h2>
        <p className="text-[14px] sm:text-[15px] text-ink-2 leading-relaxed">
          LinkShield evaluates URLs strictly through passive syntactic heuristics, domain records, and optional reputation feeds. Because it never fetches page content or executes scripts, heuristics can miss novel attack patterns or produce false flags on legitimate unusual URLs. A status of &ldquo;no issues detected&rdquo; is never a guarantee of absolute safety.
        </p>
      </div>
    </section>
  );
};
