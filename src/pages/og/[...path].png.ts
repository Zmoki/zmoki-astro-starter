// One PNG per OG manifest entry: Satori renders SVG, resvg turns it into PNG.
// See the /og-images skill.
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
      // No caching in dev, so card template edits show on reload.
      "Cache-Control": import.meta.env.PROD ? "public, max-age=31536000, immutable" : "no-store",
    },
  });
};
