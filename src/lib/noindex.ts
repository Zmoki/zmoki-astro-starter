// Relative imports (not `@/`) so plain-node check-sitemap.ts can import this.
import { headerRules } from "../headers/headers.config.ts";
import { isNoindex } from "./robots.ts";

// Paths whose header rule sets a noindex `X-Robots-Tag`, so they stay out of the sitemap too.
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

/** True if an absolute site path (e.g. "/thank-you/x/") is noindex by a header rule. */
export function isNoindexPath(path: string): boolean {
  return noindexMatchers.some((re) => re.test(path));
}
