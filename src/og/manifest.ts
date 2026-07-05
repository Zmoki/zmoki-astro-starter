// The OG image manifest: one entry per generated card. It is the single source
// of truth shared by two consumers:
//   • src/pages/og/[...path].png.ts — getStaticPaths() + rendering
//   • src/layouts/BaseLayout.astro  — the og:image URL + og:image:alt per page
//
// The collection-driven cards (posts, resource pages, legal) come from the same
// page-collections registry the sitemap uses (src/lib/page-collections.ts), so a
// new page section self-registers here too. Standalone cards (home, blog index)
// and a `default` fallback — used for any page without its own card (thank-you,
// brand, health, 404, …) — are listed explicitly.
import { site } from "@/site.config";
import { formatShortDate } from "@/lib/dates";
import { getPageRecords } from "@/lib/page-collections";
import type { OgEntry } from "./types";

/** Card text has no line-clamp, so cap lengths that would overflow the layout. */
const truncate = (s: string, n: number): string =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;

const TITLE_MAX = 90;
const DESC_MAX = 160;

/** An entry paired with the site route it belongs to (null for the fallback). */
interface RoutedEntry {
  route: string | null;
  entry: OgEntry;
}

const article = (
  key: string,
  title: string,
  description: string,
  date: Date,
  by: string,
): OgEntry => ({
  key,
  template: "article",
  title: truncate(title, TITLE_MAX),
  description: truncate(description, DESC_MAX),
  eyebrow: `${formatShortDate(date)} · ${by}`,
  alt: `${title} — ${site.ogSiteName}`,
});

const siteEntry = (key: string, title: string, description: string): OgEntry => ({
  key,
  template: "site",
  title: truncate(title, TITLE_MAX),
  description: truncate(description, DESC_MAX),
  alt: `${title} — ${description}`,
});

const DEFAULT_ENTRY: OgEntry = siteEntry("default", site.name, site.description);

// Memoized so the record load and the array build run once per process, not on
// every getOgImage() call — BaseLayout resolves an OG image for every page (and
// PostLayout again for each post), so this is hit N+ times.
let entriesPromise: Promise<RoutedEntry[]> | null = null;

function buildEntries(): Promise<RoutedEntry[]> {
  return (entriesPromise ??= computeEntries());
}

async function computeEntries(): Promise<RoutedEntry[]> {
  const records = await getPageRecords();

  return [
    { route: "/", entry: siteEntry("index", site.name, site.description) },
    { route: "/blog/", entry: siteEntry("blog", site.name, "Blog") },
    // One article card per collection-driven page. `path` is "blog/foo/"; the
    // route keeps the trailing slash, the card key drops it → /og/blog/foo.png.
    ...records.map((record) => ({
      route: `/${record.path}`,
      entry: article(
        record.path.replace(/\/$/, ""),
        record.title,
        record.description,
        record.publishDate,
        record.byline,
      ),
    })),
    { route: null, entry: DEFAULT_ENTRY },
  ];
}

/** Every card to generate — consumed by the endpoint's getStaticPaths(). */
export async function getOgEntries(): Promise<OgEntry[]> {
  return (await buildEntries()).map((r) => r.entry);
}

/** Normalize a pathname for route matching: strip trailing slash, keep root "/". */
const norm = (p: string): string => {
  const s = p.replace(/\/+$/, "");
  return s === "" ? "/" : s;
};

/**
 * The OG image URL + alt for a page, by pathname. Falls back to the site's
 * default card for any route without its own entry.
 */
export async function getOgImage(pathname: string): Promise<{ path: string; alt: string }> {
  const routed = await buildEntries();
  const match = routed.find((r) => r.route !== null && norm(r.route) === norm(pathname));
  const entry = match?.entry ?? DEFAULT_ENTRY;
  return { path: `/og/${entry.key}.png`, alt: entry.alt };
}
