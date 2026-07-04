// Font data for Satori. Satori rasterizes text to SVG paths itself, so it needs
// the actual font files (not the Google Fonts CSS the site loads at runtime).
//
// We bundle the Noto Sans Latin subset (Regular + Bold) as .woff under ./fonts —
// ~17KB each, committed so generation works offline and in CI with no network or
// node_modules path resolution. They came from `@fontsource/noto-sans` (kept as a
// devDependency); to refresh them, re-copy files/noto-sans-latin-{400,700}-normal.woff.
//
// NOTE: this is the OG card font, separate from the site's Google Fonts. If you
// swap the brand font (the `/brand` skill), update these too so the
// social cards match.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Font } from "satori";

// Resolve from the project root (cwd is the project root in both `astro dev` and
// `astro build`) rather than import.meta.url, which Vite rewrites when bundling.
const load = (file: string): Buffer => readFileSync(join(process.cwd(), "src/og/fonts", file));

export const fonts: Font[] = [
  {
    name: "Noto Sans",
    data: load("noto-sans-latin-400-normal.woff"),
    weight: 400,
    style: "normal",
  },
  {
    name: "Noto Sans",
    data: load("noto-sans-latin-700-normal.woff"),
    weight: 700,
    style: "normal",
  },
];
