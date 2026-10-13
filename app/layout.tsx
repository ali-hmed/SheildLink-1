import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkShield — URL Security Analyzer",
  description: "Static heuristic URL risk analysis and Google Safe Browsing reputation lookup.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-slate-100 antialiased selection:bg-brand-teal selection:text-slate-950 font-sans">
        {children}
      </body>
    </html>
  );
}
