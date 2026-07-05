import { getCollection, type CollectionEntry } from "astro:content";
import { site } from "@/site.config";

type PageCollectionName = "blog" | "resources" | "legal";

/** A resource is a real page (`type: "page"`), not a bare external link. Shared
 *  by the resources route and the registry so the rule lives once. */
export const isResourcePage = (entry: CollectionEntry<"resources">): boolean =>
  entry.data.type === "page";

/** The common fields every page collection exposes, projected once so consumers
 *  (sitemap, OG manifest) don't reach into per-collection schemas. */
export interface PageRecord {
  /** URL path, trailing slash, no leading slash: "blog/1-set-up-your-site/". */
  path: string;
  title: string;
  description: string;
  publishDate: Date;
  contentModifiedDate: Date;
  /** OG-card byline — the post author, else the site owner. */
  byline: string;
  /** robots directives from frontmatter (drives sitemap noindex filtering). */
  robots?: string[];
}

function definePageCollection<K extends PageCollectionName>(config: {
  collection: K;
  /** URL path prefix, e.g. "blog/" → /blog/{slug}/. */
  basePath: string;
  /** Which entries render as pages (default: all). */
  filter?: (entry: CollectionEntry<K>) => boolean;
  /** OG-card byline; defaults to the site owner's name. */
  byline?: (entry: CollectionEntry<K>) => string;
}) {
  return {
    ...config,
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

// Single source of truth for the one-page-per-entry collections. The sitemap and
// OG manifest both iterate this, so a new section is one entry here (CI's
// check:sitemap fails the build if an indexable page is missing). Adding a
// section: define it in content.config.ts, create its [...slug].astro route,
// then register it here.
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
