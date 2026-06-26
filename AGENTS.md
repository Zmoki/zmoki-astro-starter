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
| Framework           | Astro                                                          | ^5.16        |
| Language            | TypeScript                                                     | via Astro    |
| Styling             | Tailwind CSS + @tailwindcss/typography                         | ^3           |
| Content             | MDX via @astrojs/mdx                                           | —            |
| Fonts               | Space Grotesk (headings), Google Sans Flex (body), Space Mono  | Google Fonts |
| Analytics           | PostHog                                                        | posthog-js   |
| Email/Forms         | Brevo                                                          | —            |
| OG images           | Puppeteer (script)                                             | —            |
| RSS                 | @astrojs/rss                                                   | —            |
| Syntax highlighting | Shiki, theme: `catppuccin-latte`                               | —            |
| Performance         | Lighthouse CI (@lhci/cli)                                      | —            |
| Formatting          | Prettier + prettier-plugin-astro + prettier-plugin-tailwindcss | —            |

Dev server default port is **4321**. When running multiple worktrees simultaneously, derive a stable per-worktree port with:

```bash
PORT=$(( 4300 + $(echo "$PWD" | cksum | cut -d' ' -f1) % 100 ))
```

A project run skill is at `.claude/skills/run/SKILL.md` — use `/run` to launch the app.

---

## Scripts

```
npm run dev              # dev server
npm run build            # production build
npm run og:generate      # generate OG images via Puppeteer
npm run build:full       # build + og:generate
npm run timeline:blog    # generate blog-timeline.csv
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
4. **Build** — `npm run build`

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

The single source of truth for everything personal to a site: domain, name, description, OG/RSS titles, top-nav links (`nav`), primary CTA (`cta`), hero copy (`hero`), closing CTA band (`finalCta`), author name + about-slug, contact email, source repo, copyright year. Layouts, the landing page, RSS, and the sitemap all read from it. To rebrand a new site, this is the main file you edit (plus `astro.config.mjs` `site`, the palette in `src/design-tokens.mjs`, and the favicon). The internal `/-/astro/brand/` pages are not wired to it — they use the `My Project X` placeholder and are edited directly.

---

## Content collections (`src/content/config.ts`)

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
}
```

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

Sets `<html lang="en">`, loads Google Fonts, meta/OG tags, PostHog, canonical URL. OG images are served from `/og-images{pathname}wide.jpg` (or `/og-images/wide.jpg` for non-articles).

### `PostLayout.astro`

Wraps `BaseLayout`. Props: `title`, `description`, `publishDate`, `contentModifiedDate`, `prevPost?`, `nextPost?`. Shows article header with publish/modified dates, prose content, author bio, prev/next navigation. The home page (`src/pages/index.astro`) is a standalone landing page using `BaseLayout` with `wide`; the blog list lives at `src/pages/blog/index.astro`.

### `ResourceLayout.astro`, `LegalLayout.astro`

Exist but follow the same `BaseLayout` wrapper pattern.

### `BrandLayout.astro`

Standalone layout for the internal brand pages under `/-/astro/brand/`. Like `BaseLayout` but **without** the sidebars/header/footer chrome — a single-column canvas. Sets `noindex`, loads the same fonts, uses `bg-zmoki-neutral-200` / `text-zmoki-neutral-900`. Props: `title`, `description?`.

---

## Color system

All colors come from **`src/design-tokens.mjs`** — the single source of truth, imported by both `tailwind.config.mjs` (to generate utilities) and the brand reference page. It re-exports Tailwind's default color palettes under the **`zmoki-`** prefix, so every group is a namespaced full 50→950 scale: `zmoki-slate`, `zmoki-gray`, `zmoki-zinc`, `zmoki-neutral`, `zmoki-stone`, plus the chromatic ramps (`zmoki-red`, `zmoki-orange`, … `zmoki-rose`). Templates use these `zmoki-*` utility classes; **no inline hex**. Live reference: `/-/astro/brand/color/`.

