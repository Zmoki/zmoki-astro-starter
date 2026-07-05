// Relative, dependency-light imports (not the `@/` alias) so the plain-node CI
// scripts can load this module too — scripts/check-sitemap.ts imports
// isNoindexPath from here rather than re-deriving it. Mirrors src/lib/deploy.ts.
import { headerRules } from "../headers/headers.config.ts";
import { isNoindex } from "./robots.ts";

// The header source globs whose `X-Robots-Tag` keeps pages out of the index —
// derived from the same single source of truth the deploy artifact is built from
// (src/headers/headers.config.ts), so a path made noindex there is also kept out
// of the sitemap with no second edit.
const noindexPatterns = headerRules
  .filter((rule) =>
    Object.entries(rule.headers).some(
      ([name, value]) => name.toLowerCase() === "x-robots-tag" && isNoindex(value.split(",")),
    ),
  )
  .map((rule) => rule.source);

/** Convert a host `_headers` glob (e.g. "/-/astro/*") to an anchored RegExp. */
function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

const noindexMatchers = noindexPatterns.map(globToRegExp);

/**
 * True if `path` (an absolute site path with a leading slash, e.g.
 * "/thank-you/x/") is marked noindex by a headers rule — so it must be excluded
 * from the sitemap.
 */
export function isNoindexPath(path: string): boolean {
  return noindexMatchers.some((re) => re.test(path));
}
