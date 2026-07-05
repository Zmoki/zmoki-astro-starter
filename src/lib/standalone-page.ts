/**
 * Shape of the `meta` a standalone (non-collection) page exports from its own
 * frontmatter — the home page and the blog index. The page is the single source:
 * its `BaseLayout` props, its OG card (src/og/manifest.ts), and the sitemap
 * (src/pages/sitemap.xml.ts) all read this exported object, so they can't drift.
 *
 * `title`/`description` are optional but must be set together — the OG manifest
 * throws at build if only one is present ("incomplete page metadata"). When both
 * are omitted the page falls back to the site defaults + the default OG card.
 * The dates feed the sitemap <lastmod>.
 */
export interface StandalonePageMeta {
  /** URL path — trailing slash, no leading slash. "" = the home page. */
  path: string;
  /** OG card filename stem: "index" → /og/index.png. */
  ogKey: string;
  title?: string;
  description?: string;
  publishDate?: Date;
  contentModifiedDate?: Date;
}
