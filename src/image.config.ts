/**
 * Image-CDN configuration, bound to the site's env vars. The single place the
 * runtime (the `<Image>` component) reads which provider is active and turns an
 * image key into responsive `<img>` attributes.
 *
 * Provider selection is by `PUBLIC_IMAGE_CDN` + `PUBLIC_IMAGE_CDN_BASE` and is
 * DECOUPLED from `site.deploy.platform` (deploy on one host, serve images from
 * another). Unset ⇒ `local`: no CDN, and repo-committed images fall back to
 * Astro's build-time optimization (astro:assets). See the /images skill.
 *
 * The pure URL logic lives in `src/lib/image-cdn.mjs` (framework/env-free) so the
 * Markdown rewrite in astro.config.mjs can share it via `loadEnv`.
 */
import { cdnImageAttrs, cdnActive } from "./lib/image-cdn.mjs";

/** Active provider id: "local" (default) | "r2-cloudflare" | "uploadcare" | "cloudinary" | "imgix". */
export const imageProvider = (import.meta.env.PUBLIC_IMAGE_CDN || "local").trim();

/** Image domain, e.g. "https://i.zmoki.xyz" (trailing slash trimmed). Empty when local. */
export const imageCdnBase = (import.meta.env.PUBLIC_IMAGE_CDN_BASE || "")
  .trim()
  .replace(/\/+$/, "");

/** True when a real CDN provider is configured (provider set + base URL present). */
export const imageCdnActive = cdnActive(imageProvider, imageCdnBase);

export type ImageLayout = "constrained" | "fullWidth" | "fixed";

export interface CdnImageOpts {
  /** Image key relative to the CDN base ("starter/photo.jpg") or a full URL. */
  src: string;
  width?: number;
  height?: number;
  /** "constrained" (default): scales down to `width`. "fullWidth": edge-to-edge. "fixed": exact. */
  layout?: ImageLayout;
  /** Eager-load + fetchpriority=high — set on the LCP/hero image only. */
  priority?: boolean;
  sizes?: string;
  alt?: string;
}

/** Build responsive `<img>` attributes for a CDN-hosted image, using the active provider. */
export function imageAttrs(opts: CdnImageOpts) {
  return cdnImageAttrs(imageProvider, imageCdnBase, opts);
}

/**
 * Canonical absolute URL for a cover image at the Discover-friendly rendition
 * (≥1200px wide, 16:9). Single source for the post hero, the schema.org
 * BlogPosting.image, and the image-sitemap `<image:loc>` so they can't drift.
 * When no CDN is active, returns the raw value (expected to be a full URL or a
 * /public path).
 */
export function coverImageUrl(src: string): string {
  if (!imageCdnActive) return src;
  return imageAttrs({ src, width: 1200, height: 675, layout: "constrained" }).src;
}
