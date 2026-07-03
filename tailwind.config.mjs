import { colors as brandColors } from "./src/design-tokens.mjs";
import twColors from "tailwindcss/colors";
import plugin from "tailwindcss/plugin";

// Headings (h1–h6 + wordmark) share the body sans family — one clean typeface
// across the whole site (modern B2B, no serif contrast).
const headingFontStack = "'Noto Sans', system-ui, sans-serif";

// Warm near-black ink for text, headings, and prose. Sourced from the Tailwind
// stone palette (also available as `zmoki-stone-900`) so it sits warm against
// the cream background rather than a cold neutral.
const ink = twColors.stone[900];

// The bright accent — links, buttons, focus rings, CTAs. `zmoki-indigo-600`.
const accent = twColors.indigo[600];
const accentHover = twColors.indigo[700];

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  // Note: the copy-button classes injected by the rehype plugin are kept via
  // `@source inline(...)` in src/styles/global.css — Tailwind v4 dropped the
  // JS `safelist` option.
  theme: {
    // Soft + bright: Tailwind's default `borderRadius` and `boxShadow` scales are
    // left intact (rounded corners + subtle elevation shadows), so cards read as
    // soft panels — border for definition, shadow for lift — not hard outlines.
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
            // Links: indigo accent with a clean, thin underline that thickens on
            // hover — no brutalist dotted/dashed borders.
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
      // Brand type families (variable, from Google Fonts) — utilities
      // font-sans / font-serif / font-mono. These also feed the prose layer.
      // The site is all-sans; `font-serif` stays available but is unused.
      fontFamily: {
        sans: ["Noto Sans", "system-ui", "sans-serif"],
        serif: ["Noto Serif", "Georgia", "serif"],
        mono: ["Noto Sans Mono", "ui-monospace", "monospace"],
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
          fontFamily: headingFontStack,
        },
        // Global link feedback: a gentle indigo shift on hover for otherwise
        // unstyled links. Wrapped in `:where()` so the rule carries ZERO
        // specificity — any explicit text color on a link (e.g. `text-white`
        // on a button, or `text-zmoki-stone-600` on a nav item) wins cleanly.
        // Without this, `a:hover` (a pseudo-class, specificity 0,1,1) beats a
        // plain `.text-white` utility (0,1,0) and turns button labels indigo.
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
