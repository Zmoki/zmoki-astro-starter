import { colors as brandColors } from "./src/design-tokens.mjs";
import twColors from "tailwindcss/colors";
import plugin from "tailwindcss/plugin";

// The monochrome ink used for text, borders, fills, and prose. Sourced from
// the Tailwind neutral palette (also available as `zmoki-neutral-900`).
const ink = twColors.neutral[900];

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  safelist: [
    // Copy button classes added dynamically in rehype plugin
    "relative",
    "absolute",
    "top-2",
    "right-2",
    "px-3",
    "py-1.5",
    "text-xs",
    "font-medium",
    "font-mono",
    "uppercase",
    "tracking-normal",
    "rounded-sm",
    "bg-zmoki-neutral-900",
    "text-white",
    "hover:bg-zmoki-neutral-900/80",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-zmoki-neutral-900",
    "focus:ring-offset-2",
    "transition-colors",
    "duration-200",
  ],
  theme: {
    // Brutalist: flat (no shadows) and sharp (no rounded corners) everywhere.
    // Overriding the scales here flattens every `shadow-*` / `rounded-*` utility
    // site-wide without touching templates.
    borderRadius: {
      none: "0",
      sm: "0",
      DEFAULT: "0",
      md: "0",
      lg: "0",
      xl: "0",
      "2xl": "0",
      "3xl": "0",
      full: "0",
    },
    boxShadow: {
      none: "none",
      sm: "none",
      DEFAULT: "none",
      md: "none",
      lg: "none",
      xl: "none",
      "2xl": "none",
      inner: "none",
    },
    extend: {
      typography: () => ({
        DEFAULT: {
          css: {
            "--tw-prose-headings": ink,
            "--tw-prose-body": ink,
            "--tw-prose-bold": ink,
            "--tw-prose-links": ink,
            "h1, h2, h3, h4, h5, h6": {
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
            },
            a: {
              "text-decoration": "none",
              "border-color": "currentColor",
              "border-bottom-width": "4px",
              "border-style": "dotted",
            },
            "[data-external]": {
              color: ink,
            },
            "[data-resource]": {
              color: ink,
            },
            "[data-anchor]": {
              color: ink,
              "border-style": "dashed",
              "border-bottom-width": "2px",
            },
          },
        },
      }),
      fontFamily: {
        sans: ["Google Sans Flex", "system-ui", "sans-serif"],
        heading: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["Space Mono", "ui-monospace", "monospace"],
      },
      // Brand color tokens live in src/design-tokens.mjs (single source
      // of truth, also consumed by the /-/astro/brand/ reference page).
      colors: brandColors,
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    // Global link interaction, driven by the brand tokens. Lives in the base
    // layer so every page inherits identical behavior — no per-layout class
    // strings to copy or forget (this used to be a `[&_a]` body class on
    // BaseLayout only, which is why brand pages had dead links).
    plugin(({ addBase }) => {
      addBase({
        "h1, h2, h3, h4, h5, h6": {
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
        },
        a: {
          "text-decoration": "none",
          transition: "all 200ms",
        },
        "a:hover": {
          backgroundColor: ink,
          color: "#fff",
          outlineStyle: "solid",
          outlineColor: ink,
        },
      });
    }),
  ],
};
