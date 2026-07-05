import type { APIRoute } from "astro";
import { isoDate } from "@/lib/dates";
import { getPageRecords } from "@/lib/page-collections";
import { meta as homeMeta } from "@/pages/index.astro";
import { meta as blogIndexMeta } from "@/pages/blog/index.astro";
import { isNoindex } from "@/lib/robots";
import { isNoindexPath } from "@/lib/noindex";

/** One sitemap URL: path (trailing slash, no leading slash) + <lastmod>, and an
 *  optional cover image URL for the image-sitemap. */
type SitemapEntry = { path: string; lastmod: Date; imageLoc?: string };

// Image URLs can carry `&` (query params), which must be `&amp;` in valid XML.
const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET: APIRoute = async ({ site }) => {
  // Read page metas at runtime, not at module top level (page↔manifest cycle).
  const standalonePages: StandalonePageMeta[] = [homeMeta, blogIndexMeta];
  const records = await getPageRecords();

  // Collection URLs, dropping content-level noindex (`robots`). Path-level
  // noindex is applied to the whole list below.
  const collectionEntries: SitemapEntry[] = records
    .filter((record) => !isNoindex(record.robots))
    .map((record) => ({
      path: record.path,
      lastmod: record.contentModifiedDate,
      imageLoc: record.imageLoc,
    }));

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

  // A <url>, optionally carrying an image-sitemap <image:loc> for the page's
  // cover — helps Google bind a CDN-hosted image to the page (post-2022 the
  // image extension is just <image:loc>).
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

  // Standalone pages take that shared <lastmod>; the whole list is then filtered
  // through isNoindexPath (header X-Robots-Tag rules).
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
