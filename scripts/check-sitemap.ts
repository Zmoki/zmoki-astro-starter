import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { DIST_DIR, htmlFiles, routeForFile } from "./lib/dist-files.ts";
import { isNoindexPath } from "../src/lib/noindex.ts";
import { isNoindex } from "../src/lib/robots.ts";

// CI guard: after `npm run build`, checks dist/ so the sitemap matches what the
// site publishes. (1) coverage — every built indexable page is in sitemap.xml
// (catches an unregistered section, or a standalone page not wired in);
// (2) no <loc> points at a noindex page; (3) every <loc> resolves to a built
// file. A page is noindex via its <meta robots> or an X-Robots-Tag rule.
// Assumes Astro's default directory build format (guarded by a fail-fast below);
// standalone-page metadata completeness is checked at build time in
// src/og/manifest.ts (a node script can't import an .astro page).

const SITEMAP = join(DIST_DIR, "sitemap.xml");

// Match the <meta robots> tag order-independently, then pull its content, so
// this doesn't break if BaseLayout's tag shape changes.
const ROBOTS_META_RE = /<meta\b[^>]*\bname=["']robots["'][^>]*>/i;
const CONTENT_ATTR_RE = /\bcontent=["']([^"']*)["']/i;
const htmlIsNoindex = (html: string): boolean => {
  const tag = html.match(ROBOTS_META_RE)?.[0];
  const content = tag?.match(CONTENT_ATTR_RE)?.[1];
  return content ? isNoindex([content]) : false;
};

/** Sitemap <loc> routes, as pathnames (directory format, e.g. "/blog/foo/"). */
function sitemapRoutes(): string[] {
  const xml = readFileSync(SITEMAP, "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

/** The built *file* a route serves, or null — a `/section/` whose own index.html
 *  was never emitted is a 404 even though `dist/section/` exists (child pages). */
function builtFileForRoute(route: string): string | null {
  const candidates = route.endsWith("/")
    ? [join(DIST_DIR, route, "index.html")]
    : [join(DIST_DIR, route), join(DIST_DIR, `${route}.html`), join(DIST_DIR, route, "index.html")];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

function main(): void {
  if (!existsSync(SITEMAP)) {
    console.error(`✖ ${SITEMAP} not found — run \`npm run build\` first.`);
    process.exit(1);
  }

  const sitemap = new Set(sitemapRoutes());

  // One walk over dist/: each built page's route → its <meta robots> noindex,
  // so nothing below re-reads a file.
  const metaNoindex = new Map<string, boolean>();
  const builtDirRoutes: string[] = [];
  for (const file of htmlFiles()) {
    const route = routeForFile(file);
    metaNoindex.set(route, htmlIsNoindex(readFileSync(file, "utf8")));
    if (route.endsWith("/")) builtDirRoutes.push(route);
  }

  // Fail loud rather than check nothing if the directory-format assumption breaks.
  if (!builtDirRoutes.length) {
    console.error(
      `✖ No directory-format pages found in ${DIST_DIR}/ — check:sitemap assumes Astro's default \`build.format: "directory"\`. Update this guard if the site uses \`file\`.`,
    );
    process.exit(1);
  }

  const isRouteNoindex = (route: string): boolean =>
    isNoindexPath(route) || (metaNoindex.get(route) ?? false);

  const indexable = builtDirRoutes.filter((route) => !isRouteNoindex(route));
  const missing = indexable.filter((route) => !sitemap.has(route));

  const stale: string[] = [];
  const noindexed: string[] = [];
  for (const route of sitemap) {
    if (!builtFileForRoute(route)) stale.push(route);
    else if (isRouteNoindex(route)) noindexed.push(route);
  }

  let failed = false;
  if (missing.length) {
    failed = true;
    console.error(
      `✖ ${missing.length} indexable page(s) missing from sitemap.xml — register the collection in src/lib/page-collections.ts (or add a standalone page to src/pages/sitemap.xml.ts), or mark the page noindex:\n`,
    );
    for (const route of missing.sort()) console.error(`  • ${route}`);
    console.error("");
  }
  if (noindexed.length) {
    failed = true;
    console.error(
      `✖ ${noindexed.length} sitemap <loc>(s) point at a noindex page — remove them from the sitemap, or drop the noindex:\n`,
    );
    for (const route of noindexed.sort()) console.error(`  • ${route}`);
    console.error("");
  }
  if (stale.length) {
    failed = true;
    console.error(`✖ ${stale.length} sitemap <loc>(s) resolve to no built file:\n`);
    for (const route of stale.sort()) console.error(`  • ${route}`);
    console.error("");
  }
  if (failed) process.exit(1);

  console.log(
    `✓ Sitemap OK — ${sitemap.size} URL(s); all ${indexable.length} indexable page(s) covered, none noindex, every entry resolves.`,
  );
}

main();
