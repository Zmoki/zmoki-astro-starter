import { getCollection, type CollectionEntry } from "astro:content";
import { site } from "@/site.config";

type PageCollectionName = "blog" | "resources" | "legal";

/** A resource with its own page (`type: "page"`), not a bare external link. */
export const isResourcePage = (entry: CollectionEntry<"resources">): boolean =>
  entry.data.type === "page";

/** Blog posts newest first (`order`: higher = newer). Used by the blog index, prev/next nav and RSS. */
export async function getPostsNewestFirst(): Promise<CollectionEntry<"blog">[]> {
  const posts = await getCollection("blog");
  return posts.sort((a, b) => b.data.order - a.data.order);
}

/** The fields every page collection exposes, normalized for the sitemap and OG manifest. */
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
  /** Cover image URL for the image-sitemap <image:loc> (blog covers). */
  imageLoc?: string;
}

function definePageCollection<K extends PageCollectionName>(config: {
  collection: K;
  /** URL path prefix, e.g. "blog/" → /blog/{slug}/. */
  basePath: string;
  /** Which entries render as pages (default: all). */
  filter?: (entry: CollectionEntry<K>) => boolean;
  /** OG-card byline; defaults to the site owner's name. */
  byline?: (entry: CollectionEntry<K>) => string;
  /** Cover image URL for the image-sitemap, if the collection has one. */
  image?: (entry: CollectionEntry<K>) => string | undefined;
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
        imageLoc: config.image?.(entry),
      }));
    },
  };
}

// The one-page-per-entry collections, iterated by the sitemap and OG manifest.
// To add a section: define it in content.config.ts, add its [...slug].astro
// route, then register it here (CI's check:sitemap fails if you forget).
const pageCollections = [
  definePageCollection({
    collection: "blog",
    basePath: "blog/",
    byline: (entry) => entry.data.author.name,
    image: (entry) => entry.data.cover?.image,
  }),
  definePageCollection({ collection: "resources", basePath: "resources/", filter: isResourcePage }),
  definePageCollection({ collection: "legal", basePath: "legal/" }),
];

/** Every collection-driven page, for the sitemap and OG manifest. */
export async function getPageRecords(): Promise<PageRecord[]> {
  const groups = await Promise.all(pageCollections.map((pc) => pc.records()));
  return groups.flat();
}
