import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { site } from "../src/site.config.ts";
import { PREVIEW_HOST_SUFFIX, previewOrigin } from "../src/lib/deploy.ts";
import { DIST_DIR, htmlFiles, routeForFile } from "./lib/dist-files.ts";

// CI guard for internal links. Two checks over the built site in dist/:
//
// 1. No broken internal links. Every internal `<a href>` must point at a path
//    that has a corresponding built file — otherwise it would 404 in production.
//
// 2. Internal links must be relative. An `<a href>` written as an *absolute* URL
//    back to our own site — the production origin (site.domain) or a preview
//    deployment for the configured host (e.g. a Cloudflare Pages
//    `*.pages.dev` branch preview) — is a bug: it pins the link to one
//    environment, so on a preview deploy it jumps users to production (or a
//    stale ephemeral preview) instead of staying on the current deploy. Use a
//    root-relative path (`/blog/…`) instead.
//
// Both are *offline* checks: they read the emitted files in dist/, so they need
// no running server and are fully deterministic (unlike hitting the network,
// which would also drag in flaky external hosts).
//
// What counts as "internal" for check 1: root-relative (`/…`) and page-relative
// links. Skipped: off-site http(s) links, `mailto:`/`tel:`, `data:`, and pure
// `#fragment` links (no navigation).
//
// Resolution mirrors Astro's directory build format (`/blog/foo/` →
// dist/blog/foo/index.html). A path is considered live if any candidate file
// exists, or if it matches a redirect source in dist/_redirects (301 → 200).
//
// Run after `npm run build` (needs dist/). Wired into CI and `npm run check:links`.

const A_HREF_RE = /<a\s[^>]*?href=["']([^"']*)["'][^>]*>/gi;

/** Host of a URL string, or null if it doesn't parse. */
function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
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
  const prodHost = new URL(site.domain).host;
  const previewSuffix = PREVIEW_HOST_SUFFIX[site.platform.deploy];
  const redirects = redirectSources();

  // The exact origin of *this* build's preview deploy, if we're running inside
  // one — resolved by the same env-var logic that points OG images at the
  // current preview (src/lib/deploy.ts, shared with src/lib/urls.ts).
  const currentPreview = previewOrigin(site.platform.deploy);
  const previewHost = currentPreview ? safeHost(currentPreview) : null;

  // A host is "ours" if it's production, this build's preview, or any host that
  // matches the platform's preview-URL suffix (so a committed `*.pages.dev` link
  // still fails in CI on main, where no preview env is set).
  const isSelfHost = (host: string): boolean =>
    host === prodHost || host === previewHost || host.endsWith(previewSuffix);

  // Map of broken (404) target → set of pages that link to it.
  const broken = new Map<string, Set<string>>();
  // Map of absolute self-link (should be relative) → set of pages using it.
  const absolute = new Map<string, Set<string>>();
  let linkCount = 0;

  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const fromRoute = routeForFile(file);
    for (const match of html.matchAll(A_HREF_RE)) {
      const raw = match[1].trim();
      if (!raw || raw.startsWith("#")) continue; // empty or same-page fragment
      if (/^(mailto:|tel:|data:|javascript:)/i.test(raw)) continue;

      // Resolve against the current page's URL; drops any ?query and #fragment.
      // (A protocol-relative `//host/…` inherits the page's scheme here.)
      let url: URL;
      try {
        url = new URL(raw, `${origin}${fromRoute}`);
      } catch {
        continue; // unparseable href — not our concern here
      }

      // Check 2: an href *authored* as an absolute (or protocol-relative) URL.
      // If it targets our own site, it should have been a relative path.
      const authoredAbsolute = /^(https?:)?\/\//i.test(raw);
      if (authoredAbsolute) {
        if (isSelfHost(url.host)) {
          if (!absolute.has(raw)) absolute.set(raw, new Set());
          absolute.get(raw)!.add(fromRoute);
        }
        continue; // absolute self-link flagged above; anything else is off-site
      }

      // Check 1: relative internal link → must resolve to a built file.
      linkCount++;
      const pathname = url.pathname;
      const normalized = pathname.replace(/\/$/, "") || "/";
      if (redirects.has(normalized)) continue; // 301 source, not a 404
      if (resolves(pathname)) continue;

      if (!broken.has(pathname)) broken.set(pathname, new Set());
      broken.get(pathname)!.add(fromRoute);
    }
  }

  let failed = false;

  if (broken.size > 0) {
    failed = true;
    console.error(`✖ Broken internal link(s) — ${broken.size} target(s) would 404:\n`);
    for (const [target, pages] of [...broken].sort()) {
      console.error(`  • ${target}`);
      for (const page of [...pages].sort()) console.error(`      ← ${page}`);
    }
    console.error("");
  }

  if (absolute.size > 0) {
    failed = true;
    console.error(
      `✖ Absolute self-link(s) — ${absolute.size} link(s) must be relative (use /path, not a full URL):\n`,
    );
    for (const [target, pages] of [...absolute].sort()) {
      console.error(`  • ${target}`);
      for (const page of [...pages].sort()) console.error(`      ← ${page}`);
    }
    console.error("");
  }

  if (failed) process.exit(1);

  console.log(
    `✓ Internal links OK — ${linkCount} relative internal link(s) across ${files.length} page(s) resolve, and none hard-code our own origin.`,
  );
}

main();
