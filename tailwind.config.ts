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
        bg: "var(--bg)",
        "surface-soft": "var(--surface-soft)",
        border: "var(--border)",
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
        },
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          press: "var(--brand-press)",
          tint: "var(--brand-tint)",
        },
        focus: {
          ring: "var(--focus-ring)",
        },
        verdict: {
          ok: {
            text: "var(--verdict-ok-text)",
            tint: "var(--verdict-ok-tint)",
            border: "var(--verdict-ok-border)",
          },
          low: {
            text: "var(--verdict-low-text)",
            tint: "var(--verdict-low-tint)",
            border: "var(--verdict-low-border)",
          },
          suspicious: {
            text: "var(--verdict-suspicious-text)",
            tint: "var(--verdict-suspicious-tint)",
            border: "var(--verdict-suspicious-border)",
          },
          high: {
            text: "var(--verdict-high-text)",
            tint: "var(--verdict-high-tint)",
            border: "var(--verdict-high-border)",
          },
          info: {
            text: "var(--verdict-info-text)",
            tint: "var(--verdict-info-tint)",
            border: "var(--verdict-info-border)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-jetbrains)", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(10, 15, 31, 0.04), 0 1px 3px 1px rgba(10, 15, 31, 0.02)",
        layered: "0 2px 4px 0 rgba(10, 15, 31, 0.03), 0 8px 16px -2px rgba(10, 15, 31, 0.04)",
        dialog: "0 12px 32px -4px rgba(10, 15, 31, 0.08), 0 4px 12px -2px rgba(10, 15, 31, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
