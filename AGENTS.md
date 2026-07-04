# AGENTS.md — zmoki-astro-starter technical spec

> Canonical AI instructions for this project. CLAUDE.md imports this. Cursor and other tools read it directly.

---

## Project overview

An Astro starter for personal websites — posts, projects, and resources. Built from zmoki.xyz and genericized into a reusable template. Everything site-specific lives in **`src/site.config.ts`**; the rest is the reusable shell.

When starting a new site from this template, see **`SETUP.md`** for the checklist.

---

## Tech stack

| Layer               | Tool                                                           | Version      |
| ------------------- | -------------------------------------------------------------- | ------------ |
| Framework           | Astro                                                          | ^7.0         |
| Language            | TypeScript                                                     | via Astro    |
| Styling             | Tailwind CSS (@tailwindcss/vite) + @tailwindcss/typography     | ^4           |
| Content             | MDX via @astrojs/mdx                                           | ^7           |
| Fonts               | Noto Sans (headings + body), Noto Sans Mono (code)             | Google Fonts |
| Analytics           | Provider-agnostic; PostHog + Google Tag Manager built in       | posthog-js   |
| Email/Forms         | Brevo                                                          | —            |
| OG images           | Satori + resvg (build-time PNG endpoint)                       | —            |
| RSS                 | @astrojs/rss                                                   | —            |
| Syntax highlighting | Shiki, theme: `catppuccin-mocha` (dark, WCAG-AA contrast)      | —            |
| Performance         | Lighthouse CI (@lhci/cli)                                      | —            |
| Formatting          | Prettier + prettier-plugin-astro + prettier-plugin-tailwindcss | —            |

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

**These are AI-tool-agnostic task playbooks.** Each `SKILL.md` (and its `references/*.md`) is plain, vendor-neutral Markdown — the `/name` shortcut is Claude Code's way of loading it on demand, but any AI coding tool can use them by reading the file directly. Before doing one of the kinds of work above, **read the matching `.claude/skills/<name>/SKILL.md` first** and follow it. They're the source of truth for their topic; the sections below summarize, they don't replace.

---

## Scripts

