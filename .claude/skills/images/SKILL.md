---
description: Set up or work on content images (png/jpg/webp) — remote-hosted originals, build-time optimization, responsive images, a post cover image, and image SEO (Google Discover / image sitemaps). Use when the user wants to add content images, host originals on a bucket/CDN (R2, S3…), add a post cover, cache optimized images in CI, or change how the <Image> component / Markdown images work.
---

# Content images

Content images (photos: png/jpg/webp) are optimized at build by `astro:assets`: resized, re-encoded to webp/avif, content-hashed into `dist/_astro/`. `image.layout: "constrained"` in `astro.config.mjs` makes them responsive by default. There's no runtime CDN transform.

Originals live in one of two places:

- **Committed**: a file in `src/images/`, imported. Builds never fetch.
- **Remote origin**: a bucket/CDN (e.g. an R2 bucket on a custom domain) set as `site.platform.imagesCDNHost` in `src/site.config.ts`. Astro downloads and optimizes at build. It's independent of `site.platform.deploy`, and it's committed config rather than an env var so every build sees it, including host previews.

Key files:

- `src/site.config.ts`: `site.platform.imagesCDNHost`, the one source for the origin. It also feeds `image.remotePatterns` in `astro.config.mjs` and the CSP `img-src`.
- `src/components/Image.astro`: the only image component. Wraps `astro:assets` and reads `site.config` directly.

## Enable a remote origin

1. Set `platform.imagesCDNHost: "https://images.example.com"` (a full URL) in `src/site.config.ts`.
2. Run `npm run build:headers` and commit `public/_headers`.
3. Upload originals (e.g. `wrangler r2 object put <bucket>/<key> --file=… --remote`) and reference them by full URL.

With `imagesCDNHost: ""`, commit images to `src/images/` and import them.

## Authoring

**`<Image>`**: `src` is an imported asset or a full remote URL. A remote `src` needs `width` and `height`. `priority` sets eager loading + `fetchpriority=high`; use it on the LCP/hero image only.

```astro
<Image src="https://images.example.com/photo.jpg" alt="…" width={1200} height={675} priority />

<Image src="https://images.example.com/photo.jpg" alt="…" width={1200} height={675}>
  A caption.
</Image>
```

- A caption (the default slot) wraps the image in `<figure>` + `<figcaption>`.
- Every image emits a schema.org `ImageObject` license JSON-LD (license, acquireLicensePage, creditText, copyrightNotice, creator) from `site.copyright.images.license` and `site.organization`. Override per image with `author={{ name, url }}` (credits a Person) and/or `licenseUrl="…"`.
- An image Astro can't optimize (off the origin) renders as a plain `<img>`.

**Markdown `![alt](…)`** uses Astro's built-in optimization: local files (`./photo.jpg`) and full URLs on a domain in `image.remotePatterns`.

## Post cover and Google Discover

A post's optional `cover` (`{ image, alt }` in blog frontmatter) is a real photo, separate from the OG card. It renders as the hero (LCP), becomes `BlogPosting.image`, and adds an `<image:loc>` to the image sitemap (`src/pages/sitemap.xml.ts`). Google Discover reads these. `og:image` stays the OG card.

```yaml
cover:
  image: "https://images.example.com/photo.jpg"
  alt: "Describe the photo"
```

- `image` and `alt` are both required when `cover` is set (schema-enforced).
- For Discover, use a landscape photo at least 1200px wide, 16:9, not text-heavy ([docs](https://developers.google.com/search/docs/appearance/google-discover)). `max-image-preview:large` is already set.
- Use a full URL on the origin so it gets optimized.
- Without `cover`, `BlogPosting.image` falls back to the OG card and there's no image-sitemap entry.

## Reachability and CI caching

- Images on the configured origin are optimized in every build, so the origin must be reachable at build time.
- Images off the origin (or with `imagesCDNHost: ""`) render as plain `<img>` with no build-time fetch, so a down host can't fail the build.
- Astro caches optimized images and fonts in `node_modules/.astro`. `npm ci` wipes it, so CI restores it with `actions/cache` (`.github/workflows/ci.yml`); deploy hosts use their own build cache.

## Verify

- `npm run build`: the cover `<img>` points at `/_astro/*.webp` with a srcset of distinct sizes, the JSON-LD `image` is the cover URL, `/sitemap.xml` has an `<image:image>`, and `node_modules/.astro/assets/` fills with webp files.
- `npm run check:sd` validates the JSON-LD.
