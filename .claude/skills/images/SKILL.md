---
description: Set up or work on content images (png/jpg/webp) — remote-hosted originals, build-time optimization, responsive images, post cover/hero, and image SEO (Google Discover / image sitemaps). Use when the user wants to add content images, host originals on a bucket/CDN (R2, S3…), add a post cover, cache optimized images in CI, or change how the <Image> component / Markdown images work.
---

# Content images

How the starter serves **content images** (photos: png/jpg/webp) — optimized, responsive, and SEO-ready. The canonical summary lives in `AGENTS.md` → **Content images**.

## The model — build-time optimization

Every content image is **optimized at build by Astro** (`astro:assets`, Sharp): resized, re-encoded to `webp`/`avif`, content-hashed into `dist/_astro/`, and served by the deploy host (whose edge is itself a CDN). `astro.config.mjs` sets `image.layout: "constrained"`, so images are responsive (srcset + zero-CLS sizing) by default.

Originals come from one of two places:

- **Committed** — drop the file in `src/images/`, import it, done. Zero external dependency; builds never fetch.
- **Remote origin (recommended for anything non-trivial)** — host originals on a bucket/CDN (e.g. an **R2 bucket on a custom domain**), set **`site.imageOrigin`** in `src/site.config.ts`, and Astro **downloads + optimizes them at build**. Keeps binaries out of git. The origin is pure storage — there is **no runtime image-CDN transform** — and is **decoupled from `site.deploy.platform`** (deploy anywhere, host images anywhere). It's committed config (not an env var) precisely because it's non-secret and must be present in every build environment — including host previews, which often don't expose env vars.

> Why build-time (not runtime CDN transforms)? Simpler, no per-transform billing, no extra runtime service, host-agnostic, and the deploy host already CDN-serves `/_astro/`. Trade-off: a build with the origin authorized **must reach it** (it downloads at build); and variants are baked, not on-the-fly. See "Reachability & CI" below.

### Key files

