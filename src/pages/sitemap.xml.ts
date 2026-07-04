import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { homePagePublishDate, homePageContentModifiedDate } from "@/data/home-page";
import { isoDate } from "@/lib/dates";

export const GET: APIRoute = async ({ site }) => {
  // Get all posts from the feed collection
  const allFeedIems: CollectionEntry<"blog">[] = await getCollection("blog");

  // Get all resources from the resources collection
  const allResources: CollectionEntry<"resources">[] = await getCollection(
    "resources",
    ({ data }: { data: CollectionEntry<"resources">["data"] }) => data.type === "page",
  );

  // Get all legal items from the legal collection
  const allLegalItems: CollectionEntry<"legal">[] = await getCollection("legal");

  // The index page's <lastmod> is the newest of: its own dates, and the most
  // recently modified post. Spread the post timestamps into Math.max so an empty
  // blog collection simply falls back to the home-page dates (no [0] on []).
  const indexPageLatestDateTimestamp = Math.max(
    homePagePublishDate.getTime(),
    homePageContentModifiedDate.getTime(),
    ...allFeedIems.map((post) => post.data.contentModifiedDate.getTime()),
  );
  const indexPageLatestDate = isoDate(new Date(indexPageLatestDateTimestamp));

  const sitemapUrl = (path: string, lastmod: string) => `
  <url>
    <loc>${site}${path}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
  `;

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}</loc>
    <lastmod>${indexPageLatestDate}</lastmod>
  </url>
  ${sitemapUrl("blog/", indexPageLatestDate)}
  ${allFeedIems
    .map((post: CollectionEntry<"blog">) =>
      sitemapUrl(`blog/${post.id}/`, isoDate(post.data.contentModifiedDate)),
    )
    .join("")}
  ${allResources
    .map((resource: CollectionEntry<"resources">) =>
      sitemapUrl(`resources/${resource.id}/`, isoDate(resource.data.contentModifiedDate)),
    )
    .join("")}
    ${allLegalItems
      .map((legalItem: CollectionEntry<"legal">) =>
        sitemapUrl(`legal/${legalItem.id}/`, isoDate(legalItem.data.contentModifiedDate)),
      )
      .join("")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
};
