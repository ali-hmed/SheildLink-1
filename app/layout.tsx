import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LinkShield — URL Security Analyzer",
  description: "Inspect a URL's structure and reputation before opening it. LinkShield never visits the link for you.",
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
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased selection:bg-brand-tint selection:text-brand font-sans">
        {children}
      </body>
    </html>
  );
}
