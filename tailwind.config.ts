import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vaani: {
          bg: "var(--color-bg)",
          surface: "var(--color-surface)",
          card: "var(--color-card)",
          "card-hover": "var(--color-card-hover)",
          border: "var(--color-border)",
          "border-subtle": "var(--color-border-subtle)",
          text: "var(--color-text)",
          "text-muted": "var(--color-text-muted)",
          "text-dim": "var(--color-text-dim)",
          // Eye-catching highlights
          accent: "var(--color-accent)",
          "accent-glow": "var(--color-accent-glow)",
          "accent-light": "#FF8C38",
          cyan: "#00F0FF",
          emerald: "#00FF9D",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Consolas", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["BubbledotICG-FinePos", "Geist Pixel Circle", "monospace"],
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px var(--color-accent-glow)",
        glow: "0 0 25px -4px var(--color-accent-glow)",
        "glow-lg": "0 0 45px -5px var(--color-accent-glow)",
        "glow-cyan": "0 0 25px -4px rgba(0, 240, 255, 0.25)",
        "glow-emerald": "0 0 25px -4px rgba(0, 255, 157, 0.25)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at 50% 20%, var(--color-hero-glow) 0%, transparent 70%)",
        "grid-pattern":
          "linear-gradient(to right, var(--color-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--color-grid) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
