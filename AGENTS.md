# AGENTS.md — zmoki-astro-starter technical spec

> Canonical AI instructions for this project. CLAUDE.md imports this. Cursor and other tools read it directly.

---

## Project overview

An Astro starter for personal websites — posts, resources, and legal pages. Built from zmoki.xyz and genericized into a reusable template. Everything site-specific lives in **`src/site.config.ts`**; the rest is the reusable shell.

When starting a new site from this template, see **`SETUP.md`** for the checklist.

---

## Tech stack

| Layer               | Tool                                                                       | Version                       |
| ------------------- | -------------------------------------------------------------------------- | ----------------------------- |
| Framework           | Astro                                                                      | ^7.0                          |
| Language            | TypeScript                                                                 | via Astro                     |
| Styling             | Tailwind CSS (@tailwindcss/vite) + @tailwindcss/typography                 | ^4                            |
| Content             | MDX via @astrojs/mdx                                                       | ^7                            |
| Fonts               | Sans (headings + body) + mono (code) — families in `src/design-tokens.mjs` | Astro Fonts API (self-hosted) |
| Analytics           | Provider-agnostic; PostHog + Google Tag Manager built in                   | posthog-js                    |
| Email/Forms         | Provider-agnostic; Brevo built in                                          | —                             |
| OG images           | Satori + resvg (build-time PNG endpoint)                                   | —                             |
| RSS                 | @astrojs/rss                                                               | —                             |
| Syntax highlighting | Shiki, theme: `catppuccin-mocha` (dark, WCAG-AA contrast)                  | —                             |
| Performance         | Lighthouse CI (@lhci/cli)                                                  | —                             |
| Formatting          | Prettier + prettier-plugin-astro + prettier-plugin-tailwindcss             | —                             |

Dev server default port is **4321**. When running multiple worktrees simultaneously, derive a stable per-worktree port with:

```bash
PORT=$(( 4300 + $(echo "$PWD" | cksum | cut -d' ' -f1) % 100 ))
```

Project skills live in `.claude/skills/`:

- `/run` — launch the Astro dev server (`.claude/skills/run/SKILL.md`)
- `/brand` — work on brand guidelines end to end: colors, typography, voice & tone, and the internal brand pages (`.claude/skills/brand/SKILL.md`)
- `/redirects` — add or edit URL redirects (`.claude/skills/redirects/SKILL.md`)
- `/og-images` — customize the OG / social-share image cards (`.claude/skills/og-images/SKILL.md`)
- `/update-deps` — update npm packages + GitHub Actions in staged, verified commits (`.claude/skills/update-deps/SKILL.md`)
- `/analytics` — enable/add/swap analytics providers or add a tracked event (`.claude/skills/analytics/SKILL.md`)
- `/structured-data` — add/edit schema.org JSON-LD for Google rich results, per Google's docs (`.claude/skills/structured-data/SKILL.md`)
- `/images` — content images: remote-hosted originals + build-time optimization, responsive images, post cover/hero, and image SEO (Discover / image sitemaps) (`.claude/skills/images/SKILL.md`)

**These are AI-tool-agnostic task playbooks.** Each `SKILL.md` (and its `references/*.md`) is plain, vendor-neutral Markdown — the `/name` shortcut is Claude Code's way of loading it on demand, but any AI coding tool can use them by reading the file directly. Before doing one of the kinds of work above, **read the matching `.claude/skills/<name>/SKILL.md` first** and follow it. They're the source of truth for their topic; the sections below summarize, they don't replace.

---

## Scripts

```
npm run dev              # dev server
npm run build            # production build (also emits OG images to dist/og/)
npm run timeline:blog    # generate blog-timeline.csv
npm run favicons         # rasterize public/brand-mark.svg → the favicon set (.ico + apple-touch + PWA PNGs)
npm run build:redirects  # compile src/redirects/*.csv → host redirect artifact (runs automatically before build)
npm run check:redirects  # CI guard: rebuild redirects and fail if the committed artifact drifted
npm run build:headers    # compile src/headers/headers.config.ts → host header artifact (runs automatically before build)
npm run check:headers    # CI guard: rebuild headers and fail if the committed artifact drifted
npm run check:sd         # CI guard: validate schema.org JSON-LD in dist/ (run after build)
npm run check:links      # CI guard: broken internal links + hard-coded self-origin links in dist/ (run after build)
npm run check:sitemap    # CI guard: every indexable page is in sitemap.xml + no stale entries (run after build)
npm run lhci:mobile      # Lighthouse CI mobile
npm run lhci:desktop     # Lighthouse CI desktop
npm run format           # Prettier format all files
npm run format:check     # Prettier check (used in CI)
npm run check            # TypeScript type check (astro check)
npm run lint             # ESLint
```

## CI

GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push and PR to `main`:

