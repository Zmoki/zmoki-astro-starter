// Publish / last-modified dates for the landing page (src/pages/index.astro),
// used to compute its <lastmod> in the sitemap. Kept in a plain data module
// rather than exported from the page component so the sitemap doesn't have to
// import from a page. Bump contentModifiedDate when the landing page changes.
export const homePagePublishDate = new Date("2026-07-04");
export const homePageContentModifiedDate = new Date("2026-07-04");
