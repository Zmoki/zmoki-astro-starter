import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { site } from "../src/site.config.ts";
import { PREVIEW_HOST_SUFFIX, previewOrigin } from "../src/lib/deploy.ts";
import { DIST_DIR, htmlFiles, routeForFile } from "./lib/dist-files.ts";

// CI guard over the built site in dist/ (run after `npm run build`):
// 1. Every relative `<a href>` resolves to a built file or a redirect source.
// 2. No `<a href>` hard-codes our own origin (production or a preview deploy).
//    That would send a preview's visitors to production; use `/path` instead.

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
  const clean = decoded.replace(/\/+$/, "");
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

  // This build's preview origin, if it is one.
  const currentPreview = previewOrigin(site.platform.deploy);
  const previewHost = currentPreview ? safeHost(currentPreview) : null;

  // The suffix match makes a committed `*.pages.dev` link fail even on main,
  // where no preview env is set.
  const isSelfHost = (host: string): boolean =>
    host === prodHost || host === previewHost || host.endsWith(previewSuffix);

  // Target → pages linking to it.
  const broken = new Map<string, Set<string>>();
  const absolute = new Map<string, Set<string>>();
  let linkCount = 0;

  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const fromRoute = routeForFile(file);
    for (const match of html.matchAll(A_HREF_RE)) {
      const raw = match[1].trim();
      if (!raw || raw.startsWith("#")) continue; // empty or same-page fragment
      if (/^(mailto:|tel:|data:|javascript:)/i.test(raw)) continue;

      // A protocol-relative `//host/…` inherits the page's scheme here.
      let url: URL;
      try {
        url = new URL(raw, `${origin}${fromRoute}`);
      } catch {
        continue;
      }

      // Check 2: an absolute href to our own site.
      const authoredAbsolute = /^(https?:)?\/\//i.test(raw);
      if (authoredAbsolute) {
        if (isSelfHost(url.host)) {
          if (!absolute.has(raw)) absolute.set(raw, new Set());
          absolute.get(raw)!.add(fromRoute);
        }
        continue;
      }

      // Check 1: a relative link must resolve.
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
