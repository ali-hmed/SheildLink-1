import React from "react";

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full h-[56px] sm:h-[64px] bg-white border-b-2 border-ink">
      <div className="max-w-[1200px] mx-auto h-full px-5 sm:px-8 flex items-center justify-between whitespace-nowrap">
        {/* Brand Logo & Name - Far Left */}
        <a
          href="#"
          className="flex items-center gap-2.5 text-ink rounded-[4px] py-1 transition-transform duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 shrink-0"
          aria-label="LinkShield Home"
        >
          {/* Keep existing shield logo exactly as is */}
          <svg
            className="w-6 h-6 text-ink shrink-0"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M16 3L5 7.5V14.5C5 21.2 9.7 27.4 16 29C22.3 27.4 27 21.2 27 14.5V7.5L16 3Z"
              fill="#FFE14D"
              stroke="#111111"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M13 14C11.3431 14 10 15.3431 10 17C10 18.6569 11.3431 20 13 20H15M19 18C20.6569 18 22 16.6569 22 15C22 13.3431 20.6569 12 19 12H17"
              stroke="#111111"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12.5 17H19.5"
              stroke="#111111"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[18px] sm:text-[20px] font-heading font-extrabold tracking-tight text-ink">
            LinkShield
          </span>
        </a>

        {/* Navigation - Far Right */}
        <nav
          aria-label="Page navigation"
          className="flex items-center gap-4 sm:gap-8 text-sm font-bold text-ink shrink-0"
        >
          <a
            href="#how-it-works"
            className="px-2.5 py-1 border-2 border-transparent hover:border-ink hover:bg-primary hover:shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 rounded-[4px]"
          >
            How it works
          </a>
          <a
            href="#limitations"
            className="px-2.5 py-1 border-2 border-transparent hover:border-ink hover:bg-primary hover:shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-100 rounded-[4px]"
          >
            Limitations
          </a>
        </nav>
      </div>
    </header>
  );
};
