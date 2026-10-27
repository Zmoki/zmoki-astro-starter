// The `meta` a standalone page (home, blog index) exports. Set `title` and
// `description` together or not at all.
interface StandalonePageMeta {
  /** URL path — trailing slash, no leading slash. "" = the home page. */
  path: string;
  /** OG card filename stem: "index" → /og/index.png. */
  ogKey: string;
  title?: string;
  description?: string;
  publishDate?: Date;
  contentModifiedDate?: Date;
  /** Path prefix of the collection pages it lists, e.g. "blog/": its sitemap <lastmod> follows their newest change. */
  lists?: string;
}
