import type { APIRoute } from "astro";
import { isoDate } from "@/lib/dates";
import { getPageRecords } from "@/lib/page-collections";
import { meta as homeMeta } from "@/pages/index.astro";
import { meta as blogIndexMeta } from "@/pages/blog/index.astro";
import { isNoindex } from "@/lib/robots";
import { isNoindexPath } from "@/lib/noindex";

/** One sitemap URL: a site-relative path (trailing slash, no leading slash) + its <lastmod>. */
type SitemapEntry = { path: string; lastmod: Date };

export const GET: APIRoute = async ({ site }) => {
  // Read page metas at runtime, not at module top level (which would race the
  // page↔manifest import cycle).
  const standalonePages: StandalonePageMeta[] = [homeMeta, blogIndexMeta];
  const records = await getPageRecords();

  // Collection URLs, dropping content-level noindex (`robots`). Path-level
  // noindex is applied to the whole list below.
  const collectionEntries: SitemapEntry[] = records
    .filter((record) => !isNoindex(record.robots))
    .map((record) => ({ path: record.path, lastmod: record.contentModifiedDate }));

  // Shared <lastmod> for the standalone pages: newest of their own dates and the
  // most recently modified post (home + blog index surface recent content).
  const standaloneLatestDate = new Date(
    Math.max(
      ...standalonePages
        .flatMap((page) => [page.publishDate, page.contentModifiedDate])
        .filter((date): date is Date => date !== undefined)
        .map((date) => date.getTime()),
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

  // Standalone pages take that shared <lastmod>; the whole list is then filtered
  // through isNoindexPath (header X-Robots-Tag rules).
  const urls: SitemapEntry[] = [
    ...standalonePages.map((page) => ({ path: page.path, lastmod: standaloneLatestDate })),
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
