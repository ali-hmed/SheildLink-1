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
      fontSize: {
        h1: ["clamp(1.875rem, 1.4rem + 1.9vw, 2.75rem)", { lineHeight: "1.12", letterSpacing: "-0.025em", fontWeight: "700" }],
        "section-title": ["1.375rem", { lineHeight: "1.25", fontWeight: "650" }], // 22px
        "verdict-title": ["1.4375rem", { lineHeight: "1.25", fontWeight: "700" }], // 23px
        body: ["0.9375rem", { lineHeight: "1.6" }], // 15px
        caption: ["0.8125rem", { lineHeight: "1.4" }], // 13px
        mono: ["0.875rem", { lineHeight: "1.5" }], // 14px
      },
      maxWidth: {
        page: "64rem", // 1024px
        hero: "40rem", // 640px
        column: "44rem", // 704px
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(10, 15, 31, 0.04), 0 1px 3px 1px rgba(10, 15, 31, 0.02)",
        layered: "0 1px 3px 0 rgba(10, 15, 31, 0.03), 0 4px 12px -2px rgba(10, 15, 31, 0.03)",
        dialog: "0 12px 32px -4px rgba(10, 15, 31, 0.08), 0 4px 12px -2px rgba(10, 15, 31, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
