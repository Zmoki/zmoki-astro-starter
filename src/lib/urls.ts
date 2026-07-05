import type { AstroGlobal } from "astro";
import { site } from "@/site.config";
import { previewOrigin } from "./deploy";

// Single source of truth for every URL the site emits — the canonical link,
// og:url, og:image / twitter:image, the RSS alternate link, and the JSON-LD
// structured data. Route all of them through here so they can never drift apart
// (e.g. an OG image URL scheme change silently leaving the structured data
// pointing at a dead path).
//
// Two origins, deliberately distinct:
//   • siteOrigin    — the production origin from astro.config `site`. Used for
//     everything that must be the real public URL regardless of environment:
//     canonical, og:url, RSS, and all structured-data URLs.
//   • currentOrigin — the origin of *this* deployment, so assets/links resolve
//     against wherever the page is being served right now:
//       – `astro dev`        → the local dev server (Astro.url.origin)
//       – preview deployment → the current preview's origin, so a branch/PR
//         preview's og:image points at that deploy — not production, which may
//         not even have a new page's card yet
//       – production / other → the production siteOrigin (custom domain)
//
// On the production deploy the two origins are identical, so canonical/OG/SD all
// resolve to the same absolute URLs; they diverge under `astro dev` and on
// preview deployments.

// Preview-deployment detection (`previewOrigin`) and the platform list live in
// ./deploy, shared with scripts/check-links.ts so both agree on what "our own
// preview" means.

// Resolve the origin of the current deployment (see the currentOrigin note
// above): local dev server, then the configured host's preview deploy, else
// production.
function resolveCurrentOrigin(astro: AstroGlobal, siteOrigin: URL): URL {
  if (import.meta.env.DEV) {
    return new URL(astro.url.origin);
  }
  const preview = previewOrigin(site.platform.deploy);
  if (preview) {
    try {
      return new URL(preview);
    } catch {
      // Malformed preview URL — fall through to production.
    }
  }
  return siteOrigin;
}

export interface SiteUrls {
  /** Production origin (astro.config `site`), e.g. https://starter.zmoki.xyz. */
  readonly siteOrigin: URL;
  /**
   * Origin of the current deployment: the local dev server under `astro dev`,
   * the preview deploy on a preview build, else the production siteOrigin.
   */
  readonly currentOrigin: URL;
  /** Resolve a path to an absolute URL on the production origin (canonical, RSS, SD). */
  absoluteUrl(path: string): string;
  /** Resolve a path to an absolute URL on the current-deployment origin (OG images). */
  currentAbsoluteUrl(path: string): string;
}

export function siteUrls(astro: AstroGlobal): SiteUrls {
  // astro.config sets `site`, so Astro.site is always defined here.
  const siteOrigin = astro.site as URL;
  const currentOrigin = resolveCurrentOrigin(astro, siteOrigin);

  return {
    siteOrigin,
    currentOrigin,
    absoluteUrl: (path) => new URL(path, siteOrigin).toString(),
    currentAbsoluteUrl: (path) => new URL(path, currentOrigin).toString(),
  };
}
