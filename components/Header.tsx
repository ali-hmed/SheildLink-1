"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full h-[60px] bg-white border-b border-[#EAECF0]">
      <div className="max-w-[720px] mx-auto h-full px-5 sm:px-6 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <a
          href="#"
          className="flex items-center gap-2.5 text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg py-1 transition-opacity hover:opacity-90"
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

        {/* Desktop Navigation */}
        <nav aria-label="Page navigation" className="hidden sm:flex items-center gap-6 text-[14px] text-slate-600">
          <a
            href="#how-it-works"
            className="hover:text-[#111111] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded py-1 px-1.5"
          >
            How it works
          </a>
          <a
            href="#limitations"
            className="hover:text-[#111111] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded py-1 px-1.5"
          >
            Limitations
          </a>
        </nav>

        {/* Mobile menu button */}
        <div className="sm:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-[#111111] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-[#EAECF0] px-5 py-3 space-y-2 text-[15px] animate-fade-in shadow-sm">
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-600 hover:text-[#111111]"
          >
            How it works
          </a>
          <a
            href="#limitations"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-600 hover:text-[#111111]"
          >
            Limitations
          </a>
        </div>
      )}
    </header>
  );
};
