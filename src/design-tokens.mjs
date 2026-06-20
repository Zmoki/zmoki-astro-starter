// Single source of truth for the site's color tokens.
// Imported by tailwind.config.mjs (to generate utilities) and by the
// brand reference page at /-/astro/brand/ (to document them). Keep this file
// free of Node-only APIs (no require) so it is safe to import anywhere.
//
// This is the STARTER palette — flat and MONOCHROME (brutalist). There is no
// color: every token resolves to black, white, or a grey. The token names are
// kept (so templates never change); to introduce an accent on a new site, give
// one family real hues here and the whole site picks it up.

// Accent families — kept as named roles, but monochrome in the starter.
export const accents = {
  // zmoki-primary: primary — links, nav button, hero, CTA, ink (900)
  "zmoki-primary": {
    200: "#d4d4d4",
    300: "#bcbcbc",
    400: "#8a8a8a",
    500: "#111111",
    600: "#000000",
    700: "#111111",
    800: "#0a0a0a",
    900: "#111111",
    950: "#000000",
  },
  // zmoki-accent: secondary accent (brand pages)
  "zmoki-accent": {
    200: "#e0e0e0",
    400: "#9a9a9a",
    500: "#3a3a3a",
    600: "#2a2a2a",
    700: "#1a1a1a",
  },
  // zmoki-action: action buttons (form submit, copy)
  "zmoki-action": {
    500: "#111111",
  },
  // zmoki-external: external links, brand headers
  "zmoki-external": {
    500: "#111111",
  },
  // zmoki-highlight: highlight / marker behind headings (404, callouts)
  "zmoki-highlight": {
    500: "#d4d4d4",
  },
};

// Neutrals — the structural palette. Flat single values, one per role.
export const neutrals = {
  "zmoki-bg": "#ececec", // page background (light grey)
  "zmoki-surface": "#ffffff", // cards & panels (white, defined by hard borders)
  "zmoki-ink": "#111111", // primary text, borders (near-black)
  "zmoki-muted": "#555555", // muted / meta text
};

// Merged map consumed by Tailwind.
export const colors = {
  ...accents,
  ...neutrals,
};
