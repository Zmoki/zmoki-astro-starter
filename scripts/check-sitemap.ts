import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
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
// dist/route/index.html). A site switched to `build.format: "file"` (pages at
// dist/route.html served at `/route`) isn't covered by check (1) — those routes
// lack the trailing slash the walk keys on.

const DIST_DIR = "dist";
const SITEMAP = join(DIST_DIR, "sitemap.xml");

const ROBOTS_META_RE = /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i;
const htmlIsNoindex = (html: string): boolean => {
  const m = html.match(ROBOTS_META_RE);
  return m ? isNoindex(m[1].split(",")) : false;
};

/** Recursively collect every .html file under a directory. */
function htmlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

/** Map a dist/ .html file to the directory-format route it serves. */
function routeForFile(file: string): string {
  const rel = file.slice(DIST_DIR.length).replace(/\\/g, "/");
  if (rel.endsWith("/index.html")) return rel.slice(0, -"index.html".length); // "/blog/foo/"
  return rel; // e.g. "/404.html"
}

/** Sitemap <loc> routes, as pathnames (directory format, e.g. "/blog/foo/"). */
function sitemapRoutes(): string[] {
  const xml = readFileSync(SITEMAP, "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

/** The built file a route serves, or null if none exists (must be a file, not a
 *  bare directory — a `/section/` whose own index.html was never emitted is a
 *  404 even though `dist/section/` exists because of child pages). */
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

  // Coverage: built, indexable, directory-format pages must be in the sitemap.
  const missing: string[] = [];
  let checked = 0;
  for (const file of htmlFiles(DIST_DIR)) {
    const route = routeForFile(file);
    if (!route.endsWith("/")) continue; // bare files like /404.html aren't sitemap pages
    if (isNoindexPath(route)) continue; // noindex via X-Robots-Tag path rule
    if (htmlIsNoindex(readFileSync(file, "utf8"))) continue; // noindex via <meta robots>
    checked++;
    if (!sitemap.has(route)) missing.push(route);
  }

  // Resolvability + no-noindex, over every sitemap entry.
  const stale: string[] = [];
  const noindexed: string[] = [];
  for (const route of sitemap) {
    const file = builtFileForRoute(route);
    if (!file) {
      stale.push(route);
      continue;
    }
    if (isNoindexPath(route) || htmlIsNoindex(readFileSync(file, "utf8"))) noindexed.push(route);
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
    `✓ Sitemap OK — ${sitemap.size} URL(s); all ${checked} indexable page(s) covered, none noindex, every entry resolves.`,
  );
}

main();
