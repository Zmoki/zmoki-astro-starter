import { getImage, inferRemoteSize } from "astro:assets";
import { site } from "@/site.config";
import { isOnImageOrigin } from "@/lib/image-origin";

export { isOnImageOrigin };

// The image origin is a build input, never a public URL: a leaked origin gets
// crawled in place of the site's own URLs, and anyone can hotlink the originals.
// Anything that hands out an image URL (JSON-LD, the sitemap, the feed) goes through
// publishedImageUrl. `npm run check:origin` fails the build output if the
// origin shows up anyway. See the /images skill.

// Google Discover wants a primary image at least 1200px wide.
const PUBLISHED_WIDTH = 1200;

const sizes = new Map<string, ReturnType<typeof inferRemoteSize>>();

/** A remote image's natural size, fetched once per build. */
export function remoteImageSize(src: string): ReturnType<typeof inferRemoteSize> {
  let size = sizes.get(src);
  if (!size) sizes.set(src, (size = inferRemoteSize(src)));
  return size;
}

/**
 * The absolute URL of a webp rendition under /_astro, at most 1200px wide.
 * A URL off the origin is returned as is: it's already public and Astro doesn't fetch it.
 */
export async function publishedImageUrl(src: ImageMetadata | string): Promise<string> {
  if (typeof src === "string" && !isOnImageOrigin(src)) return src;
  const natural = typeof src === "string" ? await remoteImageSize(src) : src;
  const width = Math.min(PUBLISHED_WIDTH, natural.width);
  const height = Math.round((natural.height * width) / natural.width);
  const image = await getImage({ src, width, height, format: "webp" });
  return new URL(image.src, site.domain).href;
}
