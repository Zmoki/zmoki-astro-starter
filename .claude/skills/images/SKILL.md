---
description: Set up or work on content images (png/jpg/webp) — remote-hosted originals, build-time optimization, responsive images, a post cover image, and image SEO (Google Discover / image sitemaps). Use when the user wants to add content images, host originals on a bucket/CDN (R2, S3…), add a post cover, cache optimized images in CI, or change how the <Image> component / Markdown images work.
---

# Content images

How the starter serves **content images** (photos: png/jpg/webp). The canonical summary is in `AGENTS.md` → **Content images**.

## The model — build-time optimization

Every content image is **optimized at build by Astro** (`astro:assets`): resized, re-encoded to `webp`/`avif`, content-hashed into `dist/_astro/`, and served by the deploy host. `image.layout: "constrained"` (astro.config.mjs) makes them responsive by default. There is **no runtime CDN transform**.

Originals come from either:

- **Committed** — a file in `src/images/`, imported. No external dependency; builds never fetch.
- **Remote origin** — host originals on a bucket/CDN (e.g. an **R2 bucket on a custom domain**), set **`site.platform.imagesCDNHost`** (a full URL) in `src/site.config.ts`, and Astro downloads + optimizes them at build. Keeps binaries out of git. Decoupled from `site.platform.deploy`. It's committed config (not an env var) because it's non-secret and must reach every build environment — including host previews, which often don't expose env vars.

### Key files

- **`src/site.config.ts`** — `site.platform.imagesCDNHost`, the single source of truth for the origin (also feeds the CSP `img-src`, so they can't drift).
- **`src/components/Image.astro`** — the one component; wraps `astro:assets`. Reads `site.config` directly (there is no separate image config module). Emits a schema.org `ImageObject` license JSON-LD for **every** image; a caption (default slot) adds a `<figure>` + `<figcaption>`. An image it can't optimize (an off-origin remote) renders a plain `<img>` — no repeated-URL srcset, no build-time fetch.
- **`astro.config.mjs`** — `image.layout` + `image.remotePatterns` authorizing the origin (from `site.platform.imagesCDNHost`).

## Enable a remote origin

1. Set `imagesCDNHost` in `src/site.config.ts` (`platform.imagesCDNHost: "https://images.example.com"`). That one value authorizes build-time optimization and drives the CSP.
2. `npm run build:headers` and commit `public/_headers` (now includes the origin).
3. Host originals there (e.g. `wrangler r2 object put <bucket>/<key> --file=… --remote`) and reference them by **full URL**.

`imagesCDNHost: ""` ⇒ commit images to `src/images` and import them instead.

## Authoring — two ways

1. **`<Image>`** — `src` is an imported asset **or** a full remote URL (a remote src needs `width` + `height` — Astro can't infer them). Every image emits a schema.org `ImageObject` license JSON-LD (license/acquireLicensePage/creditText/copyrightNotice/creator, from `site.copyright.images.license` + `site.organization`). `priority` = eager + `fetchpriority=high` (LCP/hero only).
   - **No caption** → a plain responsive `<img>`:
     ```astro
     <Image src="https://images.example.com/photo.jpg" alt="…" width={1200} height={675} priority />
     ```
   - **With a caption** (default slot) → also wraps it in a `<figure>` + `<figcaption>`:
     ```astro
     <Image src="https://images.example.com/photo.jpg" alt="…" width={1200} height={675}>
       A caption.
     </Image>
     ```
   The ImageObject `creator` defaults to the site **Organization**; override per image with `author={{ name, url }}` (emits a Person) and/or `licenseUrl="…"` to override the license.
2. **Plain Markdown `![alt](…)`** — Astro's built-in optimization: local (`./photo.jpg`) images, and full remote URLs whose domain is authorized in `image.remotePatterns`.

## Post cover & Google Discover

A post's optional **`cover`** (`{ image, alt }`, blog frontmatter) is a real **non-text photograph** (distinct from the branded OG card). It renders as the post's hero (LCP) and drives the schema.org **`BlogPosting.image`** + the **image-sitemap** `<image:loc>` (`src/pages/sitemap.xml.ts`, namespace `sitemap-image/1.1`) — the primary image Google Discover reads. **`og:image` stays the OG card** (social); the two serve different surfaces.

Both `cover.image` and `cover.alt` are required when `cover` is set (the schema enforces it, so the primary image is never decorative). **For Discover**, use a well-cropped landscape **≥1200px wide, 16:9, not text-heavy** ([docs](https://developers.google.com/search/docs/appearance/google-discover)); `max-image-preview:large` is already set. Use a **full URL** on the origin so it's optimized:

```yaml
cover:
  image: "https://images.example.com/photo.jpg"
  alt: "Describe the photo"
```

No `cover` ⇒ `schema.image` falls back to the OG card and no image-sitemap entry is emitted.

## Reachability & CI caching

- **On the configured origin**: optimized at build in **every** environment (the value is committed) — the origin **must be reachable** during the build (the cache below softens re-fetching).
- **Off the origin, or `imagesCDNHost: ""`**: the image renders as a plain unoptimized `<img>` (no `srcset`), with **no build-time fetch** — never fails a build on a down origin.
- **Caching:** Astro caches optimized images + fonts in **`node_modules/.astro`** (keyed by content hash). `npm ci` wipes `node_modules`, so CI restores it via `actions/cache` (`.github/workflows/ci.yml`); deploy hosts reuse it via their own build cache.

## Verify

- `npm run build`: the cover `<img>` points at `/_astro/*.webp` (distinct srcset), JSON-LD `image` = the cover URL, `/sitemap.xml` has an `<image:image>`, `node_modules/.astro/assets/` fills with webp.
- `npm run check:sd` validates the JSON-LD.