The starter palette is flat and **monochrome** (brutalist): templates reach for **`zmoki-neutral`** (and Tailwind's built-in `white` / `slate-*`) only — every chromatic group is generated and available, but unused until you want color.

### Conventions (monochrome starter)

| Usage                      | Class                                                                   |
| -------------------------- | ----------------------------------------------------------------------- |
| Ink — text, borders, fills | `zmoki-neutral-900` (links, nav button, hero, CTA, action/copy buttons) |
| Darkest fill / hover       | `zmoki-neutral-950`                                                     |
| Meta / secondary text      | `zmoki-neutral-600`                                                     |
| Page background            | `zmoki-neutral-200`                                                     |
| Cards & panels             | `white` + `border-2 border-zmoki-neutral-900`                           |
| Marker / highlight         | `zmoki-neutral-300`                                                     |
| Inverse text on ink fills  | `text-white` / `text-slate-50`                                          |

To introduce real color, swap a role to a chromatic group (e.g. `bg-zmoki-red-600`, `text-zmoki-blue-600`) — the utilities already exist.

### Changing the palette (re-skin)

When the user wants to shift the site to a different color (e.g. "make it red/green"), there are two paths — pick based on whether the target color is a Tailwind default:

1. **Built-in Tailwind color** — no token edits needed; every group is already generated. To recolor the whole site, find/replace `zmoki-neutral` → the new group (e.g. `zmoki-blue`) across `src/`. To color only accents, change it just on the relevant elements (links, nav button, hero, CTA, action buttons). Confirm scope with the user before a blanket find/replace.
2. **Custom brand color** (not in Tailwind's defaults) — define a full `50`→`950` scale in `customPalettes` inside **`src/design-tokens.mjs`** (a commented `zmoki-brand` example is in place). Build the scale from the user's base color on **colorhexa.com** (the user's preferred tool): enter the base hex as `500`, then use the **"Shades and Tints"** section — lighter tints fill `400 300 200 100 50`, darker shades fill `600 700 800 900 950`. Pick by eye for even, Tailwind-like spacing. The new scale auto-generates `zmoki-<name>-*` utilities and auto-appears on `/-/astro/brand/color/` (via the `customPaletteNames` export). Then point the relevant templates at it.

**Combinations must meet at least WCAG AA.** Every text/background pair the palette produces — ink text on `zmoki-neutral-200` / `white`, muted `zmoki-neutral-600` on white, inverse `white` / `slate-50` on colored fills (nav CTA, hero, CTA band, buttons), borders/focus rings — needs **≥ 4.5:1** for normal text (**≥ 3:1** for large text and UI/graphical elements). Verify pairs with Figma's checker: <https://www.figma.com/color-contrast-checker/>. A fill carrying white text must be dark enough to pass (usually `-600`/`-700`); the mid/light shades of bright hues fail, so go darker or use dark text on a light fill. If a pair fails, fix the shade — don't ship it.

After any palette change, run `npm run build` and check `/-/astro/brand/color/`.

Flat + brutalist is enforced globally in `tailwind.config.mjs`: the `borderRadius` and `boxShadow` scales are overridden to `0` / `none`, so every `rounded-*` is sharp and every `shadow-*` is flat. Cards/panels are defined by `border-2 border-zmoki-neutral-900` instead of shadows. Supporting greys also use Tailwind `slate-*` directly (input borders, code-block bg). `tailwind.config.mjs` defines a single `ink = twColors.neutral[900]` constant for the prose/link CSS that can't reference a utility class.

### Prose typography overrides

Set in `tailwind.config.mjs`, all using the `ink` (= `zmoki-neutral-900`) constant:

- Headings (Space Grotesk), body/bold: ink
- Links: ink (monochrome), dotted bottom border 4px; hover inverts to a solid ink box with white text
- `[data-external]` and `[data-resource]` links: also ink (distinguished by border, not color)
- `[data-anchor]` links: ink, dashed bottom border 2px

---

## Custom Astro/Markdown pipeline (`astro.config.mjs`)

Three custom rehype plugins applied to all MDX/Markdown content:

1. **`rehypeDefinitionListIds`** — adds `id` attribute (slugified text) to every `<dt>` element, enabling anchor links to glossary terms.

2. **`rehypeExternalLinks`** — adds `target="_blank"` + `rel="noopener noreferrer"` + `data-external="true"` to `http://`, `https://`, and `mailto:` links; adds `data-resource="true"` to `/resources/` links; adds `data-anchor="true"` to `#` anchor links. These attributes drive Tailwind prose color overrides.

3. **`rehypeCodeBlockCopy`** — wraps every `<pre><code>` block in a `<div class="relative">` and injects a "Copy" button (`data-copy-button="true"`). Button copy logic is in `PostLayout.astro` client script.

Also uses `remark-definition-list` for `<dl>`/`<dt>`/`<dd>` support in MDX.

---

## Analytics events (PostHog)

| Event                     | Where fired              | Properties                      |
| ------------------------- | ------------------------ | ------------------------------- |
| `contact_email_clicked`   | BaseLayout inline script | `email`                         |
| `post_navigation_clicked` | PostLayout inline script | `direction`, `destination_slug` |
| `code_block_copied`       | PostLayout inline script | `snippet_length`                |

PostHog captures all listed events plus pageviews automatically.

---

## Components

| Component            | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `BaseLayout.astro`   | Shell: grid, meta, sidebars, analytics            |
| `PostLayout.astro`   | Blog post wrapper                                 |
| `PostCard.astro`     | Post list item on index page                      |
| `PostImage.astro`    | Image with caption in posts                       |
| `RawVideo.astro`     | Video embed                                       |
| `Video.astro`        | Video with controls                               |
| `BrevoForm.astro`    | Email signup form (Brevo)                         |
| `ResourceLink.astro` | Renders a resource link in sidebar/resource pages |
| `Time.astro`         | Renders `<time>` element with formatted date      |
| `posthog.astro`      | PostHog init script (injected in `<head>`)        |

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

**`public/_redirects`** — URL redirects handled by Cloudflare Pages. Format: `<from> <to> <status>`. Starts empty (with example comments); add legacy-slug or external redirects as the site grows.

Edit this file directly for redirect changes (not Terraform).

---

## Environment variables

**Source of truth: `src/env.d.ts`** — all `PUBLIC_*` env vars must be declared here first. `.env.example` must mirror it (same keys, no values).

Current variables:

| Variable                               | Required | Purpose                                    |
| -------------------------------------- | -------- | ------------------------------------------ |
| `PUBLIC_POSTHOG_PROJECT_TOKEN`         | No       | PostHog analytics token                    |
| `PUBLIC_POSTHOG_HOST`                  | No       | PostHog host URL                           |
| `PUBLIC_ANALYTICS_ENABLED`             | No       | Set to `"false"` to disable PostHog in dev |
| `PUBLIC_BREVO_ACCOUNT_ID`              | No       | Brevo email form integration               |
| `PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | No       | Cloudflare Turnstile bot protection        |

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
