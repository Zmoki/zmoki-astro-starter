import type { AstroGlobal } from "astro";
import { site } from "@/site.config";
import { previewOrigin } from "./deploy";

// Every absolute URL the site emits (canonical, og:url, og:image, RSS, JSON-LD)
// goes through here so they can't drift apart. There are two origins:
// - siteOrigin: the production URL. Canonical, og:url, RSS and JSON-LD always use it.
// - currentOrigin: this deployment. OG images use it, so a preview's og:image
//   points at a card that exists on that preview, not yet on production.
// They differ only under `astro dev` and on preview deploys.

function resolveCurrentOrigin(astro: AstroGlobal, siteOrigin: URL): URL {
  if (import.meta.env.DEV) {
    return new URL(astro.url.origin);
  }
  const preview = previewOrigin(site.platform.deploy);
  if (preview) {
    try {
      return new URL(preview);
    } catch {
      // Malformed preview URL: fall back to production.
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
