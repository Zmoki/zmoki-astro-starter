---
description: Add or edit structured data (schema.org / JSON-LD) so pages qualify for Google rich results. Use when the user wants rich results, rich snippets, a knowledge-panel, breadcrumbs, article/blog markup, an Organization or Profile card, FAQ/Q&A, or any schema.org markup for SEO.
---

# Structured data

Add and maintain schema.org JSON-LD so pages are eligible for Google rich results. Follow Google's documentation only:

- **Policies and general guidelines**: <https://developers.google.com/search/docs/appearance/structured-data/sd-policies>
- **Feature gallery** (every supported type, linking to its reference): <https://developers.google.com/search/docs/appearance/structured-data/search-gallery>

Before implementing a type, fetch its gallery page and read two things. Don't work from memory; both change.

1. **Eligibility.** Confirm this site and page qualify before writing markup. Many features are limited by region, language or device. `FAQPage` and `QAPage` rich results are limited to authoritative government and health sites, so this site won't get them.
2. **Required and recommended properties**, with their exact names and shapes.

## Google's rules

Break these and Google can ignore the markup or issue a manual action:

- **JSON-LD only.** The whole site uses `<script type="application/ld+json">`; there's no Microdata or RDFa.
- **Match visible content.** Mark up only what a visitor can see on the page.
- **Nothing misleading.** No fabricated reviews or ratings, no impersonation, nothing off-topic.
- **Complete.** Every required property, plus each recommended one you can honestly fill.
- **On the page it describes.** Site-wide entities like `Organization` are the exception. Duplicate pages carry identical markup.
- **Most specific type** (`BlogPosting` over `Article`).
- **Crawlable.** Pages and images in the markup must not be blocked. `/-/astro/*` and `/thank-you/*` are `noindex` (`src/headers/headers.config.ts`), so don't add rich-result markup there.

## What the site emits

`src/STRUCTURED-DATA.md` lists every type, the pages that carry it, and what is left out on purpose. Read it first; update it in the same commit as any change. Still to add: `ProfilePage` + `Person` on author pages (needs the people collection) and `VideoObject` for embedded videos.

If the user asks for a type not in the gallery, tell them it won't produce a Search feature, even if schema.org defines it.

## How to add it

**Builder.** Add one function per type to `src/lib/structured-data.ts`, next to `blogPosting`, `imageObject`, `breadcrumbList` and `siteIdentity`. It takes only facts the page shows and returns the schema object; the page passes it to `src/components/JsonLd.astro`, which takes one object or an array, escapes `<`, and works anywhere in the document. JSON-LD is data, so the CSP doesn't affect it.

**Values.** Take text from `src/site.config.ts` (`site.name`, `site.organization.*`, …); never hard-code it. A post's author comes from its own frontmatter (`{ name, url, bio }`); there's no site-level author.

**URLs.** The caller builds absolute URLs with `absoluteUrl(path)` from `siteUrls(Astro)` (`src/lib/urls.ts`), the same helper behind the canonical link and `og:image`, and passes them in. For a page's OG card, use `getOgImage(pathname)` (`src/og/manifest.ts`). For a content image, use `publishedImageUrl(src)` (`src/lib/images.ts`), never the origin URL. Dates are ISO 8601 (`.toISOString()`).

**Breadcrumbs.** Don't build `BreadcrumbList` by hand: `<Breadcrumbs crumbs={[{ name: "Home", href: "/" }, …, { name: title }]} />` renders the visible trail and its markup from one array. The last crumb is the current page, with no `href`. The brand guide's specimen is hand-copied markup, so the noindex page carries no markup.

`PostLayout.astro` is the worked example: `blogPosting({...})` plus `<Breadcrumbs>`.

## Verify (required)

1. Build, then serve or deploy.
2. `npm run check:sd` (`scripts/check-structured-data.ts`, also in CI) parses every JSON-LD block in `dist/` and fails on invalid JSON, missing `@context`/`@type`, or leftover `${…}`/`undefined`. It doesn't judge eligibility.
3. **Rich Results Test**: <https://search.google.com/test/rich-results>. Enter the URL or paste the rendered HTML. The intended type must be detected with no errors; fix every warning you can. It's manual; there's no CI API.
4. On the live site, **URL Inspection** in Google Search Console confirms Google can crawl and parse it.
5. Check that every marked-up fact is visible on the page.

Report the types and pages you changed and the Rich Results Test outcome. Don't claim eligibility the test didn't confirm.
