import type { APIRoute } from "astro";
import { isoDate } from "@/lib/dates";
import { getPageRecords } from "@/lib/page-collections";
import type { StandalonePageMeta } from "@/lib/standalone-page";
import { meta as homeMeta } from "@/pages/index.astro";
import { meta as blogIndexMeta } from "@/pages/blog/index.astro";
import { isNoindex } from "@/lib/robots";
import { isNoindexPath } from "@/lib/noindex";

/** One sitemap URL: a site-relative path (trailing slash, no leading slash) + its <lastmod>. */
type SitemapEntry = { path: string; lastmod: Date };

export const GET: APIRoute = async ({ site }) => {
  // The standalone pages own their metadata — read it here at runtime (not at
  // module top level, which would race the page↔manifest import cycle).
  const standalonePages: StandalonePageMeta[] = [homeMeta, blogIndexMeta];

  // One load of every collection-driven page; both the URL list and the index
  // <lastmod> are derived from it (no second content-store read).
  const records = await getPageRecords();

  // Collection page URLs, dropping entries whose `robots` frontmatter implies
  // noindex (content-level). Path-level noindex (headers) is applied to the full
  // list below, so both noindex controls live together in this endpoint.
  const collectionEntries: SitemapEntry[] = records
    .filter((record) => !isNoindex(record.robots))
    .map((record) => ({ path: record.path, lastmod: record.contentModifiedDate }));

  // The standalone pages' shared <lastmod>: the newest of any date a standalone
  // page exports in its `meta` and the most recently modified post (all posts,
  // incl. any noindex — matches the pages' freshness, since home + blog index
  // surface recent content). Spread into Math.max so an empty blog falls back to
  // the page dates cleanly.
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

  // Standalone (non-collection) pages come from the shared data module (home +
  // blog index) and take that computed <lastmod>. Everything is then run through
  // isNoindexPath so any URL the headers config marks noindex (X-Robots-Tag) is
  // excluded.
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
