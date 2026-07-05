// Relative site.config import (not the `@/` alias) so the plain-node CI guard
// scripts/check-sitemap.ts can load this too. Mirrors src/lib/deploy.ts.
import { site } from "../site.config.ts";

/**
 * Metadata for the standalone (non-collection) pages — the home page and the
 * blog index. The single source read by the page itself (<title> + description),
 * its OG card, and the sitemap (<lastmod>), so those can't drift.
 *
 * `title`/`description` are optional but must be set **together** — CI's
 * `npm run check:sitemap` fails on one-without-the-other ("incomplete page
 * metadata"). When both are omitted the page falls back to the site defaults
 * (`site.name` / `site.description`) and the shared default OG card. The dates
 * feed the sitemap <lastmod>; bump `contentModifiedDate` when the page changes.
 */
export interface StandalonePage {
  /** URL path — trailing slash, no leading slash. "" = the home page. */
  path: string;
  /** OG card filename stem: "index" → /og/index.png. */
  ogKey: string;
  title?: string;
  description?: string;
  publishDate?: Date;
  contentModifiedDate?: Date;
}

export const homePage: StandalonePage = {
  path: "",
  ogKey: "index",
  title: `${site.name} — a website your AI can make its own`,
  description: site.description,
  publishDate: new Date("2026-07-04"),
  contentModifiedDate: new Date("2026-07-04"),
};

export const blogIndexPage: StandalonePage = {
  path: "blog/",
  ogKey: "blog",
  title: `Blog — ${site.name}`,
  description: site.feedDescription,
};

/** Every standalone page — consumed by the sitemap + OG manifest + CI guard. */
export const standalonePages: StandalonePage[] = [homePage, blogIndexPage];
