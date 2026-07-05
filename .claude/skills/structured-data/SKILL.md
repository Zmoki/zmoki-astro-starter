---
description: Add or edit structured data (schema.org / JSON-LD) so pages qualify for Google rich results. Use when the user wants rich results, rich snippets, a knowledge-panel, breadcrumbs, article/blog markup, an Organization or Profile card, FAQ/Q&A, or any schema.org markup for SEO.
---

# Structured data

Add and maintain schema.org **JSON-LD** so this site's pages are eligible for Google **rich results**. Google reads the markup to understand a page and can then render it with a richer appearance (article headline + image, breadcrumbs, an org knowledge panel, etc.).

**This skill follows Google's own documentation only.** The two canonical sources:

- **Policies & general guidelines** — <https://developers.google.com/search/docs/appearance/structured-data/sd-policies>
- **Feature gallery** (every supported type + link to its per-type reference) — <https://developers.google.com/search/docs/appearance/structured-data/search-gallery>

When you implement a specific type, **fetch that type's page from the gallery** for two things — don't work from memory, both change over time and the Google doc is the authority:

1. **Eligibility conditions** — most features only produce a rich result under specific conditions. Read the "eligibility"/"guidelines" section and confirm this site + this page qualifies **before** writing any markup. Notable gotchas:
   - **FAQ (`FAQPage`)** and **Q&A (`QAPage`)** rich results are limited to **authoritative government and health websites** — a personal/B2B site like this one will **not** get the rich result, so don't add them expecting one (the markup is otherwise harmless but pointless here).
   - Many features are region/language/device-limited or require the marked-up content to be genuinely present and interactive.
2. **Required + recommended properties** — the exact property names and shapes. Don't invent or reuse half-remembered ones.

## Non-negotiable rules (Google policies)

Every change must satisfy these, or Google can ignore the markup or issue a manual action:

- **Format: JSON-LD.** Google recommends JSON-LD (Microdata/RDFa are also parsed, but this site standardises on JSON-LD in a `<script type="application/ld+json">`). The whole site — including the `ImageObject` image-license metadata emitted by `src/components/Image.astro` for captioned content images — uses JSON-LD; there is no Microdata.
- **Markup must match visible content.** Never mark up information that isn't on the page and visible to the user. The JSON-LD must be a **true representation** of the page.
- **No misleading / fake / irrelevant content.** No fabricated reviews or ratings, no impersonating a person or org, nothing off-topic from the page's focus.
- **Complete.** Include **every required** property for the type, plus the **recommended** ones you can honestly fill — more valid detail = better eligibility.
- **On the page it describes.** Put a page's markup on that page (site-wide entities like `Organization` are the exception — see below). Duplicate pages should carry identical markup.
- **Most specific type.** Use the narrowest schema.org type that fits (`BlogPosting` over `Article` for a blog post, etc.).
- **Crawlable.** Don't block marked-up pages (or images referenced in them) via `robots.txt` / `noindex`. Note: pages under `/-/astro/*` and `/thank-you/*` are `noindex` (see `public/_headers`) — **do not** add rich-result markup to them; it can't be shown.
- **Images** referenced in markup must be crawlable/indexable and relevant.

## Which types fit this site

From the gallery, the types that map onto this starter's content model (`blog`, `resources`, `legal` collections + landing page):

| Google feature   | schema.org type          | Where it belongs here                                            |
| ---------------- | ------------------------ | ---------------------------------------------------------------- |
| **Article**      | `BlogPosting`            | Blog posts (`PostLayout.astro`) — headline, dates, author, image |
| **Breadcrumb**   | `BreadcrumbList`         | Any nested page (Home › Blog › Post) — build from the URL path   |
| **Organization** | `Organization`           | Site-wide, once (home page) — name, url, logo, `sameAs`, contact |
| **Profile Page** | `ProfilePage` + `Person` | The author "about" page — a page focused on one person           |
| **Video**        | `VideoObject`            | Posts embedding a real video (raw `<video>` in MDX)              |

`QAPage` / `FAQPage` exist in schema.org but their **rich result is gov/health-only** (see eligibility gotcha above) — don't reach for them on this site expecting a Search feature.

Before using any of these, open its gallery page and confirm **both** eligibility and the current required/recommended fields. Don't add a type the page's visible content can't back up.

