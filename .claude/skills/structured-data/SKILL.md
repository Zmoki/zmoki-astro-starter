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

## Types that fit this site

| Google feature   | schema.org type          | Where it belongs                                           |
| ---------------- | ------------------------ | ---------------------------------------------------------- |
| **Article**      | `BlogPosting`            | Blog posts. Already emitted by `PostLayout.astro`          |
| **Breadcrumb**   | `BreadcrumbList`         | Nested pages (Home › Blog › Post), built from the URL path |
| **Organization** | `Organization`           | Once, on the home page: name, url, logo, `sameAs`, contact |
| **Profile Page** | `ProfilePage` + `Person` | An author "about" page focused on one person               |
| **Video**        | `VideoObject`            | Posts embedding a real video (raw `<video>` in MDX)        |

`src/components/Image.astro` also emits an `ImageObject` license block for every content image (see `/images`).

If the user asks for a type not in the gallery, tell them it won't produce a Search feature, even if schema.org defines it.

## How to add it

**Values.** Take text from `src/site.config.ts` (`site.name`, `site.domain`, `site.organization.*`, `site.contact.email`, `site.social.github`); never hard-code it. A post's author comes from its own frontmatter (`{ name, url, bio }`); there's no site-level author.

**URLs.** Build every absolute URL with `absoluteUrl(path)` from `siteUrls(Astro)` (`src/lib/urls.ts`), the same helper behind the canonical link and `og:image`. Use `absoluteUrl(Astro.url.pathname)` for the current page. For a page's OG card, use `getOgImage(pathname)` (`src/og/manifest.ts`). For a content image, use `publishedImageUrl(src)` (`src/lib/images.ts`), never the origin URL. Dates are ISO 8601 (`.toISOString()`).

**Render** with `src/components/JsonLd.astro`. It takes one schema object or an array, escapes `<`, and works anywhere in the document, so no `<head>` edit is needed. JSON-LD is data, so the CSP doesn't affect it.

`PostLayout.astro` (its `blogPostingLd`) is the worked example. The pattern, e.g. a breadcrumb added next to it:

```astro
---
import JsonLd from "@/components/JsonLd.astro";
import { siteUrls } from "@/lib/urls";

const { absoluteUrl } = siteUrls(Astro);
// Check the fields against the gallery's Breadcrumb reference.
const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog/") },
    { "@type": "ListItem", position: 3, name: title },
  ],
};
---

<JsonLd schema={[blogPostingLd, breadcrumbLd]} />
```

Pass an array for several graphs on one page, or a single object.

## Verify (required)

1. Build, then serve or deploy.
2. `npm run check:sd` (`scripts/check-structured-data.ts`, also in CI) parses every JSON-LD block in `dist/` and fails on invalid JSON, missing `@context`/`@type`, or leftover `${…}`/`undefined`. It doesn't judge eligibility.
3. **Rich Results Test**: <https://search.google.com/test/rich-results>. Enter the URL or paste the rendered HTML. The intended type must be detected with no errors; fix every warning you can. It's manual; there's no CI API.
4. On the live site, **URL Inspection** in Google Search Console confirms Google can crawl and parse it.
5. Check that every marked-up fact is visible on the page.

Report the types and pages you changed and the Rich Results Test outcome. Don't claim eligibility the test didn't confirm.
