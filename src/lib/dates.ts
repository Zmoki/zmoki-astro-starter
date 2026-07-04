// Single source of truth for the date formats the site emits, so the machine
// (`datetime`/`lastmod`) and human renderings can't drift across components.

/** Machine date, YYYY-MM-DD (for <time datetime>, sitemap <lastmod>, etc.). */
export const isoDate = (d: Date): string => d.toISOString().substring(0, 10);

/** Human date, long month — e.g. "January 1, 2025". Used in page chrome. */
export const formatLongDate = (d: Date): string =>
  d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

/** Human date, short month — e.g. "Jan 1, 2025". Used on the compact OG cards. */
export const formatShortDate = (d: Date): string =>
  d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