1. **Format check** — `npm run format:check`
2. **Type check** — `npm run check`
3. **Lint** — `npm run lint`
4. **Redirects drift check** — `npm run check:redirects` (rebuilds the redirect artifact and fails if it differs from what's committed)
5. **Headers drift check** — `npm run check:headers` (rebuilds the header artifact and fails if it differs from what's committed)
6. **Build** — `npm run build`
7. **Structured data check** — `npm run check:sd` (runs after build; parses every schema.org JSON-LD block in `dist/` and fails on malformed/unsound markup — see `/structured-data`)
8. **Internal link check** — `npm run check:links` (runs after build; two rules over `dist/`: (a) every relative internal `<a href>` must resolve to a built file — no 404s; redirect sources and off-site links are skipped; (b) no `<a href>` may hard-code our own origin — the production URL or a preview deploy for the configured host — those must be relative paths. Preview-host detection is shared with the OG image URLs via `src/lib/deploy.ts`.)
9. **Sitemap check** — `npm run check:sitemap` (runs after build; three rules over `dist/`, all built on the principle _an indexable page belongs in the sitemap, and only such pages do_ — to keep a page out, mark it noindex:
   - **coverage** — every built, indexable HTML page appears in `sitemap.xml`. Catches a collection not registered in `src/lib/page-collections.ts` (or a standalone page not wired into `src/pages/sitemap.xml.ts`), whose pages would otherwise build but silently never get indexed. Noindex pages (per `<meta name="robots">` or an `X-Robots-Tag` rule in `src/headers/headers.config.ts`) are skipped.
   - **no noindex in the sitemap** — the inverse: no `<loc>` may point at a noindex page.
   - **resolvability** — every `<loc>` resolves to a built _file_, so a stale/renamed entry fails instead of 404-ing.

   Standalone-page metadata completeness (`title`+`description` set together) is validated separately at **build time** in `src/og/manifest.ts`, since a plain-node script can't import an `.astro` page.

No GitHub secrets are required for the build step: provider config (PostHog, GTM, Turnstile, Brevo, the image origin) is all committed, not env vars — see **Analytics**/**Captcha**/**Forms** below. Analytics/captcha default off; the `Build` step's `env:` turns them on only when `github.ref == 'refs/heads/main'` (a push to `main`, not a PR), so this build reflects what production actually ships.

A separate `lighthouse.yml` workflow runs Lighthouse CI on every push and PR to `main`; it never sets those env vars, so Lighthouse always audits with analytics/captcha off (they default off) and never fires real tracking or trips Turnstile's domain check.

---

## Type checking & linting

**Type check** — `npm run check` runs `astro check`, which wraps the TypeScript language server and handles `.astro` files correctly (plain `tsc` does not).

**Linting** — `npm run lint` runs ESLint with:

- `eslint-plugin-astro` — Astro-specific rules
- `@typescript-eslint` — TypeScript rules

Config: `eslint.config.mjs`. Ignores: `dist/`, `.astro/`, `node_modules/`, `.claude/`.

Conventions:

- Prefix intentionally unused function params/vars with `_` to satisfy `no-unused-vars`
- Vendor scripts (e.g. `analytics/posthog.astro`) use `/* eslint-disable */` inline

---

## Formatting

Prettier is configured in `.prettierrc` with two plugins:

- **`prettier-plugin-astro`** — parses `.astro` files
- **`prettier-plugin-tailwindcss`** — sorts Tailwind classes automatically

Key rules:

- `.md` / `.mdx` files: `proseWrap: preserve` (don't reflow markdown prose)
- `.astro` files: use the `astro` parser

Run formatter:

```bash
npm run format
```

**Always format before committing.** Tailwind class order is enforced by the plugin — do not reorder classes manually.

---

## Site configuration (`src/site.config.ts`)

The single source of truth for everything personal to a site: domain, name (also the OG `og:site_name` + RSS feed title), default description, top-nav links (`nav`), the site owner (`organization`), contact email, the source-repo link (`social.github`), copyright year, and the deploy target (`platform.deploy`, which drives the redirects build). Layouts, the landing page, RSS, and the sitemap all read from it. To rebrand a new site, this is the main file you edit (`astro.config.mjs`'s `site` reads `site.domain` from it; plus the palette in `src/design-tokens.mjs`, and the favicon). The internal `/-/astro/brand/` pages pull the site name from `site.name`, but their content (specimens, voice, house style) is otherwise edited directly rather than driven by the config.

---

## Content collections (`src/content.config.ts`)

Collections use the **Content Layer API** — each is defined with a `glob()`
loader (`astro/loaders`) pointing at `src/content/<collection>/`. Entries expose
`.id` (the slug, from the filename) and are rendered with `render(entry)`
imported from `astro:content` (not the legacy `entry.render()`).

**The schemas themselves live in `src/content.config.ts` (zod-enforced) — read them there; don't mirror them here.** There are three collections — **`blog`** (posts), **`resources`** (downloadable resources + external links), and **`legal`** (privacy, terms). What the schema _can't_ tell you, and you need to know:

- **Filenames & order** — `blog` posts are `src/content/blog/{order}-{slug}.{md,mdx}`. `order` (higher = newer) drives prev/next post nav and blog-list ordering.
- **Rule:** whenever you edit content in any collection file (`blog`, `resources`, `legal`), bump its `contentModifiedDate` to today's date.
- **`resources` `type`** — `"page"` renders a `/resources/{slug}/` page; `"link"` is just an external link (uses `url`) with no page of its own.
- **`resources` lead-magnet gate** — a resource carrying both a `form` and an `asset` captures an email via the site's form provider (Brevo by default, provider-agnostic — see **Forms**), which emails the asset and redirects to `/thank-you/resources/{slug}/`; the thank-you page _also_ surfaces the `asset` as a direct download so delivery doesn't depend solely on the email. Host the asset externally (R2, S3, a CDN/bucket, Brevo's own hosting) — don't commit binaries. This is not access control: a public URL is reachable by anyone who has it.
- **`robots` (per entry, all collections)** — an optional array of robots directives (`["noindex"]`, `["noindex", "nofollow"]`, `["noarchive"]`, …, per [Google's spec](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)). They're merged into the page's `<meta name="robots">` (alongside the site default `max-image-preview:large`); when they imply noindex (`noindex`/`none`) the page is also dropped from the sitemap. Omit to index normally. This is the **content-level** noindex; the **path-level** equivalent is `X-Robots-Tag` in `src/headers/headers.config.ts`. Both are honored by the sitemap via `src/lib/robots.ts` (`isNoindex`) + `src/lib/noindex.ts`.

### Page collections & the sitemap registry

The collections that render one page per entry are declared once in **`src/lib/page-collections.ts`** (`pageCollections`: collection name → URL base + optional entry filter + optional OG byline). `getPageRecords()` projects them into normalized `PageRecord`s, and **two consumers iterate that one list**: **`src/pages/sitemap.xml.ts`** and the **OG image manifest `src/og/manifest.ts`** both call `getPageRecords()`. So **adding a new page section is one entry there — both the sitemap and the OG cards pick it up automatically** (no separate edit to either to forget). Adding a section is still: (1) define the collection in `src/content.config.ts` (include `title`/`description`/`publishDate`/`contentModifiedDate`/`robots`), (2) create its `[...slug].astro` route, (3) register it in `page-collections.ts`. The two non-collection pages (home `/`, blog index `/blog/`) **each export a `meta` object from their own frontmatter** (`src/pages/index.astro`, `src/pages/blog/index.astro`) — `{ path, ogKey, title?, description?, publishDate?, contentModifiedDate? }`, typed by `src/standalone-page.d.ts` (a global ambient type — no import needed). The page is the single source: its own `BaseLayout` props, its OG card (`src/og/manifest.ts`), and the sitemap `<lastmod>` all read that exported `meta`, so page ↔ card ↔ sitemap can't drift. `title`+`description` are optional but must be set together (validated at build in the manifest); omit both to fall back to site defaults + the default OG card. The sitemap excludes noindex pages (both content-level `robots` and path-level headers, above); **CI's `npm run check:sitemap` fails the build if an indexable page is missing from the sitemap** (see CI step 9), so forgetting step 3 is a red build, not a silent SEO gap.

---

## URL structure

```
/                        # landing page
/blog/                   # blog list (all posts)
/blog/{slug}/            # individual post (PostLayout)
/resources/{slug}/       # resource page (ResourceLayout)
/legal/{slug}/           # privacy, terms (LegalLayout)
/thank-you/{slug}/       # post-form confirmation pages
/rss.xml                 # RSS feed
/sitemap.xml             # sitemap
/og/{...path}.png        # generated OG images (build-time endpoint, dist/og/)
/-/astro/health          # health check — returns "ok" + short commit hash
/-/astro/brand/          # brand design system home (internal, noindex)
/-/astro/brand/{page}/   # brand references (BrandLayout): color, typography,
                         #   forms, components, voice, og
/site.webmanifest        # web app manifest (dynamic endpoint)
```

---

## Layouts

### `BaseLayout.astro`

Props are defined in the file; the one with non-obvious behavior is **`wide`** (default `false`) — `true` gives a full-width `<main>` for landing-page sections that own their own containers, `false` a centered `max-w-3xl` container for articles. (`description` defaults to `site.description`.)

Classic landing-page chrome on every page: a sticky top nav (the **brand mark** — `public/brand-mark.svg` — linking home + `site.nav` links + a "Get started" button), a single-column `<main>`, and a footer (copyright + Privacy/Terms/Contact/Source). The nav links, CTA, and footer read from `src/site.config.ts`; the logo is the brand mark (see Favicons & brand mark).

Sets `<html lang="en">`, loads the self-hosted fonts (see Components → Fonts), meta/OG tags, analytics (`Analytics.astro`), canonical URL. Every absolute URL it emits — canonical, `og:url`, `og:image`/`twitter:image` — comes from **`siteUrls(Astro)`** (`src/lib/urls.ts`), the single source of truth for URL construction; the JSON-LD structured data (`PostLayout`) uses the same helper, so canonical/OG/meta/SD can't drift apart. `siteUrls` exposes two origins and two builders: **`siteOrigin`** (production, from astro.config `site`) with **`absoluteUrl(path)`** — used for canonical + RSS + SD; **`currentOrigin`** with **`currentAbsoluteUrl(path)`** — used for OG image URLs so cards resolve against the current deployment: the dev server under `astro dev`, the current preview deployment on a preview build (host-agnostic — detected from `site.platform.deploy`'s native build env: Cloudflare `CF_PAGES_URL`, Netlify `DEPLOY_PRIME_URL`, Vercel `VERCEL_URL`), else production. The canonical link itself is controlled by BaseLayout's `canonical` prop (default `true` = the page's own URL; `false` = omit, e.g. the 404 page; a URL string = point elsewhere, e.g. a cross-posted post whose `canonical` frontmatter names the source). The OG image URL + `alt` per page come from the manifest via `getOgImage(pathname)` (see OG image generation below); pages without their own card fall back to the site default.

### `PostLayout.astro`

Wraps `BaseLayout`. Props: `title`, `description`, `publishDate`, `contentModifiedDate`, `author`, `prevPost?`, `nextPost?`. The `author` (`{ name, url, bio }`) comes from the post's own frontmatter — it drives the byline, the "Written by" bio, and the schema.org `author`. Shows article header with publish/modified dates, prose content, author bio, prev/next navigation. The home page (`src/pages/index.astro`) is a standalone landing page using `BaseLayout` with `wide`; the blog list lives at `src/pages/blog/index.astro`.

### `ResourceLayout.astro`, `LegalLayout.astro`

Exist but follow the same `BaseLayout` wrapper pattern.

### `BrandLayout.astro`

Standalone layout for the internal brand pages under `/-/astro/brand/`. Like `BaseLayout` but **without** the sidebars/header/footer chrome — a single-column canvas. Sets `noindex`, loads the same fonts, uses `bg-zmoki-cream-100` / `text-zmoki-stone-900`. Props: `title`, `description?`.

---

## Color system

All colors come from **`src/design-tokens.mjs`** — the single source of truth, imported by both `tailwind.config.mjs` (to generate utilities) and the brand reference page. It re-exports Tailwind's default color palettes under the **`zmoki-`** prefix, so every group is a namespaced full 50→950 scale: `zmoki-slate`, `zmoki-gray`, `zmoki-zinc`, `zmoki-neutral`, `zmoki-stone`, plus the chromatic ramps (`zmoki-red`, `zmoki-orange`, … `zmoki-rose`). Templates use these `zmoki-*` utility classes; **no inline hex** — the one exception is host-chrome literals that must not re-theme (e.g. the macOS traffic-light dots on the home-page terminal mockup). Live reference: `/-/astro/brand/color/`.

The starter palette is a **bright, warm, minimal B2B** look: an ivory canvas, white cards with soft borders and gentle shadows, and a single **indigo** accent. Templates reach for **`zmoki-cream`** (custom warm-ivory scale), **`zmoki-stone`** (warm greys — text, borders), and **`zmoki-indigo`** (accent) — every other chromatic group is generated and available, but unused until you want it.

### Conventions (warm-indigo starter)

| Usage                         | Class                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| Accent — links, buttons, CTAs | `zmoki-indigo-600` (hover `zmoki-indigo-700`, focus ring `zmoki-indigo-500`)                        |
| Ink — text & headings         | `zmoki-stone-900`                                                                                   |
| Meta / secondary text         | `zmoki-stone-500` (or `zmoki-stone-600`)                                                            |
| Page background               | `zmoki-cream-100` (warm ivory)                                                                      |
| Cards & panels                | `white` + `border border-zmoki-stone-200` + `rounded-2xl` + `shadow-sm`                             |
| Soft accent fill / callout    | `bg-zmoki-indigo-50` + `border-zmoki-indigo-100`; pills `bg-zmoki-indigo-100 text-zmoki-indigo-700` |
| Input borders                 | `border-zmoki-stone-300` / `border-zmoki-stone-400`                                                 |
| Inverse text on accent fills  | `text-white`                                                                                        |

`zmoki-cream` is a **custom** scale (not a Tailwind default) defined in `src/design-tokens.mjs` — the worked example of adding a custom palette. To shift the accent to a different chromatic group, swap `zmoki-indigo` on the relevant elements.

### Changing the palette (re-skin)

When the user wants to shift the site to a different accent (e.g. "make it green/blue"), there are two paths — pick based on whether the target color is a Tailwind default:

1. **Built-in Tailwind color** — no token edits needed; every group is already generated. To swap the accent site-wide, find/replace `zmoki-indigo` → the new group (e.g. `zmoki-emerald`) across `src/`. To recolor the canvas or greys, swap `zmoki-cream` / `zmoki-stone` similarly. Confirm scope with the user before a blanket find/replace.
2. **Custom brand color** (not in Tailwind's defaults) — define a full `50`→`950` scale in `customPalettes` inside **`src/design-tokens.mjs`** (the `zmoki-cream` scale already there is the worked example). Build the scale from the user's base color on **colorhexa.com** (the user's preferred tool): enter the base hex as `500`, then use the **"Shades and Tints"** section — lighter tints fill `400 300 200 100 50`, darker shades fill `600 700 800 900 950`. Pick by eye for even, Tailwind-like spacing. The new scale auto-generates `zmoki-<name>-*` utilities and auto-appears on `/-/astro/brand/color/` (via the `customPaletteNames` export). Then point the relevant templates at it.

**Combinations must meet at least WCAG AA.** Every text/background pair the palette produces — ink `zmoki-stone-900` on `zmoki-cream-100` / `white`, muted `zmoki-stone-500` on white, white text on accent fills (nav CTA, hero, CTA band, buttons = `zmoki-indigo-600`), borders/focus rings — needs **≥ 4.5:1** for normal text (**≥ 3:1** for large text and UI/graphical elements). Verify pairs with Figma's checker: <https://www.figma.com/color-contrast-checker/>. A fill carrying white text must be dark enough to pass (usually `-600`/`-700`); the mid/light shades of bright hues fail, so go darker or use dark text on a light fill. If a pair fails, fix the shade — don't ship it.

After any palette change, run `npm run build` and check `/-/astro/brand/color/`.

Soft + bright is the global default in `tailwind.config.mjs`: the `borderRadius` and `boxShadow` scales are left at Tailwind's defaults, so `rounded-*` gives real rounded corners and `shadow-*` gives subtle elevation. Cards/panels are defined by a soft `border border-zmoki-stone-200` **plus** `shadow-sm` and a rounded corner — not a hard border. `tailwind.config.mjs` defines an `ink = twColors.stone[900]` constant and an `accent = twColors.indigo[600]` constant for the prose/link CSS that can't reference a utility class.

**Tailwind v4 wiring:** the `@tailwindcss/vite` plugin (in `astro.config.mjs`) replaces the old `@astrojs/tailwind` integration. Styles enter through `src/styles/global.css` (`@import "tailwindcss"`), imported once each in `BaseLayout.astro` and `BrandLayout.astro`. The v3-style `tailwind.config.mjs` above is kept via the `@config` directive in that CSS file, and the copy-button classes the rehype plugin injects are preserved with `@source inline(...)` (v4 dropped the JS `safelist` option).

### Prose typography overrides

Set in `tailwind.config.mjs`:

- Headings (the brand sans), body (`stone-700`), bold (ink `stone-900`)
- Links: `accent` (indigo-600), clean 1px underline; hover deepens to `indigo-700` with a 2px underline
- `[data-external]` and `[data-resource]` links: also accent indigo
- `[data-anchor]` links: accent indigo

---

## Custom Astro/Markdown pipeline (`astro.config.mjs`)

Astro 7 defaults to the Sätteri Markdown processor, which doesn't run
remark/rehype plugins. This project opts back into the unified pipeline via
`@astrojs/markdown-remark` — `markdown.processor: unified()` in
`astro.config.mjs` — so the plugins below (and `shikiConfig`,
`remarkRehype` handlers) keep working.

Three custom rehype plugins applied to all MDX/Markdown content:

1. **`rehypeDefinitionListIds`** — adds `id` attribute (slugified text) to every `<dt>` element, enabling anchor links to glossary terms.

2. **`rehypeExternalLinks`** — adds `target="_blank"` + `rel="noopener noreferrer"` + `data-external="true"` to `http://`, `https://`, and `mailto:` links; adds `data-resource="true"` to `/resources/` links; adds `data-anchor="true"` to `#` anchor links. These attributes drive Tailwind prose color overrides.

3. **`rehypeCodeBlockCopy`** — wraps every `<pre><code>` block in a `<div class="relative">` and injects a "Copy" button (`data-copy-button="true"`). The copy behavior is wired up in `Prose.astro` (which renders all MD/MDX content), so it works on every prose page, not just blog posts.

Also uses `remark-definition-list` for `<dl>`/`<dt>`/`<dd>` support in MDX.

---

## Analytics

Analytics is **provider-agnostic** and supports **multiple providers at once**. Call sites never name a vendor — they fire events through a global facade `window.track(event, props)` (always called optionally: `window.track?.(...)`). Each active provider chains onto `window.track`, so one call fans out to all of them.

Alongside `track`, providers chain a second facade `window.identify(id, props)` — call it (optionally: `window.identify?.(...)`) to associate the current visitor with an id. Every call site (page or component) uses these two facades and **never** touches a vendor SDK (`window.posthog`, `dataLayer`, …) directly, so a new provider needs no changes at the call sites.

Built-in providers ship as components in `src/components/analytics/`, each exporting its own committed config constant (not an env var — no per-environment config needed):

- **`posthog.astro`** — PostHog. Exports `POSTHOG_PROJECT_TOKEN` + `POSTHOG_HOST`; active when both are non-empty. `track` → `posthog.capture(event, props)`; `identify` → `posthog.identify(id, props)`.
- **`gtm.astro`** — Google Tag Manager. Exports `GTM_CONTAINER_ID` (e.g. `GTM-XXXXXXX`); active when non-empty (empty by default — unused on this site). `track` → `dataLayer.push({ event, ...props })`; `identify` → `dataLayer.push({ event: "identify", user_id: id, ...props })`; match on a "Custom Event" trigger inside the GTM UI, then wire GA4/Ads/etc. tags there without touching this template.

`Analytics.astro` is the dispatcher: it imports each provider's constant(s) and renders the provider only when they're set, under one global switch, `PUBLIC_ANALYTICS_ENABLED === "true"` — **off by default** (host's production env, CI on `main`, or a local override are the places to set it).

**To add a provider:** drop a component in `src/components/analytics/` that exports its own config constant, renders its loader snippet, and chains onto `window.track` (wrap the previous `track` so events still reach earlier providers), then import its constant and render it from `Analytics.astro`. Add its host to the CSP in `src/headers/headers.config.ts` (then `npm run build:headers`).

### Tracked events

All events fire via `window.track(...)` and reach every active provider; pageviews are captured automatically by each provider (PostHog natively; GTM via whatever pageview tag you configure). **The `/analytics` skill (`.claude/skills/analytics/SKILL.md`) is the source of truth** for the tracked-events catalog (each event, where it fires, its properties, and the lead-magnet funnel) and for adding a new event — see it rather than duplicating the list here.

---

## Forms

The email-capture form behind the resource lead-magnet gate is **provider-agnostic**, structured like analytics/captcha: **`Form.astro`** is the dispatcher and each backend is a component in **`src/components/forms/`**. `ResourceLayout` renders `<Form formId=… />` (the id comes from the resource's `form.formId` frontmatter) and never names a vendor. **Built-in provider: Brevo** (`forms/brevo.astro`) — a native HTML POST to `{BREVO_ACCOUNT_ID}.sibforms.com/serve/{formId}`, where `BREVO_ACCOUNT_ID` is a committed constant in that file (not an env var).

**Single-select** (a gate posts to one backend). Unlike analytics/captcha — selected by env vars — the form backend is chosen site-wide in `Form.astro`'s `providers` registry.

**Backend coupling:** the backend does the heavy lifting — validating the captcha token, storing the contact, emailing the `asset`, and redirecting to `/thank-you/resources/{slug}/`. So swapping providers means matching the change on that backend (and its captcha config), not just the frontend. The thank-you page also surfaces the `asset` as a direct download so delivery never depends solely on the email.

**To add a provider** (ConvertKit, Formspree, a custom endpoint): add `forms/<provider>.astro` rendering its own form markup (action URL, email field name, hidden fields) plus the shared bits — `<Captcha />`, the consent checkbox, the submit `<Button />`, and the `resource_gate_viewed` / `resource_gate_submitted` events — then register it in `Form.astro`.

---

## Captcha

Form bot-protection is **provider-agnostic**, structured like analytics: **`Captcha.astro`** is the dispatcher and each provider is a component in **`src/components/captcha/`** that exports its own committed site-key constant (not an env var — see Analytics above) and emits nothing when that constant is empty. The resource-gate form (`forms/brevo.astro`) renders `<Captcha />` and never names a vendor. **Built-in provider: Cloudflare Turnstile** (`captcha/turnstile.astro`, exports `TURNSTILE_SITE_KEY`).

**Difference from analytics — single-select.** Analytics providers stack (every event fans out to all of them); a form needs exactly **one** captcha (two widgets would inject competing hidden tokens), so the dispatcher renders only the **first** configured provider in its priority list. Like analytics, `PUBLIC_CAPTCHA_ENABLED === "true"` is the switch — **off by default**, which conveniently also keeps Turnstile's domain check from tripping in local dev.

**Backend coupling (important):** the widget produces a hidden token that **Brevo validates server-side against the captcha configured on that form**. So the provider you enable here must match the one enabled on the Brevo form — the frontend swap alone isn't enough. (This is why the Turnstile widget also carries the `g-recaptcha` class: it matches Brevo's own generated embed / field detection.)

**To add a provider** (e.g. Google reCAPTCHA, hCaptcha): drop a component in `src/components/captcha/` that renders its widget + loader script gated on its own `PUBLIC_*` site key; declare that key in `src/env.d.ts` + `.env.example`; add a `{ enabled, Component }` entry to the `providers` list in `Captcha.astro`; and add its script/frame host to the CSP in `src/headers/headers.config.ts` (then `npm run build:headers`).

---

Components live in **`src/components/`** — they're small and self-documenting, so read them there rather than maintaining a catalog here. The ones with non-obvious contracts:

- **`Prose.astro`** — the content-card panel for rendered MD/MDX (post body, resource + legal pages, thank-you copy): the shared card+prose styling plus the code-block copy behavior, scoped per instance. the resource-gate form's (`forms/brevo.astro`) inline `prose prose-lg` is a deliberately different, non-card pattern.
- **`Button.astro`**, **`Analytics.astro`**, **Fonts** — see the subsections below.
- **`analytics/*.astro`** — one component per analytics provider (loader + `track`/`identify` facade); see **Analytics** above and the `/analytics` skill.
- **`Form.astro` + `forms/*.astro`** — provider-agnostic resource-gate email form (dispatcher + one component per backend); single-select, Brevo built in — see **Forms** above.
- **`Captcha.astro` + `captcha/*.astro`** — provider-agnostic form captcha (dispatcher + one self-gating component per provider); single-select, Turnstile built in — see **Captcha** above.
- **`JsonLd.astro`** — renders a schema.org JSON-LD block; see the `/structured-data` skill.

### `Button.astro`

Reusable button composed from Tailwind utilities. Renders a `<button>`, or an `<a>` when given `href` (a button-like link). Props: `variant` (`primary` = indigo fill / `secondary` = white + soft stone border / `inverse` = white, for use on an indigo band) and `size` (`md` / `lg`). Extra `class` is appended; other attributes (`type`, `target`, `data-*`) pass through. Live demo on `/-/astro/brand/components/`.

### `Analytics.astro`

Dispatcher for the analytics providers in `src/components/analytics/` (see **Analytics** above). Renders each provider only when its constant is set and `PUBLIC_ANALYTICS_ENABLED === "true"` (off by default) — this matters beyond tidiness: an unconfigured PostHog would otherwise request `<host>/static/array.js`, 404, and log a console error, capping the Lighthouse Best-Practices score. Emitting no snippet by default keeps that score clean.

### Fonts

Fonts are **self-hosted via Astro's [Fonts API](https://docs.astro.build/en/guides/fonts/)** (stable in Astro 7). The family **names + CSS variables are a single source of truth in `src/design-tokens.mjs`** (`export const fonts` — sitting alongside the color tokens): a **sans** (body + headings) and a **mono** (code). **`astro.config.mjs`** reads those into the `fonts` array and adds the provider/axes (`fontProviders.google()`, `weights: ["400 700"]` variable range covering 400/500/600/700, `subsets: ["latin"]`, the sans also `styles: ["normal", "italic"]`). At build time Astro downloads + subsets the fonts, emits them to `/_astro/fonts/`, and serves them **same-origin** (no Google request at runtime — faster, and privacy-friendly). `BaseLayout` and `BrandLayout` render them with `<Font cssVariable={fonts.sans.variable} preload />` + `<Font cssVariable={fonts.mono.variable} />` (from `astro:assets`); the `preload` on the sans face keeps hero text fast. Astro injects the `@font-face` rules **and an automatic optimized metrics-matched fallback** (so `font-display: swap` swaps with zero CLS — no hand-tuned fallback face to maintain). Templates never name the family directly: `tailwind.config.mjs` maps `font-sans`/`font-mono` to those CSS variables (which already include the fallback chain), and the brand specimen pages render `fonts.sans.name`/`fonts.mono.name` — so a font swap changes `src/design-tokens.mjs` in one place and nothing drifts. The OG card fonts (`src/og/fonts.ts`) are a separate bundled set tied to their own `.woff` files — update those too.

---

## Deploy & infrastructure

**Hosting is platform-agnostic.** The build produces a static `dist/` that any static host serves. The two host-specific concerns — redirects and response headers — are authored platform-neutrally and compiled per host from **`site.platform.deploy`** in `src/site.config.ts` (see below). Supported targets: **Cloudflare Pages** (the default / reference host), **Netlify**, **Vercel**, and **AWS Amplify**. Switching hosts is a one-line change to `platform.deploy` plus a rebuild — nothing else in the codebase is host-specific.

**Deploy on push:** connect the GitHub repo to your host and pushing to `main` triggers a production build+deploy (Cloudflare Pages, Netlify, and Vercel all support this). The reference setup uses no preview branches. Configure the connection in your host's dashboard.

**DNS / hosting config:** manage it however your host prefers (dashboard, or infrastructure-as-code such as Terraform against your host's provider). None of it lives in this repo.

**Response headers** — authored as platform-neutral rules in **`src/headers/headers.config.ts`** and compiled by `scripts/generate-headers.ts` into the artifact for the host set by **`site.platform.deploy`** (`public/_headers` for Cloudflare/Netlify, `vercel.json` `headers[]` for Vercel, `customHeaders.json` for Amplify). Current rules: `X-Robots-Tag: noindex` on `/-/astro/*` and `/thank-you/*`; on `/*` the security set (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Content-Security-Policy`, `Permissions-Policy`). The artifact is **committed** and CI's `npm run check:headers` fails on drift — edit the config, then `npm run build:headers` and commit. **Don't edit `public/_headers` by hand** (it's generated). When adding an analytics/asset host, add it to the CSP directive arrays in `headers.config.ts`. If your CDN or DNS layer also sets some of these security headers, drop them there to avoid duplicates.

**Redirects** — authored as platform-neutral CSV in **`src/redirects/`** and compiled by `scripts/generate-redirects.ts` into the artifact for the host set by **`site.platform.deploy`** in `src/site.config.ts` (`public/_redirects` for Cloudflare/Netlify, `vercel.json` for Vercel, `redirects.json` for Amplify). The artifact is **committed** and CI's `npm run check:redirects` fails on drift, so rebuild (`npm run build:redirects`) and commit it alongside any CSV change.

**The `/redirects` skill (`.claude/skills/redirects/SKILL.md`) is the source of truth** for the CSV format, platform table, and workflow — see it (or `src/redirects/README.md`) rather than duplicating the details here.

---

## Environment variables

Provider config (PostHog, GTM, Turnstile, Brevo, the image origin) is committed constants in the relevant components (see **Analytics**/**Captcha**/**Forms** below), not env vars. The only two env vars this site declares are `PUBLIC_ANALYTICS_ENABLED` / `PUBLIC_CAPTCHA_ENABLED` — both **default off**, and turn on only when set to the literal string `"true"` (production env, CI on `main`, or locally to test — see **Analytics**/**Captcha**). No `.env` file is required. `src/env.d.ts` is the source of truth for both, and also declares the `Window` interface for provider globals (`posthog`, `dataLayer`) — add to it if a new provider exposes one.

---

## Content images

Content images (photos: png/jpg/webp) are **optimized at build by Astro** (`astro:assets` + Sharp): resized, re-encoded to `webp`/`avif`, content-hashed into `dist/_astro/`, and served by the deploy host (whose edge is a CDN). `astro.config.mjs` sets `image.layout: "constrained"`, so `<Image>` and Markdown `![]()` are responsive (srcset + zero CLS) by default. There is **no runtime image-CDN transform**.

Originals come from either place:

- **Committed** — a file in `src/images/`, imported. Zero external dependency; builds never fetch.
- **Remote origin** — host originals on a bucket/CDN (e.g. an **R2 bucket on a custom domain**), set **`site.platform.imagesCDNHost`** in `src/site.config.ts`, and Astro **downloads + optimizes them at build**. Keeps binaries out of git. The origin is pure storage, **decoupled from `site.platform.deploy`**, authorized for optimization via `image.remotePatterns`, and is committed config (not an env var) so it's present in every build environment — including host previews that don't expose env vars. `site.platform.imagesCDNHost` is also the single source for the CSP `img-src` (no drift).

Component: **`src/components/Image.astro`** — the one content-image component (wraps `astro:assets`, reads `site.config` directly; there is no separate image config module). It emits a schema.org `ImageObject` license JSON-LD for **every** image (from `site.copyright.images.license` + `site.organization`); a **caption** (default slot) additionally wraps it in a `<figure>` + `<figcaption>`. An image `astro:assets` can't optimize (an off-origin remote) renders as a plain `<img>` — no repeated-URL srcset, no build-time fetch.

**Authoring** — two ways: `<Image>` (imported asset or **full remote URL**; a remote src needs `width`+`height`; a caption adds the figure), and plain Markdown `![]()` (Astro's built-in optimization — local images, and full remote URLs whose domain is authorized in `image.remotePatterns`). No custom Markdown-image plugin.

**Post cover & Google Discover** — a post's optional **`cover`** (`{ image, alt }`, blog frontmatter) is a real non-text photo (distinct from the OG card). `cover.image` renders as the hero (LCP) and drives the schema.org `BlogPosting.image` (the primary-image signal Discover reads) + the image-sitemap `<image:loc>` (`src/pages/sitemap.xml.ts`, namespace `sitemap-image/1.1`); `og:image` stays the OG card. Both fields are required when `cover` is set (schema-enforced). For Discover, use a well-cropped landscape ≥1200px wide at 16:9 (`max-image-preview:large` is already set). The `<Image>` ImageObject `creator` defaults to the site Organization; override per image with `author={{ name, url }}` / `licenseUrl`.

**Reachability & caching:** because `site.platform.imagesCDNHost` is committed, **every** build (CI, previews, production) optimizes on-origin images, so the origin **must be reachable** at build; an off-origin image (or `imagesCDNHost: ""`) renders as a plain unoptimized `<img>`, **no fetch**. Astro caches optimized images + fonts in **`node_modules/.astro`** (keyed by content hash) — CI restores it via `actions/cache` so unchanged images aren't re-processed. The CSP `img-src` host comes from the same `site.platform.imagesCDNHost` (`src/headers/headers.config.ts`; `npm run build:headers` after changing it) — single source, no drift.

**The `/images` skill (`.claude/skills/images/SKILL.md`) is the source of truth** for hosting originals, the post cover, CI caching, and image SEO — see it rather than duplicating the details here.

---

## OG image generation

OG images are **purpose-built cards rendered at build time** — no browser, no running server, nothing committed. The pipeline lives in **`src/og/`** and the endpoint **`src/pages/og/[...path].png.ts`**:

- **`src/og/manifest.ts`** — the single source of truth. `getOgEntries()` enumerates every card; the collection-driven ones (each post / resource page / legal page) come from the **page-collections registry** (`getPageRecords()` — the same list the sitemap uses, so a new section self-registers here too), the standalone cards (home, blog index) come from each page's own exported `meta` (`src/pages/index.astro`, `src/pages/blog/index.astro` — a page that sets no `title`/`description` falls back to the `default` card), and the `default` fallback is listed explicitly. Each entry carries `{ key, template, title, description, eyebrow, alt }`. `getOgImage(pathname)` returns the `{ path, alt }` for a page. Consumed by both the endpoint (to render) and `BaseLayout` (for `og:image` + `og:image:alt`).
- **`src/og/card.ts`** — two Satori templates: `article` (eyebrow · title · description · brand footer) and `site` (brand mark · name · tagline). Built as Satori vdom nodes directly (no JSX). The **brand mark** is rasterized once from `public/brand-mark.svg` (via `Resvg`) into a PNG data URI and embedded as an `<img>`, so the cards use the same mark as the favicons (see Favicons & brand mark).
- **`src/og/theme.ts`** — card colors pulled from `src/design-tokens.mjs`, so a re-skin (the `/brand` skill) recolors the cards automatically. Tokens are run through `culori`'s `formatHex` because Tailwind v4's default palettes are `oklch()` strings, which the resvg rasterizer doesn't render reliably.
- **`src/og/fonts.ts`** — bundles a Latin subset of the brand sans (`src/og/fonts/*.woff`, Regular + Bold) for Satori. This is the OG card font, **separate** from the site's self-hosted fonts (its own committed `.woff` files) — if you swap the brand font (`/brand` skill), update these too.
- **`src/pages/og/[...path].png.ts`** — `getStaticPaths()` from the manifest, `GET()` → Satori (vdom → SVG) → resvg (SVG → PNG). `astro build` emits `dist/og/**/*.png`; `astro dev` renders the same route on request. Cards are **1200×630** PNGs.

Because the images are produced by `astro build`, production (Cloudflare Pages) and CI get them for free — there's no separate generate step and no binaries in git. `src/pages/rss.xml.ts` references each post's card at `/og/blog/{id}.png`.

**The `/og-images` skill (`.claude/skills/og-images/SKILL.md`) is the source of truth** for customizing the cards (layout, colors, fonts, template variants, which pages get a card) — see it rather than duplicating the details here.

---

## Favicons & brand mark

**`public/brand-mark.svg` is the single source of truth for the site's brand mark** — used for _both_ the favicon set and the mark on the OG social cards, so a site's icon and its share cards always match. It ships as a default (an indigo square with a "Z") and is meant to be **replaced** during setup (SETUP.md → step 2) with the user's own mark. Keep it a **square, full-bleed SVG** (the art fills its own background): the raster icons are rendered from it as-is, and Apple-touch / Android icons can't be transparent, so full-bleed avoids empty/black corners. There's no letter/token generation — the art lives entirely in that one SVG.

**`scripts/generate-favicons.ts`** (`npm run favicons`) rasterizes `brand-mark.svg` with `sharp` into the raster icons, all **committed** under `public/`: `favicon.ico` (16/32/48 legacy fallback, PNG-encoded entries built without an extra dependency), `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`. **Rerun it whenever `brand-mark.svg` changes**, and commit the results. The SVG favicon is served straight from `/brand-mark.svg` (no separate `favicon.svg`), and the OG cards rasterize the same file (see OG image generation → `src/og/card.ts`), so those two update with no regeneration step.

`BaseLayout` and `BrandLayout` render the full `<link>` set: `icon` (`.ico` + `/brand-mark.svg`) + `apple-touch-icon` + `manifest`. The **web app manifest** is a dynamic endpoint — **`src/pages/site.webmanifest.ts`** — reading the name from `site.config` and `theme_color` / `background_color` from `src/og/theme.ts`, so it stays in sync with a rebrand automatically. The CSP allows the manifest via `manifest-src 'self'` in `src/headers/headers.config.ts`.
