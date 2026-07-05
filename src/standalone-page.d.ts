// Ambient type for the `meta` a standalone page (home, blog index) exports from
// its frontmatter. `title`/`description` are optional but must be set together;
// both feed the OG card and sitemap. See src/pages/index.astro.
interface StandalonePageMeta {
  /** URL path — trailing slash, no leading slash. "" = the home page. */
  path: string;
  /** OG card filename stem: "index" → /og/index.png. */
  ogKey: string;
  title?: string;
  description?: string;
  publishDate?: Date;
  contentModifiedDate?: Date;
}
