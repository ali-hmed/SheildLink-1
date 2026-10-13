import React from "react";

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="w-full py-12 sm:py-16 border-t border-border">
      <div className="space-y-3 mb-8">
        <h2 className="text-[28px] sm:text-[32px] font-bold text-ink tracking-tight">
          How it works
        </h2>
        <p className="text-base sm:text-lg text-ink-2 max-w-2xl">
          LinkShield evaluates URLs completely passively using deterministic inspection rules and official threat feeds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {/* Step 1 */}
        <div className="p-6 rounded-2xl bg-surface-soft border border-border space-y-3">
          <div className="text-sm font-mono font-bold text-brand">
            01
          </div>
          <h3 className="text-lg font-bold text-ink">
            Paste a link
          </h3>
          <p className="text-sm sm:text-[15px] text-ink-2 leading-relaxed">
            The link is parsed, decomposed, and normalized according to web standards. LinkShield never makes an HTTP request to the target site.
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-6 rounded-2xl bg-surface-soft border border-border space-y-3">
          <div className="text-sm font-mono font-bold text-brand">
            02
          </div>
          <h3 className="text-lg font-bold text-ink">
            Rule checks
          </h3>
          <p className="text-sm sm:text-[15px] text-ink-2 leading-relaxed">
            Syntactic heuristics scan for embedded credentials, direct IP hosts, homoglyphs, non-standard ports, known shorteners, and brand impersonation.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-6 rounded-2xl bg-surface-soft border border-border space-y-3">
          <div className="text-sm font-mono font-bold text-brand">
            03
          </div>
          <h3 className="text-lg font-bold text-ink">
            Reputation & domain checks
          </h3>
          <p className="text-sm sm:text-[15px] text-ink-2 leading-relaxed">
            Google Safe Browsing is queried when configured, alongside an isolated DNS-only lookup to verify if the hostname currently resolves.
          </p>
        </div>
      </div>
    </section>
  );
};
