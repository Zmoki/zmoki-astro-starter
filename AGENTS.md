# AGENTS.md — zmoki-website-starter technical spec

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
| Analytics           | PostHog                                                        | posthog-js   |
| Email/Forms         | Brevo                                                          | —            |
| OG images           | Puppeteer (script)                                             | —            |
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
- `/brand-typography` — swap the site's fonts end to end (`.claude/skills/brand-typography/SKILL.md`)
- `/redirects` — add or edit URL redirects (`.claude/skills/redirects/SKILL.md`)
- `/update-deps` — update npm packages + GitHub Actions in staged, verified commits (`.claude/skills/update-deps/SKILL.md`)

---

## Scripts

```
npm run dev              # dev server
npm run build            # production build
npm run og:generate      # generate OG images via Puppeteer
npm run build:full       # build + og:generate
npm run timeline:blog    # generate blog-timeline.csv
npm run build:redirects  # compile src/redirects/*.csv → host redirect artifact (runs automatically before build)
npm run check:redirects  # CI guard: rebuild redirects and fail if the committed artifact drifted
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
5. **Build** — `npm run build`

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
- Vendor scripts (e.g. `posthog.astro`) use `/* eslint-disable */` inline

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

### `blog` — posts

```ts
{
  order: number; // sort order (higher = newer), used for prev/next nav
  title: string;
  description: string;
  publishDate: Date;
  contentModifiedDate: Date;
}
```

Files: `src/content/blog/{order}-{slug}.mdx` (most) or `.md`

> **Rule:** whenever you edit content in any collection file (`blog`, `resources`, `legal`), bump `contentModifiedDate` to today's date.

### `resources` — downloadable resources and external links

```ts
{
  type: "page" | "link"
  name: string            // short display name
  title: string
  description: string
  url?: string            // for type: "link"
  publishDate: Date
  contentModifiedDate: Date
  order: number
  form?: {                // optional Brevo email form
    brevoFormId: string
    buttonText: string
    title: string
    description: string
  }
  platform?: {
    name: string
    title: string
    description: string
  }
  asset?: {                 // optional gated deliverable (lead magnet)
    file: string            // path in public/downloads/ or an external URL
    label?: string          // download button text (default "Download now")
  }
}
```

A resource with both a `form` and an `asset` is a **lead-magnet gate**: the `form`
captures an email (Brevo emails the asset + redirects to `/thank-you/resources/{slug}/`),
and the thank-you page also shows the `asset` as a **direct download** so delivery doesn't
depend solely on the email. This is not access control — files under `public/` are publicly
reachable if the URL leaks.

### `legal` — privacy, terms

```ts
{
  title: string;
  description: string;
  publishDate: Date;
  contentModifiedDate: Date;
}
```

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
/og-images/              # generated OG images (public/)
/-/astro/health          # health check — returns "ok" + short commit hash
/-/astro/brand/          # brand design system home (internal, noindex)
/-/astro/brand/color/    # color palette reference (BrandLayout)
```

---

## Layouts

### `BaseLayout.astro`

Props:

```ts
{
  title: string
  description?: string        // default: site.description from src/site.config.ts
  publishDate?: Date
  contentModifiedDate?: Date
  wide?: boolean              // default: false. true = full-width <main> for
                             // landing-page sections that own their containers;
                             // false = centered max-w-3xl container for articles
}
```

Classic landing-page chrome on every page: a sticky top nav (logo + `site.nav` links + `site.cta` button), a single-column `<main>`, and a footer (copyright + Privacy/Terms/Contact/Source). The nav, CTA, and footer all read from `src/site.config.ts`.

Sets `<html lang="en">`, loads Google Fonts (non-render-blocking — see Components → Fonts), meta/OG tags, analytics (`Analytics.astro`), canonical URL. OG images are served from `/og-images{pathname}wide.jpg` (or `/og-images/wide.jpg` for non-articles).

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

3. **`rehypeCodeBlockCopy`** — wraps every `<pre><code>` block in a `<div class="relative">` and injects a "Copy" button (`data-copy-button="true"`). Button copy logic is in `PostLayout.astro` client script.

Also uses `remark-definition-list` for `<dl>`/`<dt>`/`<dd>` support in MDX.

---

## Analytics events (PostHog)

| Event                         | Where fired              | Properties                      |
| ----------------------------- | ------------------------ | ------------------------------- |
| `contact_email_clicked`       | BaseLayout inline script | `email`                         |
| `post_navigation_clicked`     | PostLayout inline script | `direction`, `destination_slug` |
| `code_block_copied`           | PostLayout inline script | `snippet_length`                |
| `gate_viewed`                 | BrevoForm inline script  | `resource_slug`, `form_id`      |
| `newsletter_form_submitted`   | BrevoForm inline script  | `form_id`, `resource_slug`      |
| `resource_download_confirmed` | Thank-you inline script  | `resource_name`, `resource_url` |
| `resource_downloaded`         | Thank-you inline script  | `resource_name`, `asset_file`   |

PostHog captures all listed events plus pageviews automatically.

The gate funnel for a lead-magnet resource is: `gate_viewed` → `newsletter_form_submitted`
→ `resource_download_confirmed` (reached the thank-you page) → `resource_downloaded`
(clicked the direct download).

---

## Components

