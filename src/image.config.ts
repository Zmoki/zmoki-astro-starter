/**
 * Content-image configuration.
 *
 * Images are hosted on a remote origin (e.g. an R2 bucket on a custom domain)
 * and OPTIMIZED AT BUILD by Astro (`astro:assets`): downloaded, resized,
 * re-encoded to webp/avif, content-hashed into `dist/_astro/`, and then served
 * by the deploy host (whose edge is itself a CDN). The origin is pure storage —
 * there is no runtime image-CDN transform. Astro caches processed images in
 * `node_modules/.astro`, so unchanged images are never re-fetched or re-processed
 * (persist that dir in CI — see the workflow).
 *
 * The origin is DECOUPLED from `site.deploy.platform` (originals can live
 * anywhere) and is authorized for build-time optimization in `astro.config.mjs`
 * via `image.remotePatterns`. See the /images skill.
 */

export type ImageLayout = "constrained" | "fullWidth" | "fixed";

/** Base URL of the remote image origin, e.g. "https://images.zmoki.xyz". Empty ⇒ none set. */
export const imageCdnHost = (import.meta.env.PUBLIC_IMAGE_CDN_HOST || "")
  .trim()
  .replace(/\/+$/, "");

/**
 * Resolve an author-facing image `src` to an absolute URL. A full URL passes
 * through; a bare key ("starter/photo.jpg") is prefixed with the origin base, so
 * content stays portable (change the domain in one env var). Used to resolve
 * `<Image>` string sources and the cover URL for schema.org + the image sitemap.
 */
export function resolveImageSrc(src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  if (!imageCdnHost) return src;
  return `${imageCdnHost}/${src.replace(/^\/+/, "")}`;
}
