import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t-2 border-ink py-7 sm:py-8 mt-12 sm:mt-[72px]">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
        <p className="order-2 sm:order-1 text-sm font-bold text-ink">
          &copy; 2026 LinkShield
        </p>

        {/* Small bordered buttons with hard shadows */}
        <div className="order-1 sm:order-2 flex items-center gap-3">
          <a
            href="https://github.com/ali-hmed"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View the developer on GitHub, opens in a new tab"
            className="h-[38px] px-3.5 inline-flex items-center gap-2 rounded-[4px] border-2 border-ink bg-white hover:bg-primary font-heading font-extrabold text-[13px] text-ink shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 cursor-pointer"
          >
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
          </a>

          <a
            href="https://x.com/intent/tweet?text=Check%20a%20link%20before%20you%20click%20it%20with%20LinkShield"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on X, opens in a new tab"
            className="h-[38px] px-3.5 inline-flex items-center gap-2 rounded-[4px] border-2 border-ink bg-white hover:bg-primary font-heading font-extrabold text-[13px] text-ink shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#111111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Share on X</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
