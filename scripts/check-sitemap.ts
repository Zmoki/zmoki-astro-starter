import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { DIST_DIR, htmlFiles, routeForFile } from "./lib/dist-files.ts";
import { isNoindexPath } from "../src/lib/noindex.ts";
import { isNoindex } from "../src/lib/robots.ts";

// CI guard for the sitemap. Runs after `npm run build`, offline over dist/.
// Three checks keep the sitemap in sync with what the site actually publishes:
//
// 1. Coverage — every built, indexable HTML page (a directory-format route like
//    `/blog/foo/`) appears in dist/sitemap.xml. This is what catches a new page
//    section whose collection was never added to the sitemap registry
//    (src/lib/page-collections.ts), or a standalone page missing from the
//    sitemap's explicit list: its pages build fine but silently never get
//    indexed. A page is "indexable" unless it's noindex — via its rendered
//    <meta name="robots"> (content-level `robots` frontmatter) or an
//    X-Robots-Tag path rule (isNoindexPath, from src/lib/noindex.ts).
// 2. No noindex in the sitemap — no listed <loc> may point at a page that is
//    itself noindex (by meta or path rule). Catches the inverse of (1): a page
//    marked noindex but still advertised (e.g. a standalone page whose layout
//    sets `robots`, which the sitemap endpoint can't see).
// 3. Resolvability — every <loc> resolves to a *built file*, so a stale or wrong
//    entry (a removed/renamed page, or a section index that never emitted its
//    own index.html) fails instead of 404-ing.
//
// The rule this enforces: an indexable page belongs in the sitemap, and only
// such pages do; to keep a page out, mark it noindex. Wired into CI and
// `npm run check:sitemap`.
//
// Assumes Astro's default directory build format (pages at `/route/` →
// dist/route/index.html). A site switched to `build.format: "file"` produces
// bare `dist/route.html` files with no trailing-slash route, so check (1) would
// cover nothing — guarded by the "no directory-format pages" fail-fast below.

const SITEMAP = join(DIST_DIR, "sitemap.xml");

// Match the <meta name="robots"> tag (attribute order-independent), then pull
// its content — so this doesn't silently stop matching if BaseLayout's tag shape
// changes. isNoindex() splits the content on commas.
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

/** The built file a route serves, or null if none exists — must be a file, not a
 *  bare directory (a `/section/` whose own index.html was never emitted is a 404
 *  even though `dist/section/` exists because of child pages). */
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

  // Single walk over dist/: record each built page's route and whether its
  // rendered <meta robots> is noindex, so nothing below re-reads a file.
  const metaNoindex = new Map<string, boolean>();
  const builtDirRoutes: string[] = [];
  for (const file of htmlFiles()) {
    const route = routeForFile(file);
    metaNoindex.set(route, htmlIsNoindex(readFileSync(file, "utf8")));
    if (route.endsWith("/")) builtDirRoutes.push(route); // directory-format pages
  }

  // Fail loud if the directory-format assumption doesn't hold (e.g. a site on
  // `build.format: "file"`) rather than silently checking nothing.
  if (!builtDirRoutes.length) {
    console.error(
      `✖ No directory-format pages found in ${DIST_DIR}/ — check:sitemap assumes Astro's default \`build.format: "directory"\`. Update this guard if the site uses \`file\`.`,
    );
    process.exit(1);
  }

  const isRouteNoindex = (route: string): boolean =>
    isNoindexPath(route) || (metaNoindex.get(route) ?? false);

  // (1) Coverage: built, indexable, directory-format pages must be in the sitemap.
  const indexable = builtDirRoutes.filter((route) => !isRouteNoindex(route));
  const missing = indexable.filter((route) => !sitemap.has(route));

  // (2) + (3) over every sitemap entry: it must resolve to a built file, and not
  // be noindex.
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
