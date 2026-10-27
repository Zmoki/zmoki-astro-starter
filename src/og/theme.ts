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

/**
 * Every card is rendered in each frame. Landscape (1.91:1) comes first: it's the
 * og:image most consumers take. Some (e.g. LinkedIn on mobile, WhatsApp) prefer the
 * square one, listed second. `dir` is the frame's folder under /og/. `scale` sizes
 * the type, mark and padding: a square card is usually shown smaller, so it's larger.
 */
export const OG_FRAMES = [
  { name: "landscape", width: 1200, height: 630, dir: "", scale: 1 },
  { name: "square", width: 1200, height: 1200, dir: "square/", scale: 1.35 },
] as const;

export type OgFrame = (typeof OG_FRAMES)[number];
