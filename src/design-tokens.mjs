// Single source of truth for the site's color palette.
//
// Instead of bespoke semantic role tokens, this exposes Tailwind's default
// color palettes under the `zmoki-` prefix — `zmoki-slate`, `zmoki-red`,
// `zmoki-neutral`, … — each a full 50→950 scale. So every Tailwind palette is
// available as a namespaced utility: `bg-zmoki-neutral-900`, `text-zmoki-red-500`,
// `border-zmoki-slate-200`, and so on.
//
// Imported by tailwind.config.mjs (to generate the utilities) and by the brand
// reference page at /-/astro/brand/color/ (to document them). Keep this file
// free of Node-only APIs so it is safe to import anywhere (Astro and Tailwind).

import twColors from "tailwindcss/colors";

// The Tailwind palettes we surface, in their canonical documentation order.
// (Greys first, then the chromatic ramp.) Each name maps to a { 50..950 } scale.
export const paletteNames = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

// ─── Re-skinning: how to change the palette ────────────────────────────────
//
// The starter is monochrome — templates use `zmoki-neutral`. Two ways to give
// the site color (full guide in SETUP.md → "Palette"):
//
//   A. Use a built-in Tailwind palette. Nothing to edit here — every group is
//      already generated. Swap the prefix in templates, e.g. find/replace
//      `zmoki-neutral` → `zmoki-blue` (whole site), or just on the elements you
//      want colored (links, buttons, CTA).
//
//   B. Define a CUSTOM color that isn't in Tailwind. Pick your base color, then
//      build a full 50→950 scale on https://www.colorhexa.com/ :
//        1. Enter your base hex on the site — this is your `500`.
//        2. Open the "Shades and Tints" section and read hexes off the ramp:
//             50 100 200 300 400  ← tints  (base → white, lightest first)
//             500                 ← your base color
//             600 700 800 900 950 ← shades (base → black, darkest last)
//           Pick by eye so the steps look evenly spaced (Tailwind's own scales
//           ramp non-linearly — match that feel rather than fixed 10% stops).
//      Add the scale to `customPalettes` below; it becomes a `zmoki-<name>-*`
//      utility (e.g. `zmoki-brand-600`) and shows on /-/astro/brand/color/.
//
// Example — replace with values from colorhexa, then uncomment:
//   const brand = {
//     50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd",
//     400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8",
//     800: "#1e40af", 900: "#1e3a8a", 950: "#172554",
//   };
/** @type {Record<string, Record<string | number, string>>} */
const customPalettes = {
  // "zmoki-brand": brand,
};

// Names of any custom palettes (without the `zmoki-` prefix), so the brand
// color reference page can document them alongside the Tailwind defaults.
export const customPaletteNames = Object.keys(customPalettes).map((key) =>
  key.replace(/^zmoki-/, ""),
);

// zmoki-<palette> → { 50: "#…", …, 950: "#…" } map consumed by Tailwind's
// `theme.extend.colors` and iterated by the brand color reference page.
/** @type {Record<string, Record<string | number, string>>} */
export const colors = {
  ...Object.fromEntries(paletteNames.map((name) => [`zmoki-${name}`, twColors[name]])),
  ...customPalettes,
};
