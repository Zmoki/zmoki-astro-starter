import type { APIRoute } from "astro";
import { homePagePublishDate, homePageContentModifiedDate } from "@/data/home-page";
import { isoDate } from "@/lib/dates";
import { getPageRecords, standaloneRoutes } from "@/lib/page-collections";
import { isNoindex } from "@/lib/robots";
import { isNoindexPath } from "@/lib/noindex";

/** One sitemap URL: a site-relative path (trailing slash, no leading slash) + its <lastmod>. */
type SitemapEntry = { path: string; lastmod: Date };

export const GET: APIRoute = async ({ site }) => {
  // One load of every collection-driven page; both the URL list and the index
  // <lastmod> are derived from it (no second content-store read).
  const records = await getPageRecords();

  // Collection page URLs, dropping entries whose `robots` frontmatter implies
  // noindex (content-level). Path-level noindex (headers) is applied to the full
  // list below, so both noindex controls live together in this endpoint.
  const collectionEntries: SitemapEntry[] = records
    .filter((record) => !isNoindex(record.robots))
    .map((record) => ({ path: record.path, lastmod: record.contentModifiedDate }));

  // The index page's <lastmod> is the newest of its own dates and the most
  // recently modified post (all posts, incl. any noindex — matches the page's
  // own freshness). Spread into Math.max so an empty blog falls back cleanly.
  const indexPageLatestDate = new Date(
    Math.max(
      homePagePublishDate.getTime(),
      homePageContentModifiedDate.getTime(),
      ...records
        .filter((record) => record.path.startsWith("blog/"))
        .map((record) => record.contentModifiedDate.getTime()),
    ),
  );

  const sitemapUrl = ({ path, lastmod }: SitemapEntry) => `
  <url>
    <loc>${site}${path}</loc>
    <lastmod>${isoDate(lastmod)}</lastmod>
  </url>
  `;

  // Standalone (non-collection) pages come from the shared registry (home + blog
  // index) and all take the computed index <lastmod>. Everything is then run
  // through isNoindexPath so any URL the headers config marks noindex
  // (X-Robots-Tag) is excluded.
  const urls: SitemapEntry[] = [
    ...standaloneRoutes.map((route) => ({ path: route.path, lastmod: indexPageLatestDate })),
    ...collectionEntries,
  ].filter((url) => !isNoindexPath(`/${url.path}`));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(sitemapUrl).join("")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
};
