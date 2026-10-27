# Structured data

Every schema.org type the site emits, as JSON-LD. Change this file in the same commit as any type. Builders: `src/lib/structured-data.ts`; rendering: `src/components/JsonLd.astro`. How to add a type: the `/structured-data` skill.

## Emitted

| Type                       | Pages                                                                                                                    | Built in                                                  | Notes                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WebSite` + `Organization` | Home only                                                                                                                | `siteIdentity()`, in `src/pages/index.astro`              | Google's site name (`site.name`) and its publisher (`site.organization`). `logo` is `site.organization.logo` (the brand mark's 512px PNG by default).                                                               |
| `BlogPosting`              | Posts                                                                                                                    | `blogPosting()`, in `src/layouts/PostLayout.astro`        | `image` is the cover's published rendition, else the OG card. `publisher` is `site.organization`. The author's `url` is their profile page, else their own site.                                                    |
| `BreadcrumbList`           | Posts (Home › Blog › post), profiles (Home › People › person), resources, legal pages and the people index (Home › page) | `breadcrumbList()`, in `src/components/Breadcrumbs.astro` | Built from the same trail as the visible breadcrumb. Only the last crumb, the current page, has no `item`; any other crumb without a link fails the build.                                                          |
| `ProfilePage`              | People with a `profile` (`/people/{id}/`)                                                                                | `profilePage()`, in `src/pages/people/[...slug].astro`    | `mainEntity` is the Person: `jobTitle` (role), `worksFor` (company), `description` (bio), `image` (a rendition), `sameAs` (their site and socials).                                                                 |
| `ImageObject`              | Every page with a content image                                                                                          | `imageObject()`, in `src/components/Image.astro`          | License markup for the image; `contentUrl` is a rendition, never the image origin. External Markdown images get none (`MarkdownImage.astro`), nor do people's photos (`schema={false}`): the site doesn't own them. |

The site owner has one `@id` (`<domain>/#organization`) wherever it appears: the home page, every `publisher` and every image `creator`. Titles and descriptions may hold HTML (pages render them with `set:html`); the markup and the breadcrumb use their plain text.

No rich-result markup on `/-/astro/*` or `/thank-you/*`: they're `noindex`.

## Left out on purpose

- **`FAQPage`, `QAPage`**: Google limits these rich results to well-known government and health sites.
- **`Organization.email`, `sameAs`**: the home page shows a Contact link, not the address, and the site has no social profiles to list (`site.social.github` is the repository). Markup must match what the page shows.
- **`VideoObject`**: no video embed component yet. A raw `<video>` in MDX carries no markup.
- **`WebSite` `SearchAction`**: Google retired the sitelinks search box, and the site has no search.