**Source the values from `src/site.config.ts`**, never hard-code — it's the site's single source of truth. `site.name`, `site.domain`, `site.organization.*`, `site.contact.email`, `site.social.github` feed `Organization`/`Person` cleanly and keep the markup in sync with the rest of the chrome. The `BlogPosting` author is **per-post**: each post's frontmatter carries its own `author` (`{ name, url, bio }`) — there is no site-level author.

## How to add it in this codebase

Use the **`JsonLd.astro` component** (`src/components/JsonLd.astro`). It renders a `<script type="application/ld+json">`, accepts one schema object **or an array** of them, and escapes `<` so a stray `</script>` in a string can't break out. JSON-LD is valid anywhere in the document, so drop the component straight into the relevant layout or page — no need to touch `BaseLayout`'s `<head>`. The CSP in `public/_headers` already allows inline scripts (`script-src … 'unsafe-inline'`), so no header change is needed.

Build the schema object in the layout/page frontmatter, sourcing text from `src/site.config.ts` and **all absolute URLs from `siteUrls(Astro)`** (`src/lib/urls.ts`) — the same helper `BaseLayout` uses for the canonical link and og:image, so the structured data can never drift from the meta tags. Use `absoluteUrl(path)` (the production origin) for every structured-data URL. For a page's OG card image, reuse `getOgImage(pathname)` (`src/og/manifest.ts`) rather than hand-building a path. Then render `<JsonLd schema={…} />`. Example — a blog post in `PostLayout.astro` (fill fields from the gallery's Article reference after checking its eligibility; `author` is the post's own frontmatter author prop):

```astro
---
import JsonLd from "@/components/JsonLd.astro";
import { siteUrls } from "@/lib/urls";
import { getOgImage } from "@/og/manifest";
// …existing frontmatter…

const { absoluteUrl } = siteUrls(Astro);
const ogImage = await getOgImage(Astro.url.pathname);
const blogPostingLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: title,
  description,
  datePublished: publishDate.toISOString(),
  dateModified: contentModifiedDate.toISOString(),
  author: { "@type": "Person", name: author.name, url: author.url },
  image: absoluteUrl(ogImage.path),
  mainEntityOfPage: absoluteUrl(Astro.url.pathname),
};
---

<BaseLayout title={title} description={description}>
  <JsonLd schema={blogPostingLd} />
  <!-- …rest of the article… -->
</BaseLayout>
```

For a page needing two graphs (e.g. `BlogPosting` + `BreadcrumbList`), pass an **array**: `<JsonLd schema={[blogPostingLd, breadcrumbLd]} />`.

Always build absolute URLs with `siteUrls(Astro)`'s `absoluteUrl(path)` — `absoluteUrl(Astro.url.pathname)` for the current page — and keep dates ISO 8601. Both are what the Google references expect, and routing every URL through the one helper keeps canonical/og/meta/SD in lockstep.

## Verify (required before done)

Structured data isn't "done" until Google's own validators pass:

1. **Build** and serve, or push to production.
2. **`npm run check:sd`** — the repo's offline CI guard (`scripts/check-structured-data.ts`, runs after build in CI). It parses every JSON-LD block in `dist/` and fails on malformed/unsound markup (invalid JSON, missing `@context`/`@type`, unresolved `${…}`/`undefined` leftovers). This catches emit-time regressions **but does not** judge rich-result eligibility — it's a floor, not the Rich Results Test.
3. **Rich Results Test** — <https://search.google.com/test/rich-results> — enter the URL (or paste the rendered HTML). Confirm the intended type is **detected with no errors**; fix every error and every warning you can. (No CI API exists for this — it's manual/live.)
4. On the live site, **URL Inspection** in Google Search Console confirms Google can crawl and parse it.
5. Sanity-check that the marked-up facts are actually **visible on the page** — the core policy.

Report which type(s) you added, which page(s), and the Rich Results Test outcome. Do not claim eligibility for a rich result the test didn't confirm.

## Scope notes

- Don't add markup to `noindex` routes (`/-/astro/*`, `/thank-you/*`).
- One `Organization` for the whole site (home page), not repeated per page.
- If the user asks for a type not in the gallery, tell them Google doesn't support it as a rich result — schema.org may define it, but it won't produce a Search feature.
