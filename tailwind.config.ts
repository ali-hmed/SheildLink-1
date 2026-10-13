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
        background: "#090D16",
        surface: "#0E1524",
        "surface-raised": "#151F32",
        "surface-subtle": "#111A2C",
        "surface-border": "rgba(255, 255, 255, 0.07)",
        "surface-border-hover": "rgba(255, 255, 255, 0.14)",
        brand: {
          teal: "#14B8A6",
          "teal-hover": "#2DD4BF",
          "teal-dim": "#0F766E",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.2)",
        glow: "0 0 20px -5px rgba(20, 184, 166, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
