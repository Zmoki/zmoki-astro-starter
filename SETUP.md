# Setup checklist

Everything you need to do to turn this starter into your own site. Work top to bottom.

## 1. Site config

Edit **`src/site.config.ts`** — this is the main one. Set:

- `domain` — your production URL, no trailing slash
- `name` — the logo/wordmark in the nav and footer
- `description`, `ogSiteName`, `feedDescription` — metadata and RSS titles
- `nav` — the top-nav links (label + href; anchors like `/#features` or routes like `/blog/`)
- `cta` — the primary button, reused in the nav and the hero
- `hero.heading` and `hero.subhead` — the landing-page headline and subhead
- `finalCta` — the closing CTA band (heading, text, and its own button)
- `author.name` and `author.aboutSlug` — the post author bio and its link
- `contact.email` — the footer Contact link and mailto target
- `social.sourceRepo` — the footer "Source" link
- `copyrightStartYear`

The home page (`src/pages/index.astro`) is a landing page (hero → features → final CTA); the feature cards are a placeholder array in that file. The blog list lives at `src/pages/blog/index.astro` (`/blog/`).

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

Type is Google Fonts wired into Tailwind's `font-sans` / `font-serif` / `font-mono` families — the site is **all-sans**: Noto Sans for headings and body, Noto Sans Mono for code (`font-serif` stays available but unused). To change them, run **`/brand`** — it walks the full swap (Tailwind families, both layout font links, and the brand specimen). Preview at `/-/astro/brand/typography/`.

## 3. Content

Replace the placeholder content:

- `src/content/blog/` — `1-about-me.mdx` and `2-example-post.mdx` are examples. Keep `about-me` (or repoint `author.aboutSlug`). Higher `order` = newer.
- `src/content/resources/` — `example-resource.mdx` shows the shape. `type: "page"` makes a page; `type: "link"` is just an outbound link.
- `src/content/legal/` — `privacy.mdx` and `terms.mdx` are **placeholders, not legal advice**. Fill in the bracketed bits and review before launch.

Add content images to `src/images/`. Whenever you edit a content file, bump its `contentModifiedDate`.

## 4. Brand / design-system pages

The pages under `/-/astro/brand/` are a living style guide (internal, noindex). They use the placeholder name `My Project X` and aren't wired to `site.config`. Edit them directly — especially **`voice.astro`**, which still carries an example "house style" you'll want to rewrite for your own project.

## 5. Analytics and forms (optional but wired)

Copy `.env.example` to `.env` and fill in what you use:

- **Analytics** — provider-agnostic and multi-provider; set the env vars for the tools you use and each activates on its own. Built in:
  - **PostHog** — `PUBLIC_POSTHOG_PROJECT_TOKEN`, `PUBLIC_POSTHOG_HOST`.
  - **Google Tag Manager** — `PUBLIC_GTM_CONTAINER_ID` (`GTM-XXXXXXX`); wire GA4/Ads/etc. inside the GTM UI.
  - `PUBLIC_ANALYTICS_ENABLED=false` turns **all** analytics off (e.g. in dev). If you use a GTM host beyond the defaults, allowlist it in the CSP in `public/_headers`. See AGENTS.md → Analytics to add another provider.
- **Brevo** — `PUBLIC_BREVO_ACCOUNT_ID`, plus a `form` block in a resource's frontmatter to show a signup form.
- **Cloudflare Turnstile** — `PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` for bot protection on forms.

All are optional — the site builds and runs without them.

## 6. Deploy

Set up hosting (the original uses Cloudflare Pages on the `main` branch — every push deploys).

**Pick your platform for redirects.** Redirects are authored once as CSV in `src/redirects/` and compiled to whatever your host expects. Set `deploy.platform` in **`src/site.config.ts`**:

| `platform`               | Compiles to         | Host                                   |
| ------------------------ | ------------------- | -------------------------------------- |
| `"cloudflare"` (default) | `public/_redirects` | Cloudflare Pages                       |
| `"netlify"`              | `public/_redirects` | Netlify                                |
| `"vercel"`               | `vercel.json`       | Vercel (`redirects[]` merged)          |
| `"amplify"`              | `redirects.json`    | AWS Amplify (paste into console / IaC) |

Then run `npm run build:redirects` (it also runs automatically on every `npm run build`). Add redirects by editing the CSVs — see the `/redirects` skill. If you switch platforms, delete the stale artifact from the old one (the build warns you which).

The generated artifact is **committed** — run `npm run build:redirects` and commit it alongside any CSV change. CI runs `npm run check:redirects` and fails if the committed artifact is out of date, so drift can't reach production.

Update `public/_headers` (Cloudflare/Netlify header rules) as needed. See the **Deploy & infrastructure** section in `AGENTS.md`.

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
