// The OG image manifest: one entry per generated card. It is the single source
// of truth shared by two consumers:
//   • src/pages/og/[...path].png.ts — getStaticPaths() + rendering
//   • src/layouts/BaseLayout.astro  — the og:image URL + og:image:alt per page
//
// Enumerates the same routes as the sitemap (home, blog index, posts, resource
// pages, legal) plus a `default` fallback used for any page without its own card
// (thank-you, brand, health, 404, …).
import { getCollection, type CollectionEntry } from "astro:content";
import { site } from "@/site.config";
import { formatShortDate } from "@/lib/dates";
import type { OgEntry } from "./types";

/** Card text has no line-clamp, so cap lengths that would overflow the layout. */
const truncate = (s: string, n: number): string =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;

const TITLE_MAX = 90;
const DESC_MAX = 140;

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

// Memoized so the three getCollection() calls and the array build run once per
// process, not on every getOgImage() call — BaseLayout resolves an OG image for
// every page (and PostLayout again for each post), so this is hit N+ times.
let entriesPromise: Promise<RoutedEntry[]> | null = null;

function buildEntries(): Promise<RoutedEntry[]> {
  return (entriesPromise ??= computeEntries());
}

async function computeEntries(): Promise<RoutedEntry[]> {
  const posts: CollectionEntry<"blog">[] = await getCollection("blog");
  const resources: CollectionEntry<"resources">[] = await getCollection(
    "resources",
    ({ data }) => data.type === "page",
  );
  const legal: CollectionEntry<"legal">[] = await getCollection("legal");

  return [
    { route: "/", entry: siteEntry("index", site.name, site.description) },
    { route: "/blog/", entry: siteEntry("blog", site.name, "Blog") },
    ...posts.map((p) => ({
      route: `/blog/${p.id}/`,
      entry: article(
        `blog/${p.id}`,
        p.data.title,
        p.data.description,
        p.data.publishDate,
        site.author.name,
      ),
    })),
    ...resources.map((r) => ({
      route: `/resources/${r.id}/`,
      entry: article(
        `resources/${r.id}`,
        r.data.title,
        r.data.description,
        r.data.publishDate,
        site.name,
      ),
    })),
    ...legal.map((l) => ({
      route: `/legal/${l.id}/`,
      entry: article(
        `legal/${l.id}`,
        l.data.title,
        l.data.description,
        l.data.publishDate,
        site.name,
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
