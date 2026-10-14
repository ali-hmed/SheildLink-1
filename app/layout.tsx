import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LinkShield — URL Security Analyzer",
  description: "Check a link before you click it. Passive link analysis without opening the site.",
  other: {
    "color-scheme": "light",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className="min-h-screen bg-white text-slate-600 antialiased font-sans selection:bg-blue-50 selection:text-blue-600">
        {children}
      </body>
    </html>
  );
}
