import type { AstroGlobal } from "astro";
import { site } from "@/site.config";
import { previewOrigin } from "./deploy";

// Single source of truth for every absolute URL the site emits — the canonical
// link, og:url, og:image / twitter:image, and the JSON-LD structured data. Route
// all of them through here so they can never drift apart (e.g. an OG image URL
// scheme change silently leaving the structured data pointing at a dead path).
//
// Two origins, deliberately distinct:
//   • siteOrigin  — the production origin from astro.config `site`. Used for
//     everything that must be the real public URL regardless of environment:
//     canonical, og:url, and all structured-data URLs.
//   • assetOrigin — the origin OG/social image URLs resolve against, so cards
//     preview against *this* deployment instead of always production:
//       – `astro dev`        → the local dev server (cards render on request)
//       – preview deployment → the current preview's origin, so a branch/PR
//         preview's og:image points at that deploy — not production, which may
//         not even have a new page's card yet
//       – production / other → the production siteOrigin (custom domain)
//
// On the production deploy the two origins are identical, so canonical/OG/SD all
// resolve to the same absolute URLs; they diverge under `astro dev` and on
// preview deployments.

// Preview-deployment detection (`previewOrigin`) and the platform list now live
// in ./deploy, shared with scripts/check-links.ts so both agree on what "our own
// preview" means.

// The origin to resolve OG/social image URLs against (see the assetOrigin note
// above): local dev server, then the configured host's preview deploy, else
// production.
function resolveAssetOrigin(astro: AstroGlobal, siteOrigin: URL): URL {
  if (!import.meta.env.PROD) {
    return new URL(`http://localhost:${astro.url.port}`);
  }
  const preview = previewOrigin(site.deploy.platform);
  if (preview) {
    try {
      return new URL(preview);
    } catch {
      // Malformed preview URL — fall through to production.
    }
  }
  return siteOrigin;
}

export interface PageUrls {
  /** Production origin (astro.config `site`), e.g. https://starter.zmoki.xyz. */
  readonly siteOrigin: URL;
  /** Absolute canonical URL of the current page (always production origin). */
  readonly canonical: string;
  /** Resolve any path to an absolute URL on the production origin (canonical/SD). */
  absolute(path: string): string;
  /** Resolve an OG/social asset path — dev server, preview deployment, or production. */
  assetUrl(path: string): string;
}

export function pageUrls(astro: AstroGlobal): PageUrls {
  // astro.config sets `site`, so Astro.site is always defined here.
  const siteOrigin = astro.site as URL;
  const assetOrigin = resolveAssetOrigin(astro, siteOrigin);

  return {
    siteOrigin,
    canonical: new URL(astro.url.pathname, siteOrigin).toString(),
    absolute: (path) => new URL(path, siteOrigin).toString(),
    assetUrl: (path) => new URL(path, assetOrigin).toString(),
  };
}
