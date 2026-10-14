import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#EAECF0",
        heading: "#111111",
        accent: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          light: "#EFF6FF",
        },
        risk: {
          safe: "#16A34A",
          "safe-bg": "#F0FDF4",
          "safe-border": "#BBF7D0",
          low: "#D97706",
          "low-bg": "#FFFBEB",
          "low-border": "#FDE68A",
          medium: "#EA580C",
          "medium-bg": "#FFF7ED",
          "medium-border": "#FED7AA",
          high: "#DC2626",
          "high-bg": "#FEF2F2",
          "high-border": "#FECACA",
          gray: "#64748B",
          "gray-bg": "#F8FAFC",
          "gray-border": "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-jetbrains)", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      letterSpacing: {
        tight: "-0.02em",
      },
    },
  },
  plugins: [],
};

export default config;
