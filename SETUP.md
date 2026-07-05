# Setup checklist

Everything you need to do to turn this starter into your own site. Work top to bottom.

## 1. Site config

Edit **`src/site.config.ts`** — this is the main one. Set:

- `domain` — your production URL, no trailing slash
- `name` — the logo/wordmark in the nav and footer
- `description`, `ogSiteName`, `feedDescription` — metadata and RSS titles
- `nav` — the top-nav links (label + href; anchors like `/#features` or routes like `/blog/`)
- `organization.name` and `organization.url` — the site owner shown in the footer copyright (also the content-image credit)
- `contact.email` — the footer Contact link and mailto target
- `social.github` — the footer "Source" link
- `copyrightStartYear`

The home page (`src/pages/index.astro`) is a landing page, edited directly in that file. The blog list lives at `src/pages/blog/index.astro` (`/blog/`).

Then set the domain in two more places:

- **`astro.config.mjs`** → `site:` (used for canonical URLs, RSS, sitemap)
- **`public/robots.txt`** → the `Sitemap:` line

## 2. Palette & typography

The starter is a **bright, warm, minimal** look — an ivory canvas (`zmoki-cream`), warm-grey text/borders (`zmoki-stone`), and a single **indigo** accent (`zmoki-indigo`). All of Tailwind's palettes are generated under the `zmoki-` prefix (`zmoki-red`, `zmoki-blue`, …), so to re-skin you have two options:

