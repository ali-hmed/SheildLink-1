import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
  themeColor: "#FFFBF0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <head>
        <title>LinkShield — URL Security Analyzer</title>
        <meta name="color-scheme" content="light" />
      </head>
      <body className="min-h-screen bg-paper text-ink antialiased font-sans font-medium selection:bg-primary selection:text-ink">
        {children}
      </body>
    </html>
  );
}
