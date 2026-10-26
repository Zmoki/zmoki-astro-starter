import { getImage, inferRemoteSize } from "astro:assets";
import { site } from "@/site.config";

// The image origin is a build input, never a public URL: a leaked origin gets
// crawled in place of the site's own URLs, and anyone can hotlink the originals.
// Anything that hands out an image URL (JSON-LD, the sitemap, the feed) goes through
// publishedImageUrl. `npm run check:origin` fails the build output if the
// origin shows up anyway. See the /images skill.

const IMAGE_ORIGIN = (site.platform.imagesCDNHost || "").trim().replace(/\/+$/, "");

// Google Discover wants a primary image at least 1200px wide.
const PUBLISHED_WIDTH = 1200;

/** Whether Astro optimizes this URL at build (it's on the image origin). */
export const isOnImageOrigin = (src: string): boolean =>
  !!IMAGE_ORIGIN && src.startsWith(`${IMAGE_ORIGIN}/`);

/**
 * The absolute URL of a webp rendition under /_astro, at most 1200px wide.
 * A URL off the origin is returned as is: it's already public and Astro doesn't fetch it.
 */
export async function publishedImageUrl(src: ImageMetadata | string): Promise<string> {
  if (typeof src === "string" && !isOnImageOrigin(src)) return src;
  const natural = typeof src === "string" ? await inferRemoteSize(src) : src;
  const width = Math.min(PUBLISHED_WIDTH, natural.width);
  const height = Math.round((natural.height * width) / natural.width);
  const image = await getImage({ src, width, height, format: "webp" });
  return new URL(image.src, site.domain).href;
}
