import React from "react";

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="w-full pt-8 pb-4 border-t border-[#EAECF0]">
      <div className="max-w-[720px] mx-auto space-y-4">
        <h2 className="text-[18px] sm:text-[20px] font-bold text-[#111111] tracking-tight">
          How it works
        </h2>

        {/* Short, honest 3-line list, no numbering badges */}
        <ul className="space-y-2.5 text-[14px] sm:text-[15px] text-slate-600 list-disc list-inside">
          <li className="leading-relaxed">
            Parses and normalizes the link structure, scheme, host, and port without requesting or executing page content.
          </li>
          <li className="leading-relaxed">
            Verifies public DNS records, performs a TLS certificate handshake, and looks up domain registration via RDAP.
          </li>
          <li className="leading-relaxed">
            Screens for homoglyph lookalikes against popular domains and queries Google Safe Browsing if configured.
          </li>
        </ul>
      </div>
    </section>
  );
};
