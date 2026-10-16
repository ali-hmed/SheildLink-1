import React from "react";

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="w-full max-w-[760px] mx-auto px-5 sm:px-8">
      <div className="bg-white rounded-[4px] border-2 border-ink p-6 sm:p-7 shadow-brutal">
        <h2 className="text-[20px] sm:text-[22px] font-heading font-extrabold text-ink tracking-tight">
          How it works
        </h2>
        {/* Small yellow underline bar */}
        <div className="w-12 h-1.5 bg-primary border border-ink mt-1.5 mb-4" />

        {/* Short, honest 3-line list, simple bordered blocks, no numbering badges */}
        <ul className="space-y-3 text-[14px] sm:text-[15px] text-ink font-medium list-none p-0 m-0">
          <li className="flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-[1px] bg-primary border border-ink shrink-0 mt-1.5" aria-hidden="true" />
            <span className="leading-relaxed">
              Parses and normalizes the link structure, scheme, host, and port without requesting or executing page content.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-[1px] bg-primary border border-ink shrink-0 mt-1.5" aria-hidden="true" />
            <span className="leading-relaxed">
              Verifies public DNS records, performs a TLS certificate handshake, and looks up domain registration via RDAP.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-[1px] bg-primary border border-ink shrink-0 mt-1.5" aria-hidden="true" />
            <span className="leading-relaxed">
              Screens for homoglyph lookalikes against popular domains and queries Google Safe Browsing if configured.
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
};
