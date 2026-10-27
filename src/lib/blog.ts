import {
  getCollection,
  getEntry,
  type CollectionEntry,
  type ReferenceDataEntry,
} from "astro:content";

// Blog listing rules: the featured post, pagination and category archives. The
// blog index, /blog/page/{n}/, the category archives and the sitemap all use these,
// so a page never lists a post another page counts differently.

export type Post = CollectionEntry<"blog">;
export type Category = CollectionEntry<"blogCategories">;

export const POSTS_PER_PAGE = 10;

/** The pinned post (the newest with `featured: true`) and every other post, in order. */
export function splitFeatured(posts: Post[]): { featured?: Post; rest: Post[] } {
  const featured = posts.find((post) => post.data.featured);
  return { featured, rest: posts.filter((post) => post !== featured) };
}

/** Number of pages for a list, at least 1. */
export const pageCount = (items: unknown[]) =>
  Math.max(1, Math.ceil(items.length / POSTS_PER_PAGE));

/** The items on page `n` (1-based). */
export const pageItems = <T>(items: T[], n: number) =>
  items.slice((n - 1) * POSTS_PER_PAGE, n * POSTS_PER_PAGE);

/** Page `n` of the blog index: /blog/, then /blog/page/{n}/. */
export const blogPagePath = (n: number) => (n === 1 ? "/blog/" : `/blog/page/${n}/`);

/** Page `n` of a category archive: /blog/category/{id}/, then .../page/{n}/. */
export const categoryPagePath = (id: string, n: number) =>
  n === 1 ? `/blog/category/${id}/` : `/blog/category/${id}/page/${n}/`;

/**
 * The category a post points at. Throws on a dangling id: Astro only logs an invalid
 * reference, so this is what fails the build on a misspelled category.
 */
export async function getCategory(ref: ReferenceDataEntry<"blogCategories">): Promise<Category> {
  const entry = await getEntry(ref);
  if (!entry) throw new Error(`No blog category "${ref.id}" in src/content/blog-categories.yaml.`);
  return entry;
}

/** Categories by label. */
export async function getCategories(): Promise<Category[]> {
  const categories = await getCollection("blogCategories");
  return categories.sort((a, b) => a.data.label.localeCompare(b.data.label));
}

/** A category's posts, from a newest-first list. */
export const postsInCategory = (posts: Post[], id: string) =>
  posts.filter((post) => post.data.category?.id === id);
