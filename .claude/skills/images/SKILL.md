---
description: Set up or work on content images (png/jpg/webp) — remote-hosted originals, build-time optimization, responsive images, a post cover image, and image SEO (Google Discover / image sitemaps). Use when the user wants to add content images, host originals on a bucket/CDN (R2, S3…), add a post cover, cache optimized images in CI, or change how the <Image> component / Markdown images work.
---

# Content images

Content images (photos: png/jpg/webp) are optimized at build by `astro:assets`: resized, re-encoded to AVIF with a WebP fallback, content-hashed into `dist/_astro/`. `image.layout: "constrained"` in `astro.config.mjs` makes them responsive by default. There's no runtime CDN transform.

Originals live in one of two places:

- **Committed**: a file in `src/images/`, imported. Builds never fetch.
- **Remote origin**: a bucket/CDN (e.g. an R2 bucket on a custom domain) set as `site.platform.imagesCDNHost` in `src/site.config.ts`. Astro downloads and optimizes at build. It's independent of `site.platform.deploy`, and it's committed config rather than an env var so every build sees it, including host previews.

Key files:

- `src/site.config.ts`: `site.platform.imagesCDNHost`, the one source for the origin. It also feeds `image.remotePatterns` in `astro.config.mjs`.
- `src/components/Image.astro`: the only image component. Wraps `astro:assets` `<Picture>`.
- `src/lib/images.ts`: `publishedImageUrl(src)`, the URL of a 1200px WebP rendition under `/_astro`. Everything that hands out an image URL uses it.

## The origin is never published

The origin is a build input. A leaked origin gets crawled in place of the site's own URLs, and anyone can hotlink the full-size originals. So JSON-LD (`contentUrl`, `BlogPosting.image`) and the image sitemap use `publishedImageUrl`, the CSP `img-src` doesn't list the origin, and `npm run check:origin` (in CI, after the build) fails if the origin host appears in any file in `dist/`.

## Enable a remote origin

1. Set `platform.imagesCDNHost: "https://images.example.com"` (a full URL) in `src/site.config.ts`.
2. Upload originals (e.g. `wrangler r2 object put <bucket>/<key> --file=… --remote`) and reference them by full URL.

With `imagesCDNHost: ""`, commit images to `src/images/` and import them.

## Authoring

**`<Image>`**: `src` is an imported asset or a full remote URL. A remote `src` without `width` and `height` is measured at build. `priority` sets eager loading + `fetchpriority=high`; use it on the LCP/hero image only.

```astro
<Image src="https://images.example.com/photo.jpg" alt="…" width={1200} height={675} priority />

<Image src="https://images.example.com/photo.jpg" alt="…" width={1200} height={675}>
  A caption.
</Image>
```

- A caption (the default slot) wraps the image in `<figure>` + `<figcaption>`.
- Every image emits a schema.org `ImageObject` license JSON-LD (license, acquireLicensePage, creditText, copyrightNotice, creator) from `site.copyright.images.license` and `site.organization`. Override per image with `author={{ name, url }}` (credits a Person) and/or `licenseUrl="…"`.
- An image Astro can't optimize (off the origin) renders as a plain `<img>`, and its `contentUrl` is that URL.

**Markdown `![alt](…)`** works with local files (`./photo.jpg`) and origin URLs. In `.mdx`, every content route maps `img` to `src/components/MarkdownImage.astro` (`src/lib/content-components.ts`): local and origin images go through `<Image>`, any other URL stays a plain `<img>` with no license JSON-LD (the CSP blocks it unless you add its host to `img-src` in `src/headers/headers.config.ts`). In `.md`, Astro optimizes them itself (WebP only, no license JSON-LD). A raw `<img>` in content is handled the same way (`src/markdown/remark-img-tags.ts`): in `.mdx` it goes through `MarkdownImage` with its attributes; in `.md` an origin or relative one becomes `![]()`, keeping only `src`, `alt` and `title`. An `<img>` inside a `<picture>` is left alone, as is one in a component or page: on the origin, the CSP blocks it and `check:origin` fails.

## Post cover and Google Discover

A post's optional `cover` (`{ image, alt }` in blog frontmatter) is a real photo, separate from the OG card. It renders as the hero (LCP), and its published rendition becomes `BlogPosting.image` and the `<image:loc>` in the image sitemap (`src/pages/sitemap.xml.ts`). Google Discover reads these. `og:image` stays the OG card.

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
- Astro caches optimized images and fonts in `node_modules/.astro/assets` and `node_modules/.astro/fonts`. `npm ci` wipes them, so CI restores both with `actions/cache` (`.github/workflows/ci.yml`; `lighthouse.yml` restores the same cache). Cache only these two: the rest of `node_modules/.astro` is cheap to rebuild.
- Deploy hosts have their own build cache. Point it at the same two directories, and check they survive the host's install step, since `npm ci` deletes `node_modules`.

## Verify

- `npm run build`: the cover is a `<picture>` with an AVIF `<source>` and a `/_astro/*.webp` `<img>`, each with a srcset of distinct sizes; the JSON-LD `image` and `/sitemap.xml`'s `<image:loc>` are a `/_astro/*.webp` URL; `node_modules/.astro/assets/` fills with avif and webp files.
- `npm run check:origin` passes.
- `npm run check:sd` validates the JSON-LD.
