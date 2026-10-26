// Satori draws text itself, so it needs the font files. These are committed
// copies of `@fontsource/noto-sans` files/noto-sans-latin-{400,700}-normal.woff,
// separate from the site's web fonts: if you swap the brand font, update them too.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Font } from "satori";

// Resolve from cwd (the project root), not import.meta.url, which Vite rewrites.
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
