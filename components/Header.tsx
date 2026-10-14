import React from "react";

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full h-[56px] sm:h-[64px] bg-white border-b border-[#EAECF0]">
      <div className="max-w-[1200px] mx-auto h-full px-5 sm:px-8 flex items-center justify-between whitespace-nowrap">
        {/* Brand Logo & Name - Far Left */}
        <a
          href="#"
          className="flex items-center gap-2.5 text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg py-1 transition-opacity hover:opacity-90 shrink-0"
          aria-label="LinkShield Home"
        >
          {/* Keep existing shield logo exactly as is */}
          <svg
            className="w-6 h-6 text-accent shrink-0"
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
          <span className="text-[17px] font-semibold tracking-tight text-[#111111]">
            LinkShield
          </span>
        </a>

        {/* Navigation - Far Right */}
        <nav
          aria-label="Page navigation"
          className="flex items-center gap-5 sm:gap-8 text-sm text-slate-600 shrink-0"
        >
          <a
            href="#how-it-works"
            className="px-1 py-2 hover:text-[#111111] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            How it works
          </a>
          <a
            href="#limitations"
            className="px-1 py-2 hover:text-[#111111] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Limitations
          </a>
        </nav>
      </div>
    </header>
  );
};
