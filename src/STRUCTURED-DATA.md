# Structured data

Every schema.org type the site emits, as JSON-LD. Change this file in the same commit as any type. Builders: `src/lib/structured-data.ts`; rendering: `src/components/JsonLd.astro`. How to add a type: the `/structured-data` skill.

## Emitted

| Type                       | Pages                                                               | Built in                                                  | Notes                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WebSite` + `Organization` | Home only                                                           | `siteIdentity()`, in `src/pages/index.astro`              | Google's site name (`site.name`) and its publisher (`site.organization`), linked by `@id`. `logo` is `/icon-512.png`, rendered from the brand mark. |
| `BlogPosting`              | Posts                                                               | `blogPosting()`, in `src/layouts/PostLayout.astro`        | `image` is the cover's published rendition, else the OG card. `publisher` is `site.organization`.                                                   |
| `BreadcrumbList`           | Posts (Home › Blog › post), resources and legal pages (Home › page) | `breadcrumbList()`, in `src/components/Breadcrumbs.astro` | Built from the same array as the visible breadcrumb. The last crumb, the current page, has no `item`.                                               |
| `ImageObject`              | Every page with a content image                                     | `imageObject()`, in `src/components/Image.astro`          | License markup for the image; `contentUrl` is a rendition, never the image origin. External Markdown images get none (`MarkdownImage.astro`).       |

No rich-result markup on `/-/astro/*` or `/thank-you/*`: they're `noindex`.

## Left out on purpose

- **`FAQPage`, `QAPage`**: Google limits these rich results to well-known government and health sites.
- **`Organization.email`, `sameAs`**: the home page shows a Contact link, not the address, and the site has no social profiles to list (`site.social.github` is the repository). Markup must match what the page shows.
- **`ProfilePage`**: needs author pages, which come with the people collection (#46).
- **`VideoObject`**: no video embed component yet. A raw `<video>` in MDX carries no markup.
- **`WebSite` `SearchAction`**: Google retired the sitelinks search box, and the site has no search.
