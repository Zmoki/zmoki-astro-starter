export type OgTemplate = "article" | "site";

/** One generated OG image. Shared by the manifest, the endpoint, and BaseLayout. */
export interface OgEntry {
  /** Filename stem under /og/, e.g. "blog/my-post" → /og/blog/my-post.png. */
  key: string;
  /** Which card layout to render. */
  template: OgTemplate;
  /** Headline (already truncated to fit the card). */
  title: string;
  /** Sub-headline (already truncated to fit the card). */
  description: string;
  /** Small line above the title on article cards, e.g. "4 Jul 2026 · Your Name". */
  eyebrow?: string;
  /** Alt text emitted as og:image:alt / twitter:image:alt. */
  alt: string;
}
