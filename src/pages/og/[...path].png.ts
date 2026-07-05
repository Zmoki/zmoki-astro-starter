// Static OG image endpoint. astro build calls getStaticPaths() to enumerate every
// card from the manifest and GET() to render each one — Satori (vdom → SVG) then
// resvg (SVG → PNG). Output lands in dist/og/**/*.png at build time; nothing is
// committed to git. In `astro dev` the same route renders on request.
import type { APIRoute, GetStaticPaths } from "astro";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getOgEntries } from "@/og/manifest";
import { renderCard } from "@/og/card";
import { fonts } from "@/og/fonts";
import { OG_WIDTH, OG_HEIGHT } from "@/og/theme";
import type { OgEntry } from "@/og/types";

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getOgEntries();
  return entries.map((entry) => ({ params: { path: entry.key }, props: { entry } }));
};

export const GET: APIRoute = async ({ props }) => {
  const entry = props.entry as OgEntry;

  const svg = await satori(renderCard(entry) as never, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });

  const png = new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } }).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      // Long-lived immutable in prod (cards are build output); no caching under
      // `astro dev` so edits to the card templates show on reload instead of
      // serving a stale PNG from the browser cache.
      "Cache-Control": import.meta.env.PROD ? "public, max-age=31536000, immutable" : "no-store",
    },
  });
};
