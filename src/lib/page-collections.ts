import { getCollection, type CollectionEntry } from "astro:content";
import { site } from "@/site.config";
import { getPerson } from "@/lib/people";

type PageCollectionName = "blog" | "resources" | "legal" | "people";

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
  /** Cover image source (blog covers). The sitemap publishes it through publishedImageUrl. */
  imageLoc?: string;
  /** OG card template: "article" (dated, with a byline) or "site". Default "article". */
  card?: "article" | "site";
}

type PageFields = Omit<PageRecord, "path">;

function definePageCollection<K extends PageCollectionName>(config: {
  collection: K;
  /** URL path prefix, e.g. "blog/" → /blog/{slug}/. */
  basePath: string;
  /** Which entries render as pages (default: all). */
  filter?: (entry: CollectionEntry<K>) => boolean;
  /** The page's fields. Default: the entry's own title, description, dates and robots. */
  fields?: (entry: CollectionEntry<K>) => PageFields | Promise<PageFields>;
}) {
  return {
    ...config,
    async records(): Promise<PageRecord[]> {
      const entries = await getCollection(config.collection, config.filter);
      return Promise.all(
        entries.map(async (entry) => ({
          path: `${config.basePath}${entry.id}/`,
          ...(config.fields ? await config.fields(entry) : defaultFields(entry)),
        })),
      );
    },
  };
}

type PageEntry = CollectionEntry<"blog" | "resources" | "legal">;

const defaultFields = (entry: CollectionEntry<PageCollectionName>): PageFields => {
  const { title, description, publishDate, contentModifiedDate, robots } = (entry as PageEntry)
    .data;
  return { title, description, publishDate, contentModifiedDate, robots, byline: site.name };
};

// The one-page-per-entry collections, iterated by the sitemap and OG manifest.
// To add a section: define it in content.config.ts, add its [...slug].astro
// route, then register it here (CI's check:sitemap fails if you forget).
const pageCollections = [
  definePageCollection({
    collection: "blog",
    basePath: "blog/",
    fields: async (entry) => ({
      ...defaultFields(entry),
      byline: (await getPerson(entry.data.author)).data.name,
      imageLoc: entry.data.cover?.image,
    }),
  }),
  definePageCollection({ collection: "resources", basePath: "resources/", filter: isResourcePage }),
  definePageCollection({ collection: "legal", basePath: "legal/" }),
  // Only people with a `profile` get a page.
  definePageCollection({
    collection: "people",
    basePath: "people/",
    filter: (entry) => !!entry.data.profile,
    fields: (entry) => {
      const profile = entry.data.profile!;
      return {
        title: entry.data.name,
        description: profile.description,
        publishDate: profile.publishDate,
        contentModifiedDate: profile.contentModifiedDate,
        robots: profile.robots,
        byline: entry.data.name,
        card: "site",
      };
    },
  }),
];

/** Every collection-driven page, for the sitemap and OG manifest. */
export async function getPageRecords(): Promise<PageRecord[]> {
  const groups = await Promise.all(pageCollections.map((pc) => pc.records()));
  return groups.flat();
}
