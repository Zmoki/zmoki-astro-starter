/**
 * Robots directive helpers. A page's `robots` is a list of directives per
 * Google's spec — joined into <meta name="robots" content="…">:
 *   https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
 *   https://developers.google.com/search/docs/crawling-indexing/special-tags
 */

/** The site-wide baseline robots directive, always emitted. */
export const DEFAULT_ROBOTS = "max-image-preview:large";

const NOINDEX_TOKENS = new Set(["noindex", "none"]);

/**
 * True if any directive keeps the page out of the search index — `noindex`, or
 * its superset `none` (= `noindex, nofollow`). Case-insensitive and tolerant of
 * spacing. Used to drop such pages from the sitemap, shared by both the
 * content-level `robots` frontmatter (an array) and the path-level X-Robots-Tag
 * header rules (a comma-separated string, split by the caller).
 */
export function isNoindex(directives?: string[]): boolean {
  // Split each element on commas too, so a single comma-joined entry
  // (`["noindex, nofollow"]`) is read the same as `["noindex", "nofollow"]` —
  // both render the same <meta robots>, so both must filter the same way.
  return (directives ?? [])
    .flatMap((d) => d.split(","))
    .some((token) => NOINDEX_TOKENS.has(token.trim().toLowerCase()));
}

/**
 * The full robots meta content for a page: any per-page `robots` directives from
 * frontmatter followed by the site baseline, e.g. "noindex, max-image-preview:large".
 */
export function robotsContent(directives?: string[]): string {
  return [...(directives ?? []), DEFAULT_ROBOTS].join(", ");
}
