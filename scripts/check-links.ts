import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { site } from "../src/site.config.ts";

// CI guard for internal links.
//
// Walks the built site in dist/, extracts every internal `<a href>`, and fails
// the build if any points at a path that has no corresponding built file — i.e.
// a link that would return a 404 in production. This is an *offline* check: it
// resolves each link against the emitted files in dist/, so it needs no running
// server and is fully deterministic (unlike hitting the network, which would
// also drag in flaky external hosts).
//
// What counts as "internal": root-relative (`/…`) and page-relative links, plus
// absolute URLs pointing back at our own origin (site.domain). Skipped:
// off-site http(s) links, `mailto:`/`tel:`, protocol-relative `//…`, `data:`,
// and pure `#fragment` links (no navigation).
//
// Resolution mirrors Astro's directory build format (`/blog/foo/` →
// dist/blog/foo/index.html). A path is considered live if any candidate file
// exists, or if it matches a redirect source in dist/_redirects (301 → 200).
//
// Run after `npm run build` (needs dist/). Wired into CI and `npm run check:links`.

const DIST_DIR = "dist";
const A_HREF_RE = /<a\s[^>]*?href=["']([^"']*)["'][^>]*>/gi;

/** Recursively collect every .html file under a directory. */
function htmlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...htmlFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(path);
    }
  }
  return files;
}

/** Map a dist/ .html file path to the route it serves (directory format). */
function routeForFile(file: string): string {
  const rel = file.slice(DIST_DIR.length).replace(/\\/g, "/"); // strip "dist", normalize
  if (rel.endsWith("/index.html")) return rel.slice(0, -"index.html".length); // "/blog/index.html" → "/blog/"
  return rel; // e.g. "/404.html"
}

/** Redirect *source* paths from dist/_redirects — linking to one is a 301, not a 404. */
function redirectSources(): Set<string> {
  const sources = new Set<string>();
  const path = join(DIST_DIR, "_redirects");
  if (!existsSync(path)) return sources;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const from = trimmed.split(/\s+/)[0];
    if (from) sources.add(from.replace(/\/$/, "") || "/");
  }
  return sources;
}

/** True if a route resolves to a built file under dist/ (directory-format aware). */
function resolves(pathname: string): boolean {
  const decoded = decodeURIComponent(pathname);
  const clean = decoded.replace(/\/+$/, ""); // drop trailing slashes for candidate building
  const candidates = [
    join(DIST_DIR, decoded), // exact file, e.g. /rss.xml, /404.html
    join(DIST_DIR, decoded, "index.html"), // /blog/foo/ → dist/blog/foo/index.html
    join(DIST_DIR, clean, "index.html"), // /blog/foo (no slash) → same
    join(DIST_DIR, `${clean}.html`), // /404 → dist/404.html
  ];
  return candidates.some((c) => existsSync(c));
}

function main(): void {
  let files: string[];
  try {
    files = htmlFiles(DIST_DIR);
  } catch {
    console.error(`✖ ${DIST_DIR}/ not found — run \`npm run build\` first.`);
    process.exit(1);
  }

  const origin = new URL(site.domain).origin;
  const redirects = redirectSources();

  // Map of broken target → set of pages that link to it.
  const broken = new Map<string, Set<string>>();
  let linkCount = 0;

  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const fromRoute = routeForFile(file);
    for (const match of html.matchAll(A_HREF_RE)) {
      const raw = match[1].trim();
      if (!raw || raw.startsWith("#")) continue; // empty or same-page fragment
      if (/^(mailto:|tel:|data:|javascript:)/i.test(raw)) continue;
      if (raw.startsWith("//")) continue; // protocol-relative → treat as external

      // Resolve against the current page's URL; drops any ?query and #fragment.
      let url: URL;
      try {
        url = new URL(raw, `${origin}${fromRoute}`);
      } catch {
        continue; // unparseable href — not our concern here
      }
      if (url.origin !== origin) continue; // off-site link

      linkCount++;
      const pathname = url.pathname;
      const normalized = pathname.replace(/\/$/, "") || "/";
      if (redirects.has(normalized)) continue; // 301 source, not a 404
      if (resolves(pathname)) continue;

      if (!broken.has(pathname)) broken.set(pathname, new Set());
      broken.get(pathname)!.add(fromRoute);
    }
  }

  if (broken.size > 0) {
    console.error(`✖ Internal link check failed — ${broken.size} broken target(s):\n`);
    for (const [target, pages] of [...broken].sort()) {
      console.error(`  • ${target}`);
      for (const page of [...pages].sort()) console.error(`      ← ${page}`);
    }
    process.exit(1);
  }

  console.log(
    `✓ Internal links OK — ${linkCount} internal link(s) across ${files.length} page(s) all resolve.`,
  );
}

main();
