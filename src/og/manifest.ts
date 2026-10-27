// One entry per OG card, shared by the endpoint and BaseLayout (og:image + alt).
// Collection pages come from page-collections, standalone pages from their
// exported `meta`, and every other page gets the `default` card.
import { site } from "@/site.config";
import { formatShortDate } from "@/lib/dates";
import { getPageRecords } from "@/lib/page-collections";
import { meta as homeMeta } from "@/pages/index.astro";
import { meta as blogIndexMeta } from "@/pages/blog/index.astro";
import { OG_FRAMES } from "./theme";
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
  alt: `${title} — ${site.name}`,
});

const siteEntry = (key: string, title: string, description: string): OgEntry => ({
  key,
  template: "site",
  title: truncate(title, TITLE_MAX),
  description: truncate(description, DESC_MAX),
  alt: `${title} — ${description}`,
});

const DEFAULT_ENTRY: OgEntry = siteEntry("default", site.name, site.description);

// Memoized: BaseLayout asks for an OG image on every page.
let entriesPromise: Promise<RoutedEntry[]> | null = null;

function buildEntries(): Promise<RoutedEntry[]> {
  return (entriesPromise ??= computeEntries());
}

async function computeEntries(): Promise<RoutedEntry[]> {
  const records = await getPageRecords();

  // Read here, not at module top level, to avoid an import cycle. Doubles as the
  // build-time check that title and description are set together.
  const standalonePages: StandalonePageMeta[] = [homeMeta, blogIndexMeta];
  for (const page of standalonePages) {
    if ((page.title === undefined) !== (page.description === undefined)) {
      throw new Error(
        `Standalone page "${page.path || "/"}" has incomplete metadata — set title and description together, or neither (src/pages/${page.ogKey === "index" ? "index" : "blog/index"}.astro).`,
      );
    }
  }

  return [
    // A standalone page with no title/description uses the default card.
    ...standalonePages.flatMap((page) =>
      page.title !== undefined && page.description !== undefined
        ? [
            {
              route: page.path === "" ? "/" : `/${page.path}`,
              entry: siteEntry(page.ogKey, page.title, page.description),
            },
          ]
        : [],
    ),
    // One article card per collection page; card key drops the trailing slash.
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

export interface OgImage {
  /** The landscape card's path, e.g. /og/blog/my-post.png. */
  path: string;
  alt: string;
  /** Every frame's card, landscape first. */
  images: { name: string; path: string; width: number; height: number }[];
}

/**
 * A page's OG cards and alt, by pathname. Falls back to the site's default card
 * for any route without its own entry.
 */
export async function getOgImage(pathname: string): Promise<OgImage> {
  const routed = await buildEntries();
  const match = routed.find((r) => r.route !== null && norm(r.route) === norm(pathname));
  const entry = match?.entry ?? DEFAULT_ENTRY;
  const images = OG_FRAMES.map((frame) => ({
    name: frame.name,
    path: `/og/${frame.dir}${entry.key}.png`,
    width: frame.width,
    height: frame.height,
  }));
  // Landscape first, by name, whatever the frame order: consumers take the first
  // og:image, and twitter:image (summary_large_image) wants landscape.
  images.sort((a, b) => Number(b.name === "landscape") - Number(a.name === "landscape"));
  return { path: images[0].path, alt: entry.alt, images };
}
