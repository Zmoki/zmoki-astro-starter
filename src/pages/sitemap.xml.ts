import type { APIRoute } from "astro";
import { isoDate } from "@/lib/dates";
import { getPageRecords } from "@/lib/page-collections";
import { meta as homeMeta } from "@/pages/index.astro";
import { meta as blogIndexMeta } from "@/pages/blog/index.astro";
import { isNoindex } from "@/lib/robots";
import { isNoindexPath } from "@/lib/noindex";

/** `path` has a trailing slash and no leading slash. `imageLoc` is the cover image. */
type SitemapEntry = { path: string; lastmod: Date; imageLoc?: string };

// Image URLs can carry `&` (query params), which must be `&amp;` in valid XML.
const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET: APIRoute = async ({ site }) => {
  // Read inside GET, not at module top level: the pages and the OG manifest import each other.
  const standalonePages: StandalonePageMeta[] = [homeMeta, blogIndexMeta];
  const records = await getPageRecords();

  // Drops content-level noindex. Path-level noindex is filtered from the whole list below.
  const collectionEntries: SitemapEntry[] = records
    .filter((record) => !isNoindex(record.robots))
    .map((record) => ({
      path: record.path,
      lastmod: record.contentModifiedDate,
      imageLoc: record.imageLoc,
    }));

  // Home and the blog index list recent posts, so their <lastmod> is the newest
  // of their own dates and any post's.
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

  // <image:loc> helps Google tie a CDN-hosted cover to the page. It is the only
  // image-sitemap tag Google still reads.
  const sitemapUrl = ({ path, lastmod, imageLoc }: SitemapEntry) => `
  <url>
    <loc>${site}${path}</loc>
    <lastmod>${isoDate(lastmod)}</lastmod>${
      imageLoc
        ? `
    <image:image>
      <image:loc>${xmlEscape(imageLoc)}</image:loc>
    </image:image>`
        : ""
    }
  </url>
  `;

  // isNoindexPath applies the X-Robots-Tag header rules.
  const urls: SitemapEntry[] = [
    ...standalonePages.map((page) => ({ path: page.path, lastmod: standaloneLatestDate })),
    ...collectionEntries,
  ].filter((url) => !isNoindexPath(`/${url.path}`));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urls.map(sitemapUrl).join("")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
};
