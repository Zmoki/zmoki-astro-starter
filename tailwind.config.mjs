import { colors as brandColors, fonts } from "./src/design-tokens.mjs";
import twColors from "tailwindcss/colors";
import plugin from "tailwindcss/plugin";

// Headings use the body sans. The variable already includes the optimized fallback.
const headingFontStack = `var(${fonts.sans.variable})`;

// Warm near-black text (`zmoki-stone-900`).
const ink = twColors.stone[900];

// Accent for links, buttons and focus rings (`zmoki-indigo-600`).
const accent = twColors.indigo[600];
const accentHover = twColors.indigo[700];

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      typography: () => ({
        DEFAULT: {
          css: {
            "--tw-prose-headings": ink,
            "--tw-prose-body": twColors.stone[700],
            "--tw-prose-bold": ink,
            "--tw-prose-links": accent,
            "h1, h2, h3, h4, h5, h6": {
              fontFamily: headingFontStack,
            },
            // Drop the backticks Typography adds around inline <code>.
            "code::before": { content: '""' },
            "code::after": { content: '""' },
            // Thin underline that thickens on hover.
            a: {
              color: accent,
              "text-decoration": "underline",
              "text-decoration-thickness": "1px",
              "text-underline-offset": "2px",
            },
            "a:hover": {
              color: accentHover,
              "text-decoration-thickness": "2px",
            },
            "[data-external]": {
              color: accent,
            },
            "[data-resource]": {
              color: accent,
            },
            "[data-anchor]": {
              color: accent,
            },
          },
        },
      }),
      // `font-serif` is available but unused.
      fontFamily: {
        sans: [`var(${fonts.sans.variable})`],
        serif: ["Noto Serif", "Georgia", "serif"],
        mono: [`var(${fonts.mono.variable})`],
      },
      colors: brandColors,
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    // Base-layer defaults, so every layout gets the same headings and links.
    plugin(({ addBase }) => {
      addBase({
        "h1, h2, h3, h4, h5, h6": {
          fontFamily: headingFontStack,
        },
        // `:where()` gives the hover zero specificity, so a link's own color
        // utility (e.g. `text-white` on a button) wins. Plain `a:hover` would
        // beat it and turn button labels indigo.
        a: {
          "text-decoration": "none",
          transition: "color 200ms",
        },
        "a:where(:hover)": {
          color: accentHover,
        },
      });
    }),
  ],
};