| Component            | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `BaseLayout.astro`   | Shell: nav, meta, footer, analytics                           |
| `PostLayout.astro`   | Blog post wrapper                                             |
| `PostCard.astro`     | Post list item on index page                                  |
| `PostImage.astro`    | Image with caption in posts                                   |
| `RawVideo.astro`     | Video embed                                                   |
| `Video.astro`        | Video with controls                                           |
| `Button.astro`       | Reusable button; renders `<a>` when given `href` (see below)  |
| `BrevoForm.astro`    | Email signup form (Brevo)                                     |
| `ResourceLink.astro` | Renders a resource link in sidebar/resource pages             |
| `Time.astro`         | Renders `<time>` element with formatted date                  |
| `Analytics.astro`    | Injects PostHog only when analytics is configured (see below) |
| `posthog.astro`      | PostHog init script (rendered by `Analytics.astro`)           |

### `Button.astro`

Reusable button composed from Tailwind utilities. Renders a `<button>`, or an `<a>` when given `href` (a button-like link). Props: `variant` (`primary` = indigo fill / `secondary` = white + soft stone border / `inverse` = white, for use on an indigo band) and `size` (`md` / `lg`). Extra `class` is appended; other attributes (`type`, `target`, `data-*`) pass through. Live demo on `/-/astro/brand/components/`.

### `Analytics.astro`

Wraps `posthog.astro` and only renders it when analytics is actually configured: `PUBLIC_ANALYTICS_ENABLED !== "false"` **and** both `PUBLIC_POSTHOG_PROJECT_TOKEN` and `PUBLIC_POSTHOG_HOST` are set. Without a host, PostHog would request `<host>/static/array.js` from the current origin, 404, and log a console error — which is what happened in the Lighthouse/CI build (those secrets are empty there), capping the Best-Practices score. Gating on the env vars keeps PostHog out of any build where it can't work.

### Fonts

`BaseLayout` and `BrandLayout` load Google Fonts **non-render-blocking**: `<link rel="preload" as="style">` + `<link rel="stylesheet" media="print" onload="this.media='all'">` (with a `<noscript>` fallback), so text paints immediately in the fallback and the font never blocks First Contentful Paint. Only **Noto Sans** and **Noto Sans Mono** are requested, weights **400–700** (the range the site actually uses). The shared URL lives in a `fontsHref` const in each layout — keep the two in sync.

---

## Deploy & infrastructure

**Hosting:** Cloudflare Pages, connected to your site's GitHub repo.

**Production branch:** `main` — every push to `main` triggers a Cloudflare Pages deploy. No preview branches.

**Infrastructure as code:** Cloudflare account, DNS zones (including your site's zone), and Pages config are managed via Terraform in a separate repo:

- GitHub: `https://github.com/Zmoki/my-infrastructure`
- Local path: `~/Projects/Zmoki/my-infrastructure/`

If DNS, zone settings, or Cloudflare Pages project config need changing, edit the Terraform config in that repo — not the Cloudflare dashboard directly.

**`public/_headers`** — HTTP response headers applied by Cloudflare Pages per URL pattern. Current rules:

- `/-/astro/*` and `/thank-you/*` — `X-Robots-Tag: noindex`
- `/*` — `Content-Security-Policy` and `Permissions-Policy`

Edit this file directly for header changes (not Terraform).

**Redirects** — authored as platform-neutral CSV in **`src/redirects/`** and compiled by `scripts/generate-redirects.ts` into the artifact for the host set by **`site.deploy.platform`** in `src/site.config.ts` (`public/_redirects` for Cloudflare/Netlify, `vercel.json` for Vercel, `redirects.json` for Amplify). The artifact is **committed** and CI's `npm run check:redirects` fails on drift, so rebuild (`npm run build:redirects`) and commit it alongside any CSV change.

**The `/redirects` skill (`.claude/skills/redirects/SKILL.md`) is the source of truth** for the CSV format, platform table, and workflow — see it (or `src/redirects/README.md`) rather than duplicating the details here.

---

## Environment variables

**Source of truth: `src/env.d.ts`** — all `PUBLIC_*` env vars must be declared here first. `.env.example` must mirror it (same keys, no values).

Current variables:

| Variable                               | Required | Purpose                                            |
| -------------------------------------- | -------- | -------------------------------------------------- |
| `PUBLIC_POSTHOG_PROJECT_TOKEN`         | No       | PostHog analytics token (required to load PostHog) |
| `PUBLIC_POSTHOG_HOST`                  | No       | PostHog host URL (required to load PostHog)        |
| `PUBLIC_ANALYTICS_ENABLED`             | No       | Set to `"false"` to force-disable PostHog          |
| `PUBLIC_BREVO_ACCOUNT_ID`              | No       | Brevo email form integration                       |
| `PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | No       | Cloudflare Turnstile bot protection                |

When adding a new env var: add it to `src/env.d.ts` first, then add it to `.env.example` with an empty value and a comment.

---

## Content images

Images for posts and pages live in `src/images/`.

**Optimization workflow (macOS Automator):** Drop an image into `src/images/tmp/` → ImageOptim picks it up automatically, optimizes it, and saves the result to `src/images/`. Never commit images directly to `src/images/` without going through this pipeline first.

Do not commit anything from `src/images/tmp/` — it's a staging folder.

---

## OG image generation

`scripts/generate-og-images.mjs` uses Puppeteer to screenshot pages at 1200×675 and save to `public/og-images/`. Run after build: `npm run og:generate` or `npm run build:full`.

OG images are wide JPEGs (1200×675). BaseLayout constructs the URL as `/og-images{pathname}wide.jpg`.
