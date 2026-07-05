// Satori card templates. Satori takes a small React-like vdom of
// { type, props: { style, children } } nodes — we build that directly with `el`
// (no JSX config needed). Every container with multiple children sets an explicit
// `display: flex`, as Satori requires. Colors come from ./theme (the design tokens),
// so cards re-skin with the site.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { site } from "@/site.config";
import { theme, OG_WIDTH, OG_HEIGHT } from "./theme";
import type { OgEntry } from "./types";

type Node = { type: string; props: Record<string, unknown> };

const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style, ...(children === undefined ? {} : { children }) },
});

const domain = site.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

// The brand mark is the site's own public/brand-mark.svg (the same source the
// favicons render from), so the social cards always match the icon. Rasterize it
// once to a PNG data URI here — Satori embeds it as an <img>. (cwd is the project
// root in both `astro dev` and `astro build`, matching src/og/fonts.ts.)
const brandMarkSvg = readFileSync(join(process.cwd(), "public/brand-mark.svg"));
const brandMarkPng = new Resvg(brandMarkSvg, { fitTo: { mode: "width", value: 200 } })
  .render()
  .asPng();
const brandMarkUri = `data:image/png;base64,${Buffer.from(brandMarkPng).toString("base64")}`;

/** The brand mark, rendered from public/brand-mark.svg with softly rounded corners. */
const brandMark = (size = 56): Node => ({
  type: "img",
  props: {
    src: brandMarkUri,
    width: size,
    height: size,
    style: { borderRadius: Math.round(size * 0.26) },
  },
});

const root = (children: Node[]): Node =>
  el(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      width: OG_WIDTH,
      height: OG_HEIGHT,
      padding: 80,
      backgroundColor: theme.bg,
      color: theme.ink,
      fontFamily: "Noto Sans",
    },
    children,
  );

function articleCard(entry: OgEntry): Node {
  const header = el(
    "div",
    { display: "flex", fontSize: 26, color: theme.muted, fontWeight: 700 },
    entry.eyebrow ?? "",
  );
  const body = el("div", { display: "flex", flexDirection: "column" }, [
    el(
      "div",
      { display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.15, color: theme.ink },
      entry.title,
    ),
    el(
      "div",
      { display: "flex", marginTop: 28, fontSize: 30, lineHeight: 1.4, color: theme.muted },
      entry.description,
    ),
  ]);
  const footer = el(
    "div",
    { display: "flex", alignItems: "center", justifyContent: "space-between" },
    [
      el("div", { display: "flex", alignItems: "center" }, [
        brandMark(52),
        el(
          "div",
          { display: "flex", marginLeft: 20, fontSize: 28, fontWeight: 700, color: theme.ink },
          site.name,
        ),
      ]),
      el("div", { display: "flex", fontSize: 24, color: theme.muted }, domain),
    ],
  );
  return root([header, body, footer]);
}

function siteCard(entry: OgEntry): Node {
  const header = el("div", { display: "flex" }, [brandMark(72)]);
  const body = el("div", { display: "flex", flexDirection: "column" }, [
    el(
      "div",
      { display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.1, color: theme.ink },
      entry.title,
    ),
    el(
      "div",
      { display: "flex", marginTop: 28, fontSize: 34, lineHeight: 1.4, color: theme.muted },
      entry.description,
    ),
  ]);
  const footer = el("div", { display: "flex", fontSize: 24, color: theme.muted }, domain);
  return root([header, body, footer]);
}

export function renderCard(entry: OgEntry): Node {
  return entry.template === "site" ? siteCard(entry) : articleCard(entry);
}
