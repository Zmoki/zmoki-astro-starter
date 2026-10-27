import type { APIRoute } from "astro";
import { isoDate } from "@/lib/dates";
import { getPageRecords } from "@/lib/page-collections";
import { meta as homeMeta } from "@/pages/index.astro";
import { meta as blogIndexMeta } from "@/pages/blog/index.astro";
import { meta as peopleIndexMeta } from "@/pages/people/index.astro";
import { isNoindex } from "@/lib/robots";
import { isNoindexPath } from "@/lib/noindex";
import { publishedImageUrl } from "@/lib/images";

/** `path` has a trailing slash and no leading slash. `imageLoc` is the cover's published URL. */
type SitemapEntry = { path: string; lastmod?: Date; imageLoc?: string };

// Image URLs can carry `&` (query params), which must be `&amp;` in valid XML.
const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET: APIRoute = async ({ site }) => {
  // Read inside GET, not at module top level: the pages and the OG manifest import each other.
  const standalonePages: StandalonePageMeta[] = [homeMeta, blogIndexMeta, peopleIndexMeta];
  const records = await getPageRecords();

  // Drops content-level noindex. Path-level noindex is filtered from the whole list below.
  const collectionEntries: SitemapEntry[] = await Promise.all(
    records
      .filter((record) => !isNoindex(record.robots))
      .map(async (record) => ({
        path: record.path,
        lastmod: record.contentModifiedDate,
        imageLoc: record.imageLoc && (await publishedImageUrl(record.imageLoc)),
      })),
  );

  const listed = (page: StandalonePageMeta) =>
    page.lists === undefined ? [] : records.filter((record) => record.path.startsWith(page.lists!));

  // A page that lists collection pages (home and the blog index list posts, the
  // people index lists profiles) changes when they do, so its <lastmod> is the newest
  // of its own dates and theirs. None at all (an empty blog with no dates of its own)
  // leaves <lastmod> out, which the protocol allows.
  const standaloneLastmod = (page: StandalonePageMeta): Date | undefined => {
    const times = [
      page.publishDate,
      page.contentModifiedDate,
      ...listed(page).map((record) => record.contentModifiedDate),
    ]
      .filter((date): date is Date => date !== undefined)
      .map((date) => date.getTime());
    return times.length ? new Date(Math.max(...times)) : undefined;
  };

  // <image:loc> ties the cover to the page. It is the only image-sitemap tag
  // Google still reads.
  const sitemapUrl = ({ path, lastmod, imageLoc }: SitemapEntry) => `
  <url>
    <loc>${site}${path}</loc>${
      lastmod
        ? `
    <lastmod>${isoDate(lastmod)}</lastmod>`
        : ""
    }${
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
    // A page marked noindexWhenEmpty (the people index) is noindex while it lists nothing.
    ...standalonePages
      .filter((page) => !(page.noindexWhenEmpty && listed(page).length === 0))
      .map((page) => ({ path: page.path, lastmod: standaloneLastmod(page) })),
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
