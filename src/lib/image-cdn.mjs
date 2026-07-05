/**
 * Provider-agnostic image-CDN engine — the single source of truth for turning an
 * image key/URL into a responsive `<img>` attribute set (src + srcset + sizes +
 * style). Framework-free and env-free: callers pass `provider` + `base` in, so
 * the same logic drives both the `<Image>` component (reads import.meta.env via
 * src/image.config.ts) and the Markdown rewrite (reads loadEnv in astro.config).
 *
 * The provider is chosen by `PUBLIC_IMAGE_CDN` and is deliberately DECOUPLED from
 * `site.deploy.platform` — you can deploy on Netlify and serve images from an R2
 * bucket on a Cloudflare zone, or from Uploadcare, etc. When no provider is set
 * (or its base URL is missing) the CDN is inactive and callers fall back to
 * Astro's build-time optimization (astro:assets) for repo-committed images.
 *
 * Built on Unpic (`@unpic/core`), which speaks ~30 image CDNs with one API. We
 * skip `@unpic/astro` (its peer range stops at Astro 5) and render the markup
 * ourselves from `transformProps`.
 */
import { transformProps } from "@unpic/core";

/**
 * Provider registry: our provider id → the Unpic CDN id + how a source is addressed.
 *
 * - `source: "path"`     — `src` is a key relative to the CDN base. Unpic's
 *   Cloudflare transformer emits a root-relative `/cdn-cgi/image/…` URL (it
 *   assumes same-origin serving); we absolutize it against `base` so the
 *   transform runs on the image domain's own Cloudflare zone — independent of
 *   where the site is deployed.
 * - `source: "absolute"` — `src` resolves to `${base}/${key}` (or a full URL);
 *   Unpic returns an absolute CDN URL already, so no absolutizing is needed.
 *
 * To add a provider (bunny, contentful, a custom endpoint…): add an entry here
 * with its Unpic cdn id, declare the env vars (src/env.d.ts + .env.example), and
 * add its host to `img-src` in src/headers/headers.config.ts. See the /images skill.
 */
export const IMAGE_PROVIDERS = {
  "r2-cloudflare": { cdn: "cloudflare", source: "path" },
  uploadcare: { cdn: "uploadcare", source: "absolute" },
  cloudinary: { cdn: "cloudinary", source: "absolute" },
  imgix: { cdn: "imgix", source: "absolute" },
};

const stripTrailing = (s) => (s || "").replace(/\/+$/, "");
const stripLeading = (s) => (s || "").replace(/^\/+/, "");

/** True when a real CDN provider is configured with a base URL. */
export function cdnActive(provider, base) {
  return Boolean(provider && provider !== "local" && IMAGE_PROVIDERS[provider] && base);
}

/**
 * Resolve an author-facing `src` (a key like "starter/photo.jpg" OR a full URL)
 * to the source Unpic transforms. Accepting both keeps content robust: a full
 * URL still renders (and yields a valid absolute schema/sitemap URL) even when
 * the CDN env is unset.
 */
function toSource(provider, base, key) {
  const cfg = IMAGE_PROVIDERS[provider];
  const isAbsolute = /^https?:\/\//i.test(key);
  const b = stripTrailing(base);
  if (cfg.source === "path") {
    // Cloudflare: emit a RELATIVE source so the transform serves cleanly from the
    // zone (…/cdn-cgi/image/OPS/starter/x.jpg), which we absolutize against `base`.
    // Strip a matching base off absolute URLs; an off-base absolute URL is passed
    // through as a remote source.
    if (isAbsolute) return key.startsWith(b) ? key.slice(b.length) || "/" : key;
    return "/" + stripLeading(key);
  }
  // Absolute-URL CDNs (cloudinary/imgix/uploadcare): a full URL, or base + key.
  return isAbsolute ? key : b + "/" + stripLeading(key);
}

/** Prefix root-relative URLs (Cloudflare's /cdn-cgi/image/…) with the CDN base. */
function absolutize(base, url) {
  if (!url) return url;
  return url.startsWith("/") ? stripTrailing(base) + url : url;
}

/** Unpic returns `style` as an object; hast/HTML needs a string. */
function styleToString(style) {
  if (!style || typeof style === "string") return style || undefined;
  return Object.entries(style)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

/**
 * Build responsive `<img>` attributes for a CDN-hosted image.
 *
 * @param {string} provider  our provider id (e.g. "r2-cloudflare")
 * @param {string} base      the image domain, e.g. "https://i.zmoki.xyz"
 * @param {object} opts      { src, width?, height?, layout?, priority?, sizes?, alt? }
 * @returns {{src:string, srcset?:string, sizes?:string, width?:number, height?:number,
 *   style?:string, loading?:string, decoding?:string, fetchpriority?:string, alt?:string}}
 */
export function cdnImageAttrs(provider, base, opts) {
  const { src, width, height, layout = "constrained", priority = false, sizes, alt } = opts;
  const cfg = IMAGE_PROVIDERS[provider];
  const props = transformProps({
    src: toSource(provider, base, src),
    width,
    height,
    layout,
    priority,
    cdn: cfg.cdn,
    ...(sizes ? { sizes } : {}),
    ...(alt != null ? { alt } : {}),
  });
  // srcset entries are comma-separated, but Cloudflare URLs themselves contain
  // commas (width=640,height=360,…). Split only at an entry boundary — a comma
  // immediately followed by the next URL (an absolute "https://" or a root path).
  const srcset = props.srcset
    ? props.srcset
        .split(/,\s*(?=https?:\/\/|\/)/)
        .map((entry) => absolutize(base, entry.trim()))
        .join(", ")
    : undefined;
  return {
    ...props,
    src: absolutize(base, props.src),
    srcset,
    style: styleToString(props.style),
  };
}
