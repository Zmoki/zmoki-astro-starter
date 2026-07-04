import type { AstroGlobal } from "astro";

// Single source of truth for every absolute URL the site emits — the canonical
// link, og:url, og:image / twitter:image, and the JSON-LD structured data. Route
// all of them through here so they can never drift apart (e.g. an OG image URL
// scheme change silently leaving the structured data pointing at a dead path).
//
// Two origins, deliberately distinct:
//   • siteOrigin  — the production origin from astro.config `site`. Used for
//     everything that must be the real public URL regardless of environment:
//     canonical, og:url, and all structured-data URLs.
//   • assetOrigin — the same in a production build, but the local dev server
//     during `astro dev`, so og:image tags resolve to the locally-served card
//     while developing. Used only for the OG/social image URLs.
//
// In a production build the two origins are identical, so canonical/OG/SD all
// resolve to the same absolute URLs; they diverge only under `astro dev`.

export interface PageUrls {
  /** Production origin (astro.config `site`), e.g. https://starter.zmoki.xyz. */
  readonly siteOrigin: URL;
  /** Absolute canonical URL of the current page (always production origin). */
  readonly canonical: string;
  /** Resolve any path to an absolute URL on the production origin (canonical/SD). */
  absolute(path: string): string;
  /** Resolve an OG/social asset path — dev server under `astro dev`, else production. */
  assetUrl(path: string): string;
}

export function pageUrls(astro: AstroGlobal): PageUrls {
  // astro.config sets `site`, so Astro.site is always defined here.
  const siteOrigin = astro.site as URL;
  const assetOrigin = import.meta.env.PROD
    ? siteOrigin
    : new URL(`http://localhost:${astro.url.port}`);

  return {
    siteOrigin,
    canonical: new URL(astro.url.pathname, siteOrigin).toString(),
    absolute: (path) => new URL(path, siteOrigin).toString(),
    assetUrl: (path) => new URL(path, assetOrigin).toString(),
  };
}
