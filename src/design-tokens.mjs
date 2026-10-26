// The site's colors and fonts. Every Tailwind palette is exposed under the
// `zmoki-` prefix: `bg-zmoki-neutral-900`, `text-zmoki-red-500`, and so on.
// Imported by tailwind.config.mjs and the brand pages, so no Node-only APIs here.

import twColors from "tailwindcss/colors";

// Tailwind palettes to expose, in Tailwind's docs order.
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

// ─── Re-skinning ────────────────────────────────────────────────────────────
// Templates use `zmoki-indigo` (accent), `zmoki-stone` (text, borders) and the
// custom `zmoki-cream` (background). For another Tailwind color, swap the class
// names in templates. For a color Tailwind lacks, add a 50→950 scale to
// `customPalettes` below. See the /brand skill.

// Custom warm-ivory scale; `100` is the page background.
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

// Custom palette names without the prefix, for the brand color page.
export const customPaletteNames = Object.keys(customPalettes).map((key) =>
  key.replace(/^zmoki-/, ""),
);

// zmoki-<palette> → { 50..950 }, for Tailwind's theme.extend.colors and the brand color page.
/** @type {Record<string, Record<string | number, string>>} */
export const colors = {
  ...Object.fromEntries(paletteNames.map((name) => [`zmoki-${name}`, twColors[name]])),
  ...customPalettes,
};

// Brand font names and CSS variables, read by astro.config.mjs, Tailwind and the
// layouts. To switch fonts, edit them here, then the provider and weights in
// astro.config.mjs. The `variable` literals are typed exactly to satisfy `<Font cssVariable>`.
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
