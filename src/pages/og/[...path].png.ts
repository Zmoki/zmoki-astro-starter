// One PNG per OG manifest entry and frame (landscape at /og/<key>.png, square at
// /og/square/<key>.png): Satori renders SVG, resvg turns it into PNG.
// See the /og-images skill.
import type { APIRoute, GetStaticPaths } from "astro";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getOgEntries } from "@/og/manifest";
import { renderCard } from "@/og/card";
import { fonts } from "@/og/fonts";
import { OG_FRAMES, type OgFrame } from "@/og/theme";
import type { OgEntry } from "@/og/types";

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getOgEntries();
  const paths = entries.flatMap((entry) =>
    OG_FRAMES.map((frame) => ({
      params: { path: `${frame.dir}${entry.key}` },
      props: { entry, frame },
    })),
  );
  // A frame's folder shares the namespace with card keys (a collection named
  // "square" would), so fail on a clash instead of overwriting a card.
  const seen = new Set<string>();
  for (const { params } of paths) {
    if (seen.has(params.path)) {
      throw new Error(
        `Two OG cards render to /og/${params.path}.png. Rename the collection or the frame's dir in src/og/theme.ts.`,
      );
    }
    seen.add(params.path);
  }
  return paths;
};

export const GET: APIRoute = async ({ props }) => {
  const { entry, frame } = props as { entry: OgEntry; frame: OgFrame };

  const svg = await satori(renderCard(entry, frame) as never, {
    width: frame.width,
    height: frame.height,
    fonts,
  });

  const png = new Resvg(svg, { fitTo: { mode: "width", value: frame.width } }).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      // No caching in dev, so card template edits show on reload.
      "Cache-Control": import.meta.env.PROD ? "public, max-age=31536000, immutable" : "no-store",
    },
  });
};
