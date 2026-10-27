# AGENTS.md

Technical guide for AI coding agents (and humans) working on this repo. `CLAUDE.md` imports it; other tools read it directly.

This file is the map: what exists, where it lives, and the rules that apply everywhere. Task details live in the skills below. Schemas and props live in the code.

## Project

An Astro starter for personal and project websites: posts, resources and legal pages, with technical SEO, swappable vendors and a brand guide built in. Everything site-specific lives in **`src/site.config.ts`**; the rest is the reusable shell. Turning the starter into a new site: **`SETUP.md`**.

Stack: Astro 7 (static output), TypeScript, Tailwind CSS 4, MDX, Satori + resvg for OG images, Lighthouse CI. Node is pinned in `.node-version`.

## Skills

Task playbooks in `.claude/skills/<name>/SKILL.md`: plain Markdown, usable by any tool (Claude Code loads them as `/name`). **Before doing one of these tasks, read its skill and follow it.** It's the source of truth for that task; this file only summarizes.

| Skill              | Use it to                                                                             |
| ------------------ | ------------------------------------------------------------------------------------- |
| `/run`             | start the dev server and check a change in the browser                                |
| `/brand`           | change colors, typography, voice and tone, or the brand pages under `/-/astro/brand/` |
| `/redirects`       | add or edit redirects                                                                 |
| `/og-images`       | change the social-share cards                                                         |
| `/analytics`       | enable, add or swap an analytics provider, or add a tracked event                     |
| `/structured-data` | add or edit schema.org JSON-LD                                                        |
| `/images`          | host, optimize and publish content images and post covers                             |
| `/update-deps`     | update npm packages, GitHub Actions and the Node version in staged, verified commits  |

## Commands

```
npm run dev              # dev server
npm run build            # production build; also compiles redirects + headers and emits OG cards
npm run preview          # serve dist/
npm run check            # type check (astro check; plain tsc can't read .astro)
npm run lint             # ESLint
npm test                 # unit tests (node:test), today the Markdown plugins
npm run format           # Prettier — run before every commit
npm run favicons         # rasterize public/brand-mark.svg into the favicon set
npm run build:redirects  # compile src/redirects/*.csv into the host's redirect file
npm run build:headers    # compile src/headers/headers.config.ts into the host's header file
npm run check:redirects  # CI: fail if the committed redirect file is stale
npm run check:headers    # CI: fail if the committed header file is stale
npm run check:sd         # after build: validate every JSON-LD block in dist/
npm run check:links      # after build: no broken internal links, no hard-coded own origin
npm run check:sitemap    # after build: every indexable page is in sitemap.xml, and only those
npm run check:origin     # after build: the image origin appears in no built file
npm run lhci:mobile      # Lighthouse CI (also lhci:desktop)
npm run timeline:blog    # write blog-timeline.csv
```

