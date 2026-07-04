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
// The starter is a bright, warm, minimal B2B look — templates use `zmoki-indigo`
// (accent), `zmoki-stone` (warm greys / text / borders), and the custom
// `zmoki-cream` scale below (the ivory page background). Two ways to give the
// site a different color (full guide in SETUP.md → "Palette"):
//
//   A. Use a built-in Tailwind palette. Nothing to edit here — every group is
//      already generated. Swap the accent in templates, e.g. find/replace
//      `zmoki-indigo` → `zmoki-emerald` (whole site), or just on the elements
//      you want recolored (links, buttons, CTA).
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

// The warm ivory background scale — the signature of the bright/minimal look.
// A custom colour (not in Tailwind's defaults): `50` is near-white, `100`
// (#FAF8F3) is the page background, and it ramps into warm browns for depth.
const cream = {
  50: "#FDFCFA",
  100: "#FAF8F3",
  200: "#F3EFE6",
  300: "#E9E2D3",
  400: "#D8CDB8",
  500: "#C2B393",
  600: "#A6946E",
  700: "#867655",
  800: "#5F5340",
  900: "#3D362A",
  950: "#221E17",
};

/** @type {Record<string, Record<string | number, string>>} */
const customPalettes = {
  "zmoki-cream": cream,
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

// Brand typefaces — the single source of truth for the font *names* and their
// CSS variables. Self-hosted via Astro's Fonts API (astro.config.mjs reads
// `name` + `variable` from here); Tailwind maps font-sans/font-mono to the
// variables; the layouts' <Font> tags and the brand specimen pages read these
// too — so a font swap changes one place and never drifts across display text.
// To switch fonts, edit `name`/`variable` here, then the family's provider /
// weights / styles / subsets in astro.config.mjs.
// The `variable` literals are pinned in the type so they satisfy the Fonts API's
// `<Font cssVariable>` prop (Astro types it as a union of the configured names).
/**
 * @type {{
 *   sans: { name: string, variable: "--font-noto-sans" },
 *   mono: { name: string, variable: "--font-noto-sans-mono" },
 * }}
 */
export const fonts = {
  sans: { name: "Noto Sans", variable: "--font-noto-sans" },
  mono: { name: "Noto Sans Mono", variable: "--font-noto-sans-mono" },
};
