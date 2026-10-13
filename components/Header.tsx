import React from "react";
import { HealthResponse } from "@/lib/types";

interface HeaderProps {
  health: HealthResponse | null;
}

export const Header: React.FC<HeaderProps> = ({ health }) => {
  return (
    <header className="sticky top-0 z-40 w-full h-[72px] bg-bg/95 backdrop-blur-sm border-b border-border transition-colors">
      <div className="max-w-[72rem] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Link & Custom Shield SVG */}
        <a
          href="#"
          className="flex items-center gap-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-lg py-1 px-1 -ml-1 transition-opacity hover:opacity-90"
          aria-label="LinkShield Home"
        >
          <svg
            className="w-8 h-8 text-brand"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M16 3L5 7.5V14.5C5 21.2 9.7 27.4 16 29C22.3 27.4 27 21.2 27 14.5V7.5L16 3Z"
              fill="currentColor"
              fillOpacity="0.08"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M13 14C11.3431 14 10 15.3431 10 17C10 18.6569 11.3431 20 13 20H15M19 18C20.6569 18 22 16.6569 22 15C22 13.3431 20.6569 12 19 12H17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12.5 17H19.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-xl font-bold tracking-tight text-ink">
            LinkShield
          </span>
        </a>

        {/* Navigation & Engine Status */}
        <div className="flex items-center gap-6 sm:gap-8">
          <nav aria-label="Page navigation" className="hidden sm:flex items-center gap-6 text-[15px] font-medium text-ink-2">
            <a
              href="#how-it-works"
              className="hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded py-1 px-1.5"
            >
              How it works
            </a>
            <a
              href="#limitations"
              className="hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded py-1 px-1.5"
            >
              Limitations
            </a>
          </nav>

          <div
            className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-surface-soft border border-border text-ink-3"
            title={health?.reputation_provider === "configured" ? "Safe Browsing API configured" : "Local static rules active"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === "ok" ? "bg-emerald-500" : "bg-ink-3"
              }`}
              aria-hidden="true"
            />
            <span>
              {health?.reputation_provider === "configured"
                ? "Safe Browsing active"
                : "Static engine active"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