- **`src/site.config.ts`** — **`site.imageOrigin`**, the single source of truth for the origin (also feeds the CSP `img-src`, so they can't drift).
- **`src/image.config.ts`** — `imageCdnHost` (from `site.imageOrigin`) + `resolveImageSrc()` (bare key → full URL). No provider/transform logic.
- **`src/components/Image.astro`** — the one content-image component; wraps `astro:assets`. Imported asset **or** remote key/URL. Emits a schema.org `ImageObject` license JSON-LD for **every** image. A caption (default slot) adds a `<figure>` + `<figcaption>`. Images `astro:assets` can't optimize (an unauthorized/unknown remote) render as a plain `<img>` (no bogus repeated-URL srcset, no build-time fetch).
- **`astro.config.mjs`** — `image.layout: "constrained"` + `image.remotePatterns` authorizing the origin domain (from `site.imageOrigin`).

## Enable a remote origin

1. **Set `site.imageOrigin`** in `src/site.config.ts`, e.g. `imageOrigin: "https://images.zmoki.xyz"`. That single value authorizes the domain for build-time optimization, lets content reference images by bare key, and drives the CSP `img-src`. (Because it's committed, every build — CI, host previews, production — optimizes with no env-var setup.)
2. **Rebuild the CSP artifact** — `npm run build:headers` and commit `public/_headers` (it now includes the origin, sourced from `site.imageOrigin`).
3. Host originals there (e.g. `wrangler r2 object put <bucket>/<key> --file=… --remote`) and reference them.

`imageOrigin: ""` ⇒ commit images to `src/images` and import them; a full remote URL in content still renders (just unoptimized) if its domain isn't authorized.

## Authoring — two ways

1. **`<Image>`** — the one component. `src` is an imported asset **or** a string URL; a string (remote) src **requires `width` + `height`** (Astro can't infer a remote image's size). Use a **full URL** (a bare key only resolves when `site.imageOrigin` is set — see the robustness note). `priority` = eager + `fetchpriority=high` (LCP/hero only).
   - **No caption** → a plain responsive `<img>` (hero/cover, decorative, inline):
     ```astro
     <Image src="https://images.example.com/photo.jpg" alt="…" width={1200} height={675} priority />
     ```
   Every image emits a schema.org `ImageObject` license JSON-LD (Google image-license metadata — license/acquireLicensePage/creditText/copyrightNotice/creator, from `site.copyright.images.license` + `site.organization`), caption or not.
   - **With a caption** (default slot) → additionally wraps the image in a `<figure>` + `<figcaption>`:
     ```astro
     <Image src="https://images.example.com/photo.jpg" alt="…" width={1200} height={675}>
       A caption.
     </Image>
     ```
2. **Plain Markdown `![alt](…)`** — handled by **Astro's built-in optimization**: local (`./photo.jpg`) images, and remote URLs whose domain is authorized in `image.remotePatterns`, are optimized + made responsive at build.

> **Content robustness:** reference remote images by **full URL** in Markdown/frontmatter (not a bare key) unless `site.imageOrigin` is set — a bare key with no origin is treated as a (missing) local path and fails the build. Full URLs render either way.

## Cover / hero images & Google Discover

A post's optional **`cover`** (+ **`coverAlt`**) — blog frontmatter, `src/content.config.ts` — is a real **non-text photograph** (distinct from the branded OG card). Via `resolveImageSrc()` (single source) it drives:

- the post **hero** (`<Image priority>` — the LCP image, optimized at build),
- the schema.org **`BlogPosting.image`** (`PostLayout.astro`) — the primary-image signal Google Discover reads,
- the **image-sitemap** `<image:loc>` (`src/pages/sitemap.xml.ts`, namespace `sitemap-image/1.1`).

**`og:image` stays the branded OG card** (better for social) — the two images serve different surfaces. This fixes the prior state where both pointed at the text-heavy OG card, which [Discover](https://developers.google.com/search/docs/appearance/google-discover) tells you not to use.

**For Discover, a cover must be** a well-cropped **landscape**, **≥1200px wide**, **16:9**, high-resolution, **not text-heavy**, not a logo. `max-image-preview:large` is already set site-wide (`BaseLayout.astro`). Use a **full URL** so it stays valid even when the origin env is unset:

```yaml
cover: "https://images.zmoki.xyz/starter/photo.jpg"
coverAlt: "Describe the photo"
```

Posts without a cover fall back to the OG card for `schema.image` and emit no image-sitemap entry.

## Reachability & CI caching

- **On the configured origin** (`site.imageOrigin` set): Astro downloads + optimizes at build in **every** environment (CI, host previews, production — the value is committed, so there's no per-environment gap). The origin **must be reachable** during the build; the cache below softens re-fetching.
- **Off the origin, or `imageOrigin: ""`**: a remote image renders **as-is, unoptimized** (a plain `<img>`, no `srcset`), with **no build-time fetch** — so those never fail a build on a down origin.
- **Caching:** Astro caches optimized images (and downloaded fonts) in **`node_modules/.astro`** — keyed by source content hash, so an unchanged image is never re-downloaded or re-processed. `npm ci` wipes `node_modules`, so CI restores this dir via `actions/cache` (see `.github/workflows/ci.yml`). Deploy hosts (Cloudflare Pages / Netlify / Vercel) reuse it through their own build cache.

## Verify

- `npm run build` with the origin authorized: post `<img>` points at `/_astro/*.webp` (responsive srcset), JSON-LD `image` = the cover, `/sitemap.xml` has an `<image:image>` for it, and `node_modules/.astro/assets/` fills with cached webp.
- Set `imageOrigin: ""` (or reference an off-origin URL): that image renders as a plain unoptimized `<img>` (no srcset), no fetch, build passes.
- `npm run check:sd` (after build) validates the JSON-LD.
