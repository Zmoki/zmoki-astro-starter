// Card colors for the OG image templates, pulled from the same design tokens as
// the rest of the site (src/design-tokens.mjs). Because these read straight from
// the tokens, a palette change / re-skin (the `brand-colors` skill) recolors the
// generated OG cards too — no separate place to keep in sync.
import { formatHex } from "culori";
import { colors } from "@/design-tokens.mjs";

type Scale = Record<string | number, string>;
const cream = colors["zmoki-cream"] as Scale;
const stone = colors["zmoki-stone"] as Scale;
const indigo = colors["zmoki-indigo"] as Scale;

// Tailwind v4's default palettes are oklch() strings, which the SVG rasterizer
// (resvg) does not render reliably. Convert every token to hex up front so the
// cards are format-agnostic — works whether a re-skin lands on an oklch built-in
// palette or a hex custom one. formatHex passes existing hex through unchanged.
const hex = (c: string): string => formatHex(c) ?? c;

export const theme = {
  bg: hex(cream[100]), // warm ivory page background
  card: "#ffffff", // white panel
  ink: hex(stone[900]), // headings / primary text
  muted: hex(stone[500]), // secondary / meta text
  border: hex(stone[200]), // soft panel border
  accent: hex(indigo[600]), // links / brand mark (WCAG-AA on white & cream)
  accentSoft: hex(indigo[50]), // soft accent fill
} as const;

// OG images are served at the recommended 1.91:1 ratio.
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
