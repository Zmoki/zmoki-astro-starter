// OG card colors, read from src/design-tokens.mjs so a re-skin recolors the cards too.
import { formatHex } from "culori";
import { colors } from "@/design-tokens.mjs";

type Scale = Record<string | number, string>;
const cream = colors["zmoki-cream"] as Scale;
const stone = colors["zmoki-stone"] as Scale;
const indigo = colors["zmoki-indigo"] as Scale;

// resvg doesn't render oklch() (Tailwind v4's default palettes) reliably, so
// convert every token to hex. Hex values pass through unchanged.
const hex = (c: string): string => formatHex(c) ?? c;

export const theme = {
  bg: hex(cream[100]), // warm ivory page background
  ink: hex(stone[900]), // headings / primary text
  muted: hex(stone[500]), // secondary / meta text
  accent: hex(indigo[600]), // links / brand mark (WCAG-AA on white & cream)
} as const;

// OG images are served at the recommended 1.91:1 ratio.
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