- **Use a built-in Tailwind color** — no token edits. Find/replace `zmoki-indigo` → e.g. `zmoki-emerald` across `src/` to swap the accent site-wide, or change it only on the elements you want recolored (links, nav button, CTA). Swap `zmoki-cream`/`zmoki-stone` the same way to change the canvas or greys.
- **Use a custom brand color** (not in Tailwind) — build a full `50`→`950` scale and add it to **`src/design-tokens.mjs`**:
  1. Pick your base color. On [colorhexa.com](https://www.colorhexa.com/), enter its hex — that's your `500`.
  2. In the **"Shades and Tints"** section, read off the ramp: the lighter **tints** (toward white) become `400 300 200 100 50`, your base is `500`, and the darker **shades** (toward black) become `600 700 800 900 950`. Pick by eye for even spacing.
  3. Add the scale to `customPalettes` in `design-tokens.mjs` (the `zmoki-cream` scale already there is the worked example). It becomes a `zmoki-<name>-*` utility and shows on the reference page.

Preview everything at `/-/astro/brand/color/`. The favicon at `public/favicon.svg` uses the same colors — swap it for your own.

Type is **self-hosted via [Astro's Fonts API](https://docs.astro.build/en/guides/fonts/)** and wired into Tailwind's `font-sans` / `font-serif` / `font-mono` families through CSS variables — the site is **all-sans**: one sans for headings and body, a mono for code (`font-serif` stays available but unused). The family names live in `src/design-tokens.mjs` (`export const fonts`). To change them, run **`/brand`** — it walks the full swap (the names in `src/design-tokens.mjs`, the provider/axes in `astro.config.mjs`, and the brand specimen). Preview at `/-/astro/brand/typography/`.

## 3. Content

Replace the placeholder content:

- `src/content/blog/` — `1-about-me.mdx` and `2-example-post.mdx` are examples. Each post's frontmatter carries its own `author` (`name`, `url`, `bio`) for the byline. Higher `order` = newer.
- `src/content/resources/` — `example-resource.mdx` shows the shape. `type: "page"` makes a page; `type: "link"` is just an outbound link.
- `src/content/legal/` — `privacy.mdx` and `terms.mdx` are **placeholders, not legal advice**. Fill in the bracketed bits and review before launch.

Add content images to `src/images/`. Whenever you edit a content file, bump its `contentModifiedDate`.

## 4. Brand / design-system pages

The pages under `/-/astro/brand/` are a living style guide (internal, noindex). They read the site name from `site.name`; the rest of the copy is written directly in the pages. Edit them there — especially **`voice.astro`**, which still carries an example "house style" you'll want to rewrite for your own project.

## 5. Analytics and forms (optional but wired)

Copy `.env.example` to `.env` and fill in what you use (every var is declared and documented in `src/env.d.ts`). The features and the vars that unlock them:

- **Analytics** — provider-agnostic and multi-provider; set the env vars for the tools you use and each activates on its own. Built in:
  - **PostHog** — `PUBLIC_POSTHOG_PROJECT_TOKEN`, `PUBLIC_POSTHOG_HOST`.
  - **Google Tag Manager** — `PUBLIC_GTM_CONTAINER_ID` (`GTM-XXXXXXX`); wire GA4/Ads/etc. inside the GTM UI.
  - `PUBLIC_ANALYTICS_ENABLED=false` turns **all** analytics off (e.g. in dev). If you use a GTM host beyond the defaults, allowlist it in the CSP in `src/headers/headers.config.ts` (then `npm run build:headers`). See AGENTS.md → Analytics to add another provider.
- **Forms** — provider-agnostic email capture (like analytics), single-select. Built in: **Brevo** — set `PUBLIC_BREVO_ACCOUNT_ID`, plus a `form` block (with `formId`) in a resource's frontmatter to show a signup form. To swap the backend, see AGENTS.md → Forms.
- **Captcha** — provider-agnostic bot protection on forms (like analytics), single-select. Built in: **Cloudflare Turnstile** — set `PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`. `PUBLIC_CAPTCHA_ENABLED=false` turns it off (e.g. in dev). To swap in reCAPTCHA/hCaptcha, see AGENTS.md → Captcha. Note: the provider must also be the one configured on your Brevo form, which validates the token.

All are optional — the site builds and runs without them.

## 6. Deploy

Set up hosting. The starter is platform-agnostic — it builds to a static `dist/` any host serves — and supports **Cloudflare Pages** (the default), **Netlify**, **Vercel**, and **AWS Amplify**. Connect your host to the GitHub repo so pushing to `main` deploys (Cloudflare Pages, Netlify, and Vercel all support push-to-deploy).

**Pick your platform for redirects.** Redirects are authored once as CSV in `src/redirects/` and compiled to whatever your host expects. Set `deploy.platform` in **`src/site.config.ts`**:

| `platform`               | Compiles to         | Host                                   |
| ------------------------ | ------------------- | -------------------------------------- |
| `"cloudflare"` (default) | `public/_redirects` | Cloudflare Pages                       |
| `"netlify"`              | `public/_redirects` | Netlify                                |
| `"vercel"`               | `vercel.json`       | Vercel (`redirects[]` merged)          |
| `"amplify"`              | `redirects.json`    | AWS Amplify (paste into console / IaC) |

Then run `npm run build:redirects` (it also runs automatically on every `npm run build`). Add redirects by editing the CSVs — see the `/redirects` skill. If you switch platforms, delete the stale artifact from the old one (the build warns you which).

The generated artifact is **committed** — run `npm run build:redirects` and commit it alongside any CSV change. CI runs `npm run check:redirects` and fails if the committed artifact is out of date, so drift can't reach production.

Response headers work exactly like redirects: author them platform-neutrally in `src/headers/headers.config.ts`, run `npm run build:headers`, and commit the regenerated artifact for your platform (`public/_headers` / `vercel.json` / `customHeaders.json`). CI's `npm run check:headers` guards drift. See `src/headers/README.md` and the **Deploy & infrastructure** section in `AGENTS.md`. **Note:** the config ships the standard security headers (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, …); if your CDN/DNS layer also sets them, drop them there to avoid duplicates.

## 7. Lighthouse report hosting

The `lighthouse.yml` workflow runs Lighthouse CI on every push and PR to `main`, asserting each category scores ≥ 0.90 (config: `lighthouserc.cjs`). By default it publishes the full interactive reports so you can view them in the browser — the PR comment links to each one. Pick how those reports are hosted by setting `upload.target` in **`lighthouserc.cjs`**:

- **`temporary-public-storage`** (default) — uploads each report to Google-hosted storage and prints a **public URL**. Zero infrastructure, one line of config. Trade-off: reports are **public** (anyone with the link) and **ephemeral** (deleted after ~a few days). Good default for a personal site.
- **`filesystem`** — writes the HTML/JSON reports to `outputDir` (e.g. `./.lighthouseci`) only. Nothing is hosted; you download them from the run's `lighthouse-reports` artifact (the workflow's upload step sets `include-hidden-files: true` so the dot-directory is archived). Private, permanent-ish (30-day artifact retention), but not viewable on the web without downloading. To also publish these HTML files, add a deploy step that pushes them to **GitHub Pages** or a **Cloudflare Pages** project.
- **LHCI server** (`target: "lhci"`) — a self-hosted [Lighthouse CI server](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/server.md) gives a persistent dashboard with score trends over time and commit-to-commit diffs. Most capable, but you run a server + database.

Whichever you choose, keep the `PR comment` step in `lighthouse.yml` in sync — it reads `.lighthouseci/links.json` (written by the `temporary-public-storage` and `lhci` targets) to link the hosted reports.

## 8. Verify

```bash
npm run format
npm run check
npm run lint
npm run build
```

All four should pass clean before you push.
