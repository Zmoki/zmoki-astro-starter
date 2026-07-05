---
description: Set up, enable, or swap the content-image CDN (png/jpg/webp), add cover/hero images, or work on how content images are served & optimized. Use when the user wants an image CDN (Cloudflare R2, Uploadcare, Cloudinary, imgix…), responsive images, a post cover/hero, image SEO (Google Discover / image sitemaps), or to change how <Image>/<ContentImage>/Markdown images work.
---

# Content images & image CDN

How the starter serves **content images** (photos: png/jpg/webp) — optimized, responsive, and (optionally) through an **image CDN that is decoupled from the deploy host**. This is a task playbook; the canonical summary lives in `AGENTS.md` → **Content images**.

## The model

Two delivery paths, one vendor-neutral surface:

- **Zero-config baseline (`local`)** — no CDN configured. Repo-committed images (imported assets) are optimized at build by Astro (`astro:assets`, Sharp) and served by the deploy host. Works offline, no account.
- **Image CDN (opt-in)** — set `PUBLIC_IMAGE_CDN` + `PUBLIC_IMAGE_CDN_BASE` and content images are served + transformed by a CDN. **The CDN is chosen independently of `site.deploy.platform`** — deploy on Netlify, serve images from an R2 bucket on a Cloudflare zone (or Uploadcare, Cloudinary, imgix). Built on [Unpic](https://unpic.pics).

Provider selection is env-driven and self-gating, exactly like analytics/forms/captcha.

| Provider (`PUBLIC_IMAGE_CDN`) | What it is                                    | On-the-fly transforms |
| ----------------------------- | --------------------------------------------- | --------------------- |
| _(unset)_ → `local`           | Astro build-time optimization                 | No (baked at build)   |
| `r2-cloudflare` (default)     | R2 storage + Cloudflare Image Transformations | Yes, at the edge      |
| `uploadcare`                  | Uploadcare CDN                                | Yes                   |
| `cloudinary`                  | Cloudinary CDN                                | Yes                   |
| `imgix`                       | imgix CDN                                     | Yes                   |

### Key files

- **`src/lib/image-cdn.mjs`** — the engine (framework/env-free): the provider registry (`IMAGE_PROVIDERS`) and `cdnImageAttrs()` / `cdnActive()`, built on `@unpic/core`.
- **`src/image.config.ts`** — binds the engine to `PUBLIC_IMAGE_CDN` / `PUBLIC_IMAGE_CDN_BASE`; exports `imageAttrs()`, `imageCdnActive`, and `coverImageUrl()`.
- **`src/components/Image.astro`** — vendor-neutral responsive image. Imported asset → `astro:assets`; string key/URL + CDN active → Unpic responsive `<img>`; string + no CDN → plain `<img>`.
- **`src/components/ContentImage.astro`** — captioned, meaningful (non-decorative) image with schema.org `ImageObject` markup; delegates to `<Image>`. Site-wide, not post-only.
- **`astro.config.mjs`** — `image.layout: "constrained"` (responsive by default) + `image.remotePatterns` authorizing the CDN domain so **plain Markdown images** on it are optimized at build.

## Enable / swap the CDN

1. **Set env** (`.env`, declared in `src/env.d.ts`, mirrored in `.env.example`):
   ```
   PUBLIC_IMAGE_CDN=r2-cloudflare
   PUBLIC_IMAGE_CDN_BASE=https://i.zmoki.xyz
   ```
2. **Add the CDN host to the CSP** — set `IMAGE_CDN_HOST` in `src/headers/headers.config.ts` to the same origin, then `npm run build:headers` and commit the artifact. (The drift-checked `public/_headers` can't read env, so the host is a literal there.)
3. Rebuild. `PUBLIC_IMAGE_CDN` unset ⇒ everything falls back to `local`.

### `r2-cloudflare` prerequisites (the default)

R2 is **storage**; the resizing comes from **Cloudflare Image Transformations**, which only run on a **custom domain proxied through a Cloudflare zone** — NOT the `pub-*.r2.dev` URL. So:

- Put the bucket behind a custom domain (e.g. `i.zmoki.xyz`) on a Cloudflare zone.
- Enable **Image Transformations** for that zone (Cloudflare dashboard → the zone → Images → Transformations → "Enable for zone").
- Upload objects; reference them by key (`starter/photo.jpg`) or full URL. The engine emits `https://<base>/cdn-cgi/image/width=…,f=auto,fit=cover/<key>`.

Because the image domain is its own Cloudflare zone, this works even when the **site** is deployed elsewhere.

## Authoring — three ways

1. **`<Image>`** (layouts/components, and the post cover) — full control, CDN-delivered:
   ```astro
   <Image src="starter/photo.jpg" alt="…" width={1200} height={675} priority />
   ```
   `priority` = eager + `fetchpriority=high`; use it only on the LCP/hero image. `src` may be an imported asset (local, build-optimized), a CDN key, or a full URL.
2. **`<ContentImage>`** — a meaningful image that needs a **caption + licensing schema** (`ImageObject`). Same `src` rules; adds `<figure>` + credit + a `<figcaption>` slot. For a purely decorative image use `<Image>` (or CSS).
3. **Plain Markdown `![alt](…)`** — handled by **Astro's built-in optimization** (no custom plugin):
   - Local (`./photo.jpg` in the content dir) → optimized + responsive at build.
   - A full CDN URL (`https://<base>/key.jpg`) → optimized + responsive at build **because the domain is in `image.remotePatterns`** (downloaded + re-hosted on the deploy origin — so this is build-time, not edge delivery; fine for incidental body images).
   - Reach for `<Image>`/`<ContentImage>` when you want true CDN/edge delivery or a caption.

## Cover / hero images & Google Discover

A post's **`cover`** (blog frontmatter, `src/content.config.ts`) is a real **non-text photograph** — distinct from the branded OG share card. It drives:

- the post **hero** (`<Image priority>` — the LCP image),
- the schema.org **`BlogPosting.image`** (`PostLayout.astro`) — the primary-image signal Google Discover reads,
- the **image-sitemap** `<image:loc>` (`src/pages/sitemap.xml.ts`).

All three come from `coverImageUrl()` (single source, can't drift). **`og:image` stays the branded OG card** (better for social sharing) — the two images serve different surfaces.

**For Discover, a cover must be:** a well-cropped **landscape**, **≥1200px wide**, **16:9**, high-resolution, **not text-heavy**, not a logo ([Google Discover docs](https://developers.google.com/search/docs/appearance/google-discover)). `max-image-preview:large` is already set site-wide (`BaseLayout.astro`). Set both `cover` and `coverAlt`:

```yaml
cover: "https://i.zmoki.xyz/starter/photo.jpg" # full URL (robust even if the CDN env is unset) or a key
coverAlt: "Describe the photo"
```

Posts without a cover fall back to the OG card for `schema.image` and emit no image-sitemap entry.

## Add a provider (e.g. Bunny, a custom endpoint)

1. Add an entry to `IMAGE_PROVIDERS` in `src/lib/image-cdn.mjs` with its Unpic `cdn` id and `source` mode (`"path"` = key relative to base, then absolutized — like Cloudflare; `"absolute"` = full CDN URL — like Cloudinary/imgix/Uploadcare). Unpic supports ~30 CDNs.
2. Declare any new env in `src/env.d.ts` + `.env.example`.
3. Add its host to `img-src` (and `IMAGE_CDN_HOST`) in `src/headers/headers.config.ts` → `npm run build:headers`.
4. Point `PUBLIC_IMAGE_CDN` at it.

## Verify

- `npm run build` then check a post's `<head>`: `og:image` = the OG card, JSON-LD `image` = the ≥1200px 16:9 cover, `/sitemap.xml` has an `<image:image>` for it.
- With `PUBLIC_IMAGE_CDN` unset vs set, confirm images render both ways and the CSP `img-src` includes the CDN host.
- `npm run check:sd` (after build) validates the JSON-LD.
