import React from "react";

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="w-full py-8 sm:py-10 border-t border-border">
      <div className="space-y-2 mb-6">
        <h2 className="text-[20px] sm:text-[22px] font-bold text-ink tracking-tight">
          How it works
        </h2>
        <p className="text-[14px] sm:text-[15px] text-ink-2 max-w-xl">
          LinkShield evaluates URLs completely passively using deterministic inspection rules and official threat feeds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Step 1 */}
        <div className="p-4 sm:p-5 rounded-[12px] bg-surface-soft border border-border space-y-2">
          <div className="text-[12px] font-mono font-bold text-brand">
            01
          </div>
          <h3 className="text-[16px] font-bold text-ink">
            Paste a link
          </h3>
          <p className="text-[13px] sm:text-[14px] text-ink-2 leading-relaxed">
            The link is parsed, decomposed, and normalized according to web standards. LinkShield never makes an HTTP request to the target site.
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-4 sm:p-5 rounded-[12px] bg-surface-soft border border-border space-y-2">
          <div className="text-[12px] font-mono font-bold text-brand">
            02
          </div>
          <h3 className="text-[16px] font-bold text-ink">
            Rule checks
          </h3>
          <p className="text-[13px] sm:text-[14px] text-ink-2 leading-relaxed">
            Syntactic heuristics scan for embedded credentials, direct IP hosts, homoglyphs, non-standard ports, known shorteners, and brand impersonation.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-4 sm:p-5 rounded-[12px] bg-surface-soft border border-border space-y-2">
          <div className="text-[12px] font-mono font-bold text-brand">
            03
          </div>
          <h3 className="text-[16px] font-bold text-ink">
            Reputation & domain checks
          </h3>
          <p className="text-[13px] sm:text-[14px] text-ink-2 leading-relaxed">
            Google Safe Browsing is queried when configured, alongside an isolated DNS-only lookup to verify if the hostname currently resolves.
          </p>
        </div>
      </div>
    </section>
  );
};
