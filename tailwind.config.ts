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
        background: "#0B1220",
        surface: "#0F172A",
        "surface-raised": "#1E293B",
        "surface-border": "#334155",
        brand: {
          teal: "#14B8A6",
          "teal-hover": "#0D9488",
          "teal-dim": "#115E59",
        },
      },
    },
  },
  plugins: [],
};

export default config;
