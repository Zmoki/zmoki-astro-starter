import { site } from "@/site.config";
import { theme } from "@/og/theme";

// Web app manifest, served at /site.webmanifest. Generated from the same single
// sources of truth as the rest of the site — the name from src/site.config.ts and
// the colors from the brand tokens (via src/og/theme.ts) — so a rebrand or re-skin
// keeps it in sync with no manual edits. The PNG icons it points at are produced by
// `npm run favicons` (scripts/generate-favicons.ts) and live in public/.
export function GET() {
  const manifest = {
    name: site.ogSiteName,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: theme.accent,
    background_color: theme.bg,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
