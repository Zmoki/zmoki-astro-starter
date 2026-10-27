import { getCollection, type CollectionEntry } from "astro:content";
import { site } from "@/site.config";
import { getPerson } from "@/lib/people";
import {
  blogPagePath,
  categoryPagePath,
  getCategories,
  pageCount,
  pageItems,
  postsInCategory,
  splitFeatured,
  type Post,
} from "@/lib/blog";
import { meta as blogMeta } from "@/pages/blog/index.astro";

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

// Collections whose entries have their own title, description and dates; any other
// collection must pass `fields`.
type WithPageFields = "blog" | "resources" | "legal";
type FieldsMapper<K extends PageCollectionName> = (
  entry: CollectionEntry<K>,
) => PageFields | Promise<PageFields>;

function definePageCollection<K extends PageCollectionName>(
  config: {
    collection: K;
    /** URL path prefix, e.g. "blog/" → /blog/{slug}/. */
    basePath: string;
    /** Which entries render as pages (default: all). */
    filter?: (entry: CollectionEntry<K>) => boolean;
  } & (K extends WithPageFields
    ? {
        /** The page's fields. Default: the entry's own title, description, dates and robots. */
        fields?: FieldsMapper<K>;
      }
    : { fields: FieldsMapper<K> }),
) {
  // The conditional type above checks call sites; inside, it's the plain mapper.
  const fields = config.fields as FieldsMapper<K> | undefined;
  return {
    ...config,
    async records(): Promise<PageRecord[]> {
      const entries = await getCollection(config.collection, config.filter);
      return Promise.all(
        entries.map(async (entry) => ({
          path: `${config.basePath}${entry.id}/`,
          ...(fields
            ? await fields(entry)
            : defaultFields(entry as CollectionEntry<WithPageFields>)),
        })),
      );
    },
  };
}

const defaultFields = (entry: CollectionEntry<WithPageFields>): PageFields => {
  const { title, description, publishDate, contentModifiedDate, robots } = entry.data;
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

/** A listing page's record. Its dates are the span of the posts it shows. */
function listingRecord(
  path: string,
  title: string,
  description: string,
  posts: Post[],
): PageRecord {
  const times = (pick: (post: Post) => Date) => posts.map((post) => pick(post).getTime());
  return {
    path: path.replace(/^\//, ""),
    title,
    description,
    publishDate: new Date(Math.min(...times((post) => post.data.publishDate))),
    contentModifiedDate: new Date(Math.max(...times((post) => post.data.contentModifiedDate))),
    byline: site.name,
    card: "site",
  };
}

/**
 * The blog's listing pages past /blog/ (a standalone page): /blog/page/{n}/ and every
 * page of each category archive. Same rules as the routes (src/lib/blog.ts). An empty
 * category has a noindex page and no record.
 */
async function archiveRecords(): Promise<PageRecord[]> {
  const posts = await getPostsNewestFirst();
  const { rest } = splitFeatured(posts);
  const blogPages = Array.from({ length: pageCount(rest) - 1 }, (_, i) =>
    listingRecord(
      blogPagePath(i + 2),
      `${blogMeta.title}, page ${i + 2}`,
      blogMeta.description,
      pageItems(rest, i + 2),
    ),
  );
  const categoryPages = (await getCategories()).flatMap((category) => {
    const listed = postsInCategory(posts, category.id);
    if (listed.length === 0) return [];
    const { label, description } = category.data;
    return Array.from({ length: pageCount(listed) }, (_, i) =>
      listingRecord(
        categoryPagePath(category.id, i + 1),
        i === 0 ? label : `${label}, page ${i + 1}`,
        description,
        pageItems(listed, i + 1),
      ),
    );
  });
  return [...blogPages, ...categoryPages];
}

/** Every collection-driven page (entries and the blog's archives), for the sitemap and OG manifest. */
export async function getPageRecords(): Promise<PageRecord[]> {
  const groups = await Promise.all([
    ...pageCollections.map((pc) => pc.records()),
    archiveRecords(),
  ]);
  return groups.flat();
}
