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
        theme: {
          bg: {
            base: "rgb(var(--color-bg-base) / <alpha-value>)",
            dark: "rgb(var(--color-bg-dark) / <alpha-value>)",
            panel: "rgb(var(--color-bg-panel) / <alpha-value>)",
            "dark-panel": "rgb(var(--color-bg-dark-panel) / <alpha-value>)",
          },
          text: {
            base: "rgb(var(--color-text-base) / <alpha-value>)",
            light: "rgb(var(--color-text-light) / <alpha-value>)",
            muted: "rgb(var(--color-text-muted) / <alpha-value>)",
          },
          accent: {
            main: "rgb(var(--color-accent-main) / <alpha-value>)",
            "main-hover": "rgb(var(--color-accent-main-hover) / <alpha-value>)",
            muted: "rgb(var(--color-accent-muted) / <alpha-value>)",
          },
          border: {
            base: "rgb(var(--color-border-base) / <alpha-value>)",
            dark: "rgb(var(--color-border-dark) / <alpha-value>)",
          },
        },
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-2px)" },
          "75%": { transform: "translateX(2px)" },
        },
      },
      animation: {
        shake: "shake 0.5s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;