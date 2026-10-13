import React from "react";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border py-8 text-xs text-ink-3">
      <div className="max-w-[72rem] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span>&copy; {currentYear} LinkShield. Heuristic risk inspection.</span>
        </div>
        <div className="flex items-center gap-6">
          <span>Passive analysis only</span>
          <span>FastAPI &bull; Next.js</span>
        </div>
      </div>
    </footer>
  );
};
