import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { homePagePublishDate, homePageContentModifiedDate } from "@/data/home-page";
import { isoDate } from "@/lib/dates";

// Minimal XML escaping for values placed in text nodes / URLs. Image-CDN URLs can
// carry `&` (e.g. imgix query params), which must be `&amp;` in valid XML.
const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

  // A <url> entry, optionally carrying an image-sitemap <image:image> for the
  // page's primary image (hero). Post-2022 the image extension is just
  // <image:loc> — caption/title/license were removed. Helps Google discover
  // images hosted on a different domain (our CDN) and bind them to the page.
  const sitemapUrl = (path: string, lastmod: string, imageLoc?: string) => `
  <url>
    <loc>${site}${path}</loc>
    <lastmod>${lastmod}</lastmod>${
      imageLoc
        ? `
    <image:image>
      <image:loc>${xmlEscape(imageLoc)}</image:loc>
    </image:image>`
        : ""
    }
  </url>
  `;

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${site}</loc>
    <lastmod>${indexPageLatestDate}</lastmod>
  </url>
  ${sitemapUrl("blog/", indexPageLatestDate)}
  ${allFeedIems
    .map((post: CollectionEntry<"blog">) =>
      sitemapUrl(`blog/${post.id}/`, isoDate(post.data.contentModifiedDate), post.data.hero?.image),
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