```
npm run dev              # dev server
npm run build            # production build (also emits OG images to dist/og/)
npm run timeline:blog    # generate blog-timeline.csv
npm run build:redirects  # compile src/redirects/*.csv → host redirect artifact (runs automatically before build)
npm run check:redirects  # CI guard: rebuild redirects and fail if the committed artifact drifted
npm run build:headers    # compile src/headers/headers.config.ts → host header artifact (runs automatically before build)
npm run check:headers    # CI guard: rebuild headers and fail if the committed artifact drifted
npm run check:sd         # CI guard: validate schema.org JSON-LD in dist/ (run after build)
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

Required GitHub secrets for the build step: `PUBLIC_POSTHOG_PROJECT_TOKEN`, `PUBLIC_POSTHOG_HOST`, `PUBLIC_BREVO_ACCOUNT_ID`, `PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`.

A separate `lighthouse.yml` workflow runs Lighthouse CI after every push to `main`.

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

The single source of truth for everything personal to a site: domain, name, description, OG/RSS titles, top-nav links (`nav`), primary CTA (`cta`), hero copy (`hero`), closing CTA band (`finalCta`), author name + about-slug, contact email, source repo, copyright year, and the deploy target (`deploy.platform`, which drives the redirects build). Layouts, the landing page, RSS, and the sitemap all read from it. To rebrand a new site, this is the main file you edit (plus `astro.config.mjs` `site`, the palette in `src/design-tokens.mjs`, and the favicon). The internal `/-/astro/brand/` pages are not wired to it — they use the `My Project X` placeholder and are edited directly.

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
- **`resources` lead-magnet gate** — a resource carrying both a `form` and an `asset` captures an email via Brevo (which emails the asset and redirects to `/thank-you/resources/{slug}/`); the thank-you page _also_ surfaces the `asset` as a direct download so delivery doesn't depend solely on the email. Host the asset externally (R2, S3, a CDN/bucket, Brevo's own hosting) — don't commit binaries. This is not access control: a public URL is reachable by anyone who has it.

---

## URL structure

```
/                        # landing page (hero → features → final CTA)
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
/-/astro/brand/color/    # color palette reference (BrandLayout)
```

---

## Layouts

### `BaseLayout.astro`

Props are defined in the file; the one with non-obvious behavior is **`wide`** (default `false`) — `true` gives a full-width `<main>` for landing-page sections that own their own containers, `false` a centered `max-w-3xl` container for articles. (`description` defaults to `site.description`.)

Classic landing-page chrome on every page: a sticky top nav (logo + `site.nav` links + `site.cta` button), a single-column `<main>`, and a footer (copyright + Privacy/Terms/Contact/Source). The nav, CTA, and footer all read from `src/site.config.ts`.

Sets `<html lang="en">`, loads Google Fonts (see Components → Fonts), meta/OG tags, analytics (`Analytics.astro`), canonical URL. Every absolute URL it emits — canonical, `og:url`, `og:image`/`twitter:image` — comes from **`pageUrls(Astro)`** (`src/lib/urls.ts`), the single source of truth for absolute-URL construction; the JSON-LD structured data (`PostLayout`) uses the same helper, so canonical/OG/meta/SD can't drift apart. `pageUrls` separates the **site origin** (production, from astro.config `site` — used for canonical + SD) from the **asset origin** (the dev server under `astro dev`, else production — used for OG image URLs so cards preview locally). The OG image URL + `alt` per page come from the manifest via `getOgImage(pathname)` (see OG image generation below); pages without their own card fall back to the site default.

### `PostLayout.astro`

Wraps `BaseLayout`. Props: `title`, `description`, `publishDate`, `contentModifiedDate`, `prevPost?`, `nextPost?`. Shows article header with publish/modified dates, prose content, author bio, prev/next navigation. The home page (`src/pages/index.astro`) is a standalone landing page using `BaseLayout` with `wide`; the blog list lives at `src/pages/blog/index.astro`.

### `ResourceLayout.astro`, `LegalLayout.astro`

Exist but follow the same `BaseLayout` wrapper pattern.

### `BrandLayout.astro`

Standalone layout for the internal brand pages under `/-/astro/brand/`. Like `BaseLayout` but **without** the sidebars/header/footer chrome — a single-column canvas. Sets `noindex`, loads the same fonts, uses `bg-zmoki-cream-100` / `text-zmoki-stone-900`. Props: `title`, `description?`.

---

## Color system

All colors come from **`src/design-tokens.mjs`** — the single source of truth, imported by both `tailwind.config.mjs` (to generate utilities) and the brand reference page. It re-exports Tailwind's default color palettes under the **`zmoki-`** prefix, so every group is a namespaced full 50→950 scale: `zmoki-slate`, `zmoki-gray`, `zmoki-zinc`, `zmoki-neutral`, `zmoki-stone`, plus the chromatic ramps (`zmoki-red`, `zmoki-orange`, … `zmoki-rose`). Templates use these `zmoki-*` utility classes; **no inline hex**. Live reference: `/-/astro/brand/color/`.

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

- Headings (Noto Sans), body (`stone-700`), bold (ink `stone-900`)
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

Built-in providers ship as self-gating components in `src/components/analytics/`:

- **`posthog.astro`** — PostHog. Active when `PUBLIC_POSTHOG_PROJECT_TOKEN` **and** `PUBLIC_POSTHOG_HOST` are set. `track` → `posthog.capture(event, props)`; `identify` → `posthog.identify(id, props)`.
- **`gtm.astro`** — Google Tag Manager. Active when `PUBLIC_GTM_CONTAINER_ID` (e.g. `GTM-XXXXXXX`) is set. `track` → `dataLayer.push({ event, ...props })`; `identify` → `dataLayer.push({ event: "identify", user_id: id, ...props })`; match on a "Custom Event" trigger inside the GTM UI, then wire GA4/Ads/etc. tags there without touching this template.

`Analytics.astro` is the dispatcher: it renders every provider (each emits nothing when its own env vars are absent) under one global kill switch, `PUBLIC_ANALYTICS_ENABLED !== "false"`.

**To add a provider:** drop a component in `src/components/analytics/` that renders its loader snippet and chains onto `window.track` (wrap the previous `track` so events still reach earlier providers), then render it from `Analytics.astro`. Add its host to the CSP in `src/headers/headers.config.ts` (then `npm run build:headers`) and its env var to `src/env.d.ts` + `.env.example`.

### Tracked events

All events fire via `window.track(...)` and reach every active provider; pageviews are captured automatically by each provider (PostHog natively; GTM via whatever pageview tag you configure). **The `/analytics` skill (`.claude/skills/analytics/SKILL.md`) is the source of truth** for the tracked-events catalog (each event, where it fires, its properties, and the lead-magnet funnel) and for adding a new event — see it rather than duplicating the list here.

---

Components live in **`src/components/`** — they're small and self-documenting, so read them there rather than maintaining a catalog here. The ones with non-obvious contracts:

- **`Prose.astro`** — the content-card panel for rendered MD/MDX (post body, resource + legal pages, thank-you copy): the shared card+prose styling plus the code-block copy behavior, scoped per instance. `BrevoForm`'s inline `prose prose-lg` is a deliberately different, non-card pattern.
- **`Button.astro`**, **`Analytics.astro`**, **Fonts** — see the subsections below.
- **`analytics/*.astro`** — one component per analytics provider (loader + `track`/`identify` facade); see **Analytics** above and the `/analytics` skill.
- **`JsonLd.astro`** — renders a schema.org JSON-LD block; see the `/structured-data` skill.

### `Button.astro`

Reusable button composed from Tailwind utilities. Renders a `<button>`, or an `<a>` when given `href` (a button-like link). Props: `variant` (`primary` = indigo fill / `secondary` = white + soft stone border / `inverse` = white, for use on an indigo band) and `size` (`md` / `lg`). Extra `class` is appended; other attributes (`type`, `target`, `data-*`) pass through. Live demo on `/-/astro/brand/components/`.

### `Analytics.astro`

Dispatcher for the analytics providers in `src/components/analytics/` (see **Analytics** above). Renders each provider under one global kill switch (`PUBLIC_ANALYTICS_ENABLED !== "false"`); each provider then self-gates on its own env vars and emits **nothing** when unconfigured. This matters beyond tidiness: an unconfigured PostHog would request `<host>/static/array.js` from the current origin, 404, and log a console error — which is what happened in the Lighthouse/CI build (those secrets are empty there), capping the Best-Practices score. Emitting no snippet when a provider can't work keeps that score clean.

### Fonts

`BaseLayout` and `BrandLayout` load Google Fonts with a plain `<link rel="stylesheet">` (preceded by `preconnect` hints to warm the connection). `display=swap` paints text immediately in the fallback and swaps in the web font once it loads; the metrics-matched **Noto Sans Fallback** (`src/styles/global.css`) is sized to Noto Sans's dimensions, so that swap causes no layout shift (CLS). Only **Noto Sans** and **Noto Sans Mono** are requested, weights **400–700** (the range the site actually uses). The shared URL lives in a `fontsHref` const in each layout — keep the two in sync.

---

## Deploy & infrastructure

**Hosting:** Cloudflare Pages, connected to your site's GitHub repo.

**Production branch:** `main` — every push to `main` triggers a Cloudflare Pages deploy. No preview branches.

**Infrastructure as code:** Cloudflare account, DNS zones (including your site's zone), and Pages config are managed via Terraform in a separate repo:

- GitHub: `https://github.com/Zmoki/my-infrastructure`
- Local path: `~/Projects/Zmoki/my-infrastructure/`

If DNS, zone settings, or Cloudflare Pages project config need changing, edit the Terraform config in that repo — not the Cloudflare dashboard directly.

**Response headers** — authored as platform-neutral rules in **`src/headers/headers.config.ts`** and compiled by `scripts/generate-headers.ts` into the artifact for the host set by **`site.deploy.platform`** (`public/_headers` for Cloudflare/Netlify, `vercel.json` `headers[]` for Vercel, `customHeaders.json` for Amplify). Current rules: `X-Robots-Tag: noindex` on `/-/astro/*` and `/thank-you/*`; on `/*` the security set (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Content-Security-Policy`, `Permissions-Policy`). The artifact is **committed** and CI's `npm run check:headers` fails on drift — edit the config, then `npm run build:headers` and commit. **Don't edit `public/_headers` by hand** (it's generated). When adding an analytics/asset host, add it to the CSP directive arrays in `headers.config.ts`. If your Cloudflare zone (Terraform) also sets some of these security headers, drop them there to avoid duplicates.

**Redirects** — authored as platform-neutral CSV in **`src/redirects/`** and compiled by `scripts/generate-redirects.ts` into the artifact for the host set by **`site.deploy.platform`** in `src/site.config.ts` (`public/_redirects` for Cloudflare/Netlify, `vercel.json` for Vercel, `redirects.json` for Amplify). The artifact is **committed** and CI's `npm run check:redirects` fails on drift, so rebuild (`npm run build:redirects`) and commit it alongside any CSV change.

**The `/redirects` skill (`.claude/skills/redirects/SKILL.md`) is the source of truth** for the CSV format, platform table, and workflow — see it (or `src/redirects/README.md`) rather than duplicating the details here.

---

## Environment variables

**`src/env.d.ts` is the source of truth** — every `PUBLIC_*` var is declared and documented there (one JSDoc line each: purpose + when it applies), and **`.env.example`** mirrors the same keys as a copy-me template (`cp .env.example .env`). Read those two files rather than a table here; all vars are optional (an unset provider just stays off). Which of them CI's build needs as secrets is listed under **CI** above.

When adding a new env var: declare it (with a doc comment) in `src/env.d.ts` first, then add it to `.env.example` with an empty value and a comment. If the provider exposes a browser global, add it to the `Window` interface in `src/env.d.ts` too.

---

## Content images

Images for posts and pages live in `src/images/`.

**Optimization workflow (macOS Automator):** Drop an image into `src/images/tmp/` → ImageOptim picks it up automatically, optimizes it, and saves the result to `src/images/`. Never commit images directly to `src/images/` without going through this pipeline first.

Do not commit anything from `src/images/tmp/` — it's a staging folder.

---

## OG image generation

OG images are **purpose-built cards rendered at build time** — no browser, no running server, nothing committed. The pipeline lives in **`src/og/`** and the endpoint **`src/pages/og/[...path].png.ts`**:

- **`src/og/manifest.ts`** — the single source of truth. `getOgEntries()` enumerates every card (home, blog index, each post / resource page / legal page, plus a `default` fallback); each entry carries `{ key, template, title, description, eyebrow, alt }`. `getOgImage(pathname)` returns the `{ path, alt }` for a page. Consumed by both the endpoint (to render) and `BaseLayout` (for `og:image` + `og:image:alt`).
- **`src/og/card.ts`** — two Satori templates: `article` (eyebrow · title · description · brand footer) and `site` (brand mark · name · tagline). Built as Satori vdom nodes directly (no JSX).
- **`src/og/theme.ts`** — card colors pulled from `src/design-tokens.mjs`, so a re-skin (the `/brand` skill) recolors the cards automatically. Tokens are run through `culori`'s `formatHex` because Tailwind v4's default palettes are `oklch()` strings, which the resvg rasterizer doesn't render reliably.
- **`src/og/fonts.ts`** — bundles the Noto Sans Latin subset (`src/og/fonts/*.woff`, Regular + Bold) for Satori. This is the OG card font, **separate** from the site's Google Fonts — if you swap the brand font (`/brand` skill), update these too.
- **`src/pages/og/[...path].png.ts`** — `getStaticPaths()` from the manifest, `GET()` → Satori (vdom → SVG) → resvg (SVG → PNG). `astro build` emits `dist/og/**/*.png`; `astro dev` renders the same route on request. Cards are **1200×630** PNGs.

Because the images are produced by `astro build`, production (Cloudflare Pages) and CI get them for free — there's no separate generate step and no binaries in git. `src/pages/rss.xml.ts` references each post's card at `/og/blog/{id}.png`.

**The `/og-images` skill (`.claude/skills/og-images/SKILL.md`) is the source of truth** for customizing the cards (layout, colors, fonts, template variants, which pages get a card) — see it rather than duplicating the details here.
