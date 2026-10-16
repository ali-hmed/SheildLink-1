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
        ink: "#111111",
        paper: "#FFFBF0",
        primary: {
          DEFAULT: "#FFE14D",
          hover: "#FFD92E",
        },
        secondary: {
          DEFAULT: "#5B8CFF",
          hover: "#4579F5",
        },
        risk: {
          safe: "#3DDC84",
          low: "#FFD23F",
          medium: "#FF9F43",
          high: "#FF5C5C",
          neutral: "#D9D9D9",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Space Grotesk", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderWidth: {
        "3": "3px",
      },
      boxShadow: {
        "brutal-sm": "2px 2px 0px #111111",
        "brutal": "4px 4px 0px #111111",
        "brutal-md": "5px 5px 0px #111111",
        "brutal-lg": "6px 6px 0px #111111",
        "brutal-xl": "7px 7px 0px #111111",
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
