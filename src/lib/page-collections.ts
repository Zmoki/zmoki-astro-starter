import { getCollection, type CollectionEntry } from "astro:content";
import { site } from "@/site.config";

/** Content collections that render one page per entry. */
type PageCollectionName = "blog" | "resources" | "legal";

/**
 * A resource is a real page (`type: "page"`) rather than a bare external link
 * (`type: "link"`). Only pages get a `/resources/{slug}/` route — and a sitemap
 * entry. Shared by the resources route and the registry so the rule lives once.
 */
export const isResourcePage = (entry: CollectionEntry<"resources">): boolean =>
  entry.data.type === "page";

/**
 * A normalized page record — the common fields every page collection exposes,
 * projected once so consumers (the sitemap and the OG image manifest) don't each
 * reach into the per-collection schema. See getPageRecords().
 */
export interface PageRecord {
  /** URL path, trailing slash, no leading slash: "blog/1-set-up-your-site/". */
  path: string;
  title: string;
  description: string;
  publishDate: Date;
  contentModifiedDate: Date;
  /** Byline author for the OG card — the post author, else the site owner. */
  byline: string;
  /** robots directives from frontmatter (drives sitemap noindex filtering). */
  robots?: string[];
}

function definePageCollection<K extends PageCollectionName>(config: {
  /** The content collection name. */
  collection: K;
  /** URL path prefix for entries, e.g. "blog/" → /blog/{slug}/. */
  basePath: string;
  /** Which entries are actually rendered as pages (default: all). */
  filter?: (entry: CollectionEntry<K>) => boolean;
  /** OG-card byline for an entry; defaults to the site owner's name. */
  byline?: (entry: CollectionEntry<K>) => string;
}) {
  return {
    ...config,
    /** Load this collection's page entries as normalized records. */
    async records(): Promise<PageRecord[]> {
      const entries = await getCollection(config.collection, config.filter);
      return entries.map((entry) => ({
        path: `${config.basePath}${entry.id}/`,
        title: entry.data.title,
        description: entry.data.description,
        publishDate: entry.data.publishDate,
        contentModifiedDate: entry.data.contentModifiedDate,
        byline: config.byline?.(entry) ?? site.name,
        robots: entry.data.robots,
      }));
    },
  };
}

/**
 * The single source of truth for the collections that render one page per entry.
 * Both the sitemap (src/pages/sitemap.xml.ts) and the OG image manifest
 * (src/og/manifest.ts) iterate this list, so adding a new page section is one
 * entry here — no separate edit to either to forget. CI's `npm run check:sitemap`
 * fails the build if an indexable page ends up missing from the sitemap.
 *
 * Adding a section is still: (1) define the collection in src/content.config.ts
 * (include title/description/publishDate/contentModifiedDate/robots), (2) create
 * its [...slug].astro route, (3) register it here.
 */
const pageCollections = [
  definePageCollection({
    collection: "blog",
    basePath: "blog/",
    byline: (entry) => entry.data.author.name,
  }),
  definePageCollection({ collection: "resources", basePath: "resources/", filter: isResourcePage }),
  definePageCollection({ collection: "legal", basePath: "legal/" }),
];

/** Every collection-driven page, normalized — consumed by the sitemap + OG manifest. */
export async function getPageRecords(): Promise<PageRecord[]> {
  const groups = await Promise.all(pageCollections.map((pc) => pc.records()));
  return groups.flat();
}
