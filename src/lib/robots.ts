// Robots directive helpers. A page's `robots` is a list of directives per
// Google's spec: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag

/** Site-wide baseline robots directive, always emitted. */
export const DEFAULT_ROBOTS = "max-image-preview:large";

const NOINDEX_TOKENS = new Set(["noindex", "none"]);

/** True if any directive keeps the page out of the index (`noindex`/`none`).
 *  Splits on commas so `["noindex, nofollow"]` reads like `["noindex", ...]`. */
export function isNoindex(directives?: string[]): boolean {
  return (directives ?? [])
    .flatMap((d) => d.split(","))
    .some((token) => NOINDEX_TOKENS.has(token.trim().toLowerCase()));
}

/** Per-page `robots` directives + the site baseline, for <meta name="robots">. */
export function robotsContent(directives?: string[]): string {
  return [...(directives ?? []), DEFAULT_ROBOTS].join(", ");
}
