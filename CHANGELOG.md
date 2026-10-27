# Changelog

Notable changes to the starter. A copied site doesn't update itself: compare your `package.json` `version` with the sections below, and follow the PR links for the code.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions: [semver](https://semver.org/) as seen by a site built from the starter: **major** means you must change your own code or content, **minor** adds or improves something, **patch** fixes something.

## [Unreleased]

### Added

- A `people` collection: one yaml per person, referenced by id from a post's `author`, so a person is written once and a typo fails the build. A `profile` block turns on `/people/{id}/` with the person's posts, a sitemap entry, an OG card and `ProfilePage` JSON-LD; `/people/` lists everyone with one. ([#73](https://github.com/Zmoki/zmoki-astro-starter/pull/73))
  **Breaking:** replace each post's `author: { name, url, bio }` with a person's id, and add that person to `src/content/people/`.
- Structured data: a builder per type in `src/lib/structured-data.ts`; a visible breadcrumb with its `BreadcrumbList` on posts, resources and legal pages; `WebSite` and `Organization` on the home page for Google's site name; and `src/STRUCTURED-DATA.md`, listing every type and what is left out on purpose. ([#72](https://github.com/Zmoki/zmoki-astro-starter/pull/72))
- Social meta: a square 1200×1200 OG card beside each landscape one, listed as a second `og:image`; `twitter:title` and `twitter:description`; and a `head` slot on `BaseLayout` for page-specific tags. ([#71](https://github.com/Zmoki/zmoki-astro-starter/pull/71))
- Analytics you can check locally: with analytics off or no provider configured, a console provider logs every `track` and `identify` call. New site-wide events: `cta_clicked` for any link to a standing ask in `site.asks`, and every click event now carries a `location` (the closest `data-band`). `trackWhenVisible()` fires an event once an element is seen. `src/ANALYTICS.md` lists every event. ([#70](https://github.com/Zmoki/zmoki-astro-starter/pull/70))
- Markdown tables: a `: Caption` line right after a table becomes its `<caption>`, and every table scrolls inside its own keyboard-reachable box instead of widening the page on a phone. ([#68](https://github.com/Zmoki/zmoki-astro-starter/pull/68))
- Preview deploys are `noindex`: a PR or non-production branch build adds it to every page's robots meta, since a canonical pointing at production is only a hint. Amplify previews are now detected too, so their OG images use the preview's own URL. ([#67](https://github.com/Zmoki/zmoki-astro-starter/pull/67))

### Changed

- `og:type="article"` and the `article:*_time` tags now need the new `article` prop on `BaseLayout` (posts set it); resources and legal pages are `website`. The Twitter tags use `name=` instead of `property=`. Only the body and heading faces are preloaded (weights 400 and 600, upright). ([#71](https://github.com/Zmoki/zmoki-astro-starter/pull/71))
  **Breaking:** a layout of yours that should read as an article must pass `article` to `BaseLayout`.
- `resource_gate_viewed` fires when the gate form is half on screen, not on page load, so it counts people who saw the form. ([#70](https://github.com/Zmoki/zmoki-astro-starter/pull/70))
- The Markdown plugins moved from `astro.config.mjs` to `src/markdown/`, one TypeScript file each with unit tests (`npm test`, run in CI). The output is unchanged. ([#69](https://github.com/Zmoki/zmoki-astro-starter/pull/69))
- The image origin is never published. JSON-LD, the image sitemap and the feed point at a 1200px WebP under `/_astro`, the CSP drops the origin from `img-src`, and `npm run check:origin` fails CI if the origin appears in `dist/`. `<Image>` serves AVIF with a WebP fallback, and in `.mdx` Markdown `![]()` and raw `<img>` go through it, so they are optimized too (a raw `<img>` in `.md` becomes `![]()`). ([#66](https://github.com/Zmoki/zmoki-astro-starter/pull/66))
  **Breaking:** an `<img>` pointing at the origin outside content (in a component or page) is now blocked by the CSP; use `<Image>`.
- CI: a new push to a PR cancels its runs in flight, and Lighthouse restores CI's image and font cache instead of re-optimizing every image. The cache now holds only `node_modules/.astro/assets` and `fonts`, not the content store. ([#65](https://github.com/Zmoki/zmoki-astro-starter/pull/65))

### Fixed

- In `.md`, an `<img>` inside a one-line `<picture>…</picture>` is no longer turned into `![]()`. ([#69](https://github.com/Zmoki/zmoki-astro-starter/pull/69))

## [2.0.0] - 2026-10-26

### Changed

- Satori 0.63 for OG cards. It sizes boxes as content-box, like browsers, so the card root now sets `boxSizing: border-box`. ([#62](https://github.com/Zmoki/zmoki-astro-starter/pull/62))
- `prettier-plugin-astro` 1.1 and `prettier-plugin-tailwindcss` 0.8. The Astro plugin now formats markup like Prettier's HTML and JSX, so `.astro` files were reformatted; the built site is unchanged. ([#62](https://github.com/Zmoki/zmoki-astro-starter/pull/62))
- Docs and code comments pruned: `AGENTS.md` is a short map pointing to the skills, the skills are about a third shorter, and comments explain why instead of restating code. Stale statements fixed. ([#60](https://github.com/Zmoki/zmoki-astro-starter/pull/60))
- Dependencies updated: Astro 7.4, `@astrojs/mdx` 8, `markdown-it` 15. Remark/rehype plugins moved into `unified({...})`, as Astro 7.4 requires. ([#58](https://github.com/Zmoki/zmoki-astro-starter/pull/58))
- Node pinned in one place, `.node-version` (24.22.1); CI reads it too. GitHub Actions `setup-node` v7, `cache` v6. ([#58](https://github.com/Zmoki/zmoki-astro-starter/pull/58))

### Fixed

- Analytics: `resource_gate_viewed` and `resource_gate_submitted` send the Brevo form id as `form_id` instead of the form URL, and `contact_email_clicked` fires for every `mailto:` link, not only the first. Both change your analytics data. ([#61](https://github.com/Zmoki/zmoki-astro-starter/pull/61))
- RSS self link no longer has a double slash; the home trust chip, blog timeline script and `Platform` type each read one source; the typography and OG brand pages match the real code. ([#61](https://github.com/Zmoki/zmoki-astro-starter/pull/61))

### Security

- The CSP no longer allows inline scripts. Scripts are bundled files; the GTM loader is allowed by hash; provider hosts come from each provider's config module. ([#57](https://github.com/Zmoki/zmoki-astro-starter/pull/57))
  **Breaking:** rewrite any `<script is:inline>` you added as a bundled `<script>`, and move GTM Custom HTML tags to built-in tags or templates.
- `npm audit`: 38 → 12 findings, no criticals. The rest come only through Lighthouse CI. ([#58](https://github.com/Zmoki/zmoki-astro-starter/pull/58))

## [1.0.0] - 2026-07-05

The starter as of [#35](https://github.com/Zmoki/zmoki-astro-starter/pull/35):

- Astro 7, Tailwind 4, MDX; site settings in `src/site.config.ts`.
- `blog`, `resources` (with email-gated downloads) and `legal` collections.
- SEO: canonicals, per-page robots, sitemap with images, RSS, JSON-LD, build-time OG cards.
- Redirects and headers compiled for Cloudflare Pages, Netlify, Vercel or AWS Amplify.
- Swappable analytics (PostHog, GTM), forms (Brevo) and captcha (Turnstile), off by default.
- Brand system: design tokens, self-hosted fonts, one brand mark, a brand guide at `/-/astro/brand/`.
- CI checks for format, types, lint, generated files, JSON-LD, links, sitemap and Lighthouse.
- Task playbooks for AI agents in `.claude/skills/`.

[Unreleased]: https://github.com/Zmoki/zmoki-astro-starter/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/Zmoki/zmoki-astro-starter/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/Zmoki/zmoki-astro-starter/releases/tag/v1.0.0