From an agent or other non-interactive shell, Astro starts `dev` and `preview` in the background: read the URL it prints (the port can differ from 4321 when that's taken) and stop the server with `npx astro dev stop` or `npx astro preview stop`. Never free a port by killing whatever listens on it. For several worktrees at once, give each a stable port: `PORT=$(( 4300 + $(echo "$PWD" | cksum | cut -d' ' -f1) % 100 ))`.

## CI

- **`ci.yml`** (every push and PR to `main`): format check, type check, lint, unit tests, redirect and header drift checks, build, then `check:sd`, `check:links`, `check:sitemap` and `check:origin`. The build turns analytics and captcha on only for pushes to `main`, so that build matches production. No secrets are needed: provider config is committed.
- **`lighthouse.yml`**: Lighthouse CI on every push and PR, always with analytics and captcha off.
- **`changelog.yml`**: a PR must change `CHANGELOG.md` unless it has the `no-changelog` label.

## Rules

- **Write short.** This applies to docs, skills, comments, the changelog and PR descriptions. Say each fact once, in the file that owns it, and link to it elsewhere. Use plain short sentences, with no filler, history or restating. Comments say why, not what the code does.
- **Format before committing** (`npm run format`). The Tailwind plugin owns class order; don't reorder classes by hand. Prefix intentionally unused variables with `_`.
- **Content dates.** When you edit a content entry, set its `contentModifiedDate` to today. It feeds the sitemap's `<lastmod>`.
- **Generated files** (`public/_headers`, `public/_redirects`, `vercel.json`, `redirects.json`, `customHeaders.json`) are committed but never edited by hand. Change the source, rebuild, commit both.
- **Changelog.** Every PR that changes the starter adds a line or two under `## [Unreleased]` in `CHANGELOG.md`: what changed and why, plus the PR link, under a Keep a Changelog heading (`Added`, `Changed`, `Fixed`, `Removed`, `Security`). No adoption steps; the PR has the code. If people who copied the starter must change their own code or content, add one **Breaking:** sentence saying what. Label a PR `no-changelog` only when there's nothing worth telling them.

### Scripts and the CSP

`script-src` has no `'unsafe-inline'` (`src/headers/headers.config.ts`), so an inline script that isn't explicitly allowed never runs in production.

- **Write client code as a bundled `<script>`** (no `is:inline`, no `define:vars`). Astro serves it from `/_astro`, which `'self'` covers; `vite.build.assetsInlineLimit: 0` stops it from being inlined. It runs once per page, deferred, however many times its component renders, so query the whole document. Pass build-time values through `data-*` attributes, or import them from a TS module.
- **No raw `<script is:inline>` outside `src/lib/inline-scripts.ts`.** That file holds the snippets that must run before first paint (today only GTM's loader). Components render them with `<script is:inline set:html={snippet} />`, and `headers.config.ts` hashes the same strings into `script-src`. After changing one, run `npm run build:headers`.
- **Exempt:** JSON-LD (`JsonLd.astro`; CSP ignores data blocks) and a vendor's external loader (`<script src="https://…" is:inline>`).
- **Third-party hosts reach the CSP by import.** Each provider's config module exports a `<NAME>_CSP` record of hosts per directive (empty while the provider is unconfigured), and `headers.config.ts` merges them in `providerSources`.

### Releases

Pick the version by the semver rule at the top of `CHANGELOG.md` (major = people who copied the starter must change their own code or content). `package.json` `version` is the latest release.

1. In a PR, rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD`, add an empty `## [Unreleased]` above it, update the link references at the bottom, set `package.json` `version`, and run `npm install --package-lock-only`.
2. After it merges, tag and publish (people watching the repo for releases get notified):

   ```bash
   git fetch origin && git tag vX.Y.Z origin/main && git push origin vX.Y.Z
   gh release create vX.Y.Z --title "vX.Y.Z" --notes "<that version's section of CHANGELOG.md>"
   ```

## How the site is put together

### Site config

`src/site.config.ts` holds the domain, name, default description, nav links, standing asks (`asks`, the CTA links), site owner (`organization`), contact email, repo link, copyright, and `platform` (`deploy` target and `imagesCDNHost`). Layouts, the home page, RSS, the sitemap and `astro.config.mjs` read it. The brand pages read only `site.name`; their copy is written in the pages.

### Content

Collections are defined in `src/content.config.ts` (Content Layer API, `glob()` loaders; read the Zod schemas there). Entries are rendered with `render(entry)` from `astro:content`, and `entry.id` is the slug.

- **`blog`**: files are `src/content/blog/{order}-{slug}.{md,mdx}`. A higher `order` is newer; it drives the list and prev/next links. Each post carries its own `author`.
- **`resources`**: `type: "page"` renders `/resources/{slug}/`; `type: "link"` is only an outbound `url`. A resource with both `form` and `asset` is an email gate: the form backend emails the asset and redirects to `/thank-you/resources/{slug}/`, which also offers a direct download. Host assets outside the repo. This isn't access control: anyone with the URL can download.
- **`legal`**: privacy and terms.
- **`robots`** (any entry): robots directives merged into the page's `<meta name="robots">`. A noindex entry also leaves the sitemap. The path-level equivalent is an `X-Robots-Tag` rule in `headers.config.ts`; the sitemap honors both (`src/lib/robots.ts`, `src/lib/noindex.ts`).

**Page registry.** Collections that render a page per entry are listed once in `src/lib/page-collections.ts`. Both the sitemap (`src/pages/sitemap.xml.ts`) and the OG card manifest (`src/og/manifest.ts`) read that list. A new section therefore means: define the collection (with `title`, `description`, `publishDate`, `contentModifiedDate`, `robots`), add its `[...slug].astro` route, and register it. `check:sitemap` fails if you forget the last step.

**Standalone pages** (`/` and `/blog/`) export a `meta` object from their frontmatter (type: `src/standalone-page.d.ts`). The page's layout props, its OG card and its sitemap `<lastmod>` all read it. `title` and `description` are optional but go together; the build fails if only one is set.

### URLs

```
/                         home (landing page)
/blog/  /blog/{slug}/     blog list, posts
/resources/{slug}/        resource pages
/legal/{slug}/            privacy, terms
/thank-you/{slug}/        after a form submit (noindex)
/rss.xml  /sitemap.xml  /site.webmanifest
/og/{path}.png            OG cards (built)
/-/astro/health           returns "ok" and the commit hash
/-/astro/brand/{page}/    brand guide (noindex)
```

### Layouts

- **`BaseLayout`**: every page's shell (nav, footer, fonts, meta, analytics). Notable props: `wide` (full-width `<main>` for pages that manage their own sections; default is a centered reading column), `canonical` (`true` = own URL, `false` = none, a string = another URL), `robots`.
- **`PostLayout`**, **`ResourceLayout`**, **`LegalLayout`** wrap it. `PostLayout` adds the `BlogPosting` JSON-LD, author bio, prev/next links and the `post_viewed` event.
- **`BrandLayout`**: a bare, noindex canvas for the brand pages.

Every absolute URL (canonical, `og:url`, OG image, JSON-LD) comes from `siteUrls(Astro)` in `src/lib/urls.ts`. `absoluteUrl()` uses the production origin. `currentAbsoluteUrl()` uses the origin of the current deployment, so OG images resolve on dev servers and preview deploys (`src/lib/deploy.ts` detects the host's preview URL).

### Markdown

`astro.config.mjs` uses the unified processor, `unified({...})` from `@astrojs/markdown-remark`, for both `.md` and `.mdx`. The plugins live in `src/markdown/`, one file each with a `*.test.ts` beside it (`npm test`); `index.ts` sets their order. They are:

- `remark-definition-list` for `<dl>` lists;
- `remarkImgTags`: a raw `<img>` is treated like `![]()`, so origin images are optimized (`/images`);
- `rehypeDefinitionListIds`: an `id` on every `<dt>`, for anchor links;
- `rehypeTables`: a `: Caption` line right after a pipe table becomes its `<caption>`, and every table sits in a focusable scroll box (`[data-table-scroll]`, styled in `global.css`), so a wide one scrolls instead of widening the page;
- `rehypeExternalLinks`: `target="_blank"` and `data-external` on outbound links, `data-resource` on `/resources/` links, `data-anchor` on `#` links (the prose styles key off these);
- `rehypeCodeBlockCopy`: a Copy button on every code block, wired up in `Prose.astro`.

Code is highlighted by Shiki (`catppuccin-mocha`, chosen for WCAG AA contrast).

### Styling

Colors come from `src/design-tokens.mjs`: Tailwind's palettes under a `zmoki-` prefix plus custom scales, used as `zmoki-*` utility classes (no inline hex). The look is an ivory canvas, warm greys and one indigo accent:

| Use                     | Classes                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Links, buttons, CTAs    | `zmoki-indigo-600` (hover `-700`, focus ring `-500`)                                      |
| Text and headings       | `zmoki-stone-900`; secondary text `zmoki-stone-500` or `-600`                             |
| Page background         | `zmoki-cream-100`                                                                         |
| Cards and panels        | `bg-white border border-zmoki-stone-200 rounded-2xl shadow-sm`                            |
| Soft accent fill, pills | `bg-zmoki-indigo-50 border-zmoki-indigo-100`; `bg-zmoki-indigo-100 text-zmoki-indigo-700` |
| Text on accent fills    | `text-white`                                                                              |

Every text and background pair must pass WCAG AA. Font families are also in `design-tokens.mjs`, self-hosted through the Astro Fonts API. Styles enter through `src/styles/global.css`. **For any color, font or brand-page change, use `/brand`.**

### Swappable providers

Analytics, forms and captcha follow the same pattern: a dispatcher component, one component per provider, and committed config (not env vars) in a `*-config.ts` module where the CSP needs the provider's hosts.

- **Analytics** (`Analytics.astro`, `analytics/`): several providers at once. Call sites only use `window.track?.(event, props)` and `window.identify?.(id, props)`; each provider chains onto those, so a call reaches every provider. Built in: PostHog and Google Tag Manager. Off unless `PUBLIC_ANALYTICS_ENABLED=true`; while off, a console provider logs every call instead. Every event the site fires: `src/ANALYTICS.md`. Adding an event or a provider: `/analytics`.
- **Forms** (`Form.astro`, `forms/`): one provider, the first in `Form.astro`'s list. Built in: Brevo (`BREVO_ACCOUNT_ID` in `forms/brevo.astro`). The backend validates the captcha, stores the contact, emails the asset and redirects to the thank-you page, so swapping the frontend alone isn't enough.
- **Captcha** (`Captcha.astro`, `captcha/`): one provider, since two widgets would send competing tokens. Built in: Cloudflare Turnstile. Off unless `PUBLIC_CAPTCHA_ENABLED=true`. It must match the captcha configured on the form backend; the widget's extra `g-recaptcha` class is what Brevo looks for.

`PUBLIC_ANALYTICS_ENABLED` and `PUBLIC_CAPTCHA_ENABLED` are the only env vars (declared in `src/env.d.ts`, which also types the `window` globals). Both turn on only for the literal string `"true"`.

### Hosting

The build is a static `dist/` for Cloudflare Pages (the reference host), Netlify, Vercel or AWS Amplify, chosen by `site.platform.deploy`. Only redirects and headers are host-specific, and both compile from neutral sources:

- **Redirects**: CSVs in `src/redirects/`. See `/redirects`.
- **Headers**: rules in `src/headers/headers.config.ts` (see `src/headers/README.md`): `noindex` on `/-/astro/*` and `/thank-you/*`, and the security set (CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, …) on every path. If your CDN also sets security headers, remove them there to avoid duplicates.

Pushing to `main` deploys, through the host's GitHub integration; PRs get preview deploys. A preview build (a PR or non-production branch, detected by `isPreviewBuild` in `src/lib/deploy.ts`) adds `noindex` to every page's robots meta, since not every host can set `X-Robots-Tag` per deployment. It's only a hint to crawlers: to keep previews private, put access control on them. Cloudflare and Netlify build with the Node from `.node-version`; Amplify needs it set in its build settings.

### Images

Content images are optimized at build (`astro:assets`), from files in `src/images/` or from a remote origin (`site.platform.imagesCDNHost`). Use `src/components/Image.astro`, which also emits the image's license JSON-LD, or Markdown `![]()`. A post's optional `cover` is its hero, its `BlogPosting.image` and its image-sitemap entry. The origin is never published: image URLs go through `src/lib/images.ts`, and `check:origin` enforces it. Details: `/images`.

### OG images

Each page gets a 1200×630 PNG card rendered at build time (`src/og/`, endpoint `src/pages/og/[...path].png.ts`). The manifest (`src/og/manifest.ts`) lists every card from the page registry and the standalone pages; colors come from the design tokens. The cards use their own font files in `src/og/fonts/`, so a font swap must update those too. Details: `/og-images`.

### Brand mark and favicons

`public/brand-mark.svg` is the one source for the favicons, the nav logo and the mark on OG cards. Keep it a square, full-bleed SVG. After replacing it, run `npm run favicons` and commit the generated icons. The web manifest (`src/pages/site.webmanifest.ts`) reads the name from the site config and its colors from the OG theme.
