# Setup checklist

Everything to do to turn this starter into your own site, top to bottom. Each step says what to set and where; the linked skill (`.claude/skills/<name>/SKILL.md`) has the details. You can also ask your AI agent to work through this file with you.

> **Staying up to date.** Your copy won't get starter updates by itself. Keep `package.json` `version` as it is: it records the starter release you began from. Watch [the repo](https://github.com/Zmoki/zmoki-astro-starter) with **Custom → Releases** to hear about new ones; each release and `CHANGELOG.md` say what changed, with links to the PRs.

## 1. Site config

In **`src/site.config.ts`**, set:

- `domain`: your production URL, no trailing slash
- `name`: the site name (logo alt text, page titles, OG cards, RSS)
- `description`: the default meta description
- `nav`: top-nav links (`/#features` anchors or `/blog/` routes)
- `organization.name` and `organization.url`: the site owner in the footer, also credited on content images
- `organization.logo`: the owner's logo for search engines (a square PNG, 112px or more); the default is the brand mark
- `contact.email`: the footer Contact link
- `social.github`: the footer GitHub link
- `asks`: your standing calls to action (the template's "Get started" buttons use `use_template`). A click on any link to one is tracked as `cta_clicked`
- `copyright.year`: the first year in the footer copyright
- `copyright.images.license`: the license URL for content images, e.g. your terms page

Also update the `Sitemap:` line in **`public/robots.txt`**.

The home page is written directly in `src/pages/index.astro`.

## 2. Brand

- **Colors.** The default is an ivory canvas, warm greys and an indigo accent. To use another Tailwind color, replace `zmoki-indigo` (e.g. with `zmoki-emerald`) across `src/`. For a custom brand color, add a scale to `src/design-tokens.mjs`. Either way, follow `/brand`. Preview at `/-/astro/brand/color/`.
- **Brand mark.** Replace **`public/brand-mark.svg`** with your own square, full-bleed SVG (the art fills its own background; transparent corners look broken on phone home screens). It drives the favicons, the nav logo and the OG cards. Then run `npm run favicons` and commit the generated icons.
- **Fonts.** The site uses one sans for headings and body and a mono for code, self-hosted. To change them, follow `/brand`. Preview at `/-/astro/brand/typography/`.
- **Brand pages.** The guide under `/-/astro/brand/` is internal (noindex). Its copy is written in the pages, so edit them directly, especially `voice.astro`, whose example house style you'll want to replace.

## 3. Content

- `src/content/blog/`: `1-set-up-your-site.mdx` is the example post. Each post's `author` is a person's id: replace `src/content/people/zarema-khalilova.yaml` with yourself. A higher `order` is newer.
- `src/content/resources/`: `new-website-seo-checklist.mdx` shows the shape. `type: "page"` makes a page; `type: "link"` is only an outbound link.
- `src/content/legal/`: `privacy.mdx` and `terms.mdx` are **placeholders, not legal advice**. Fill them in and have them reviewed before launch.

Commit images under `src/images/`, or host them on a bucket or CDN and set `platform.imagesCDNHost` in the site config; give posts a `cover` photo for Google Discover. See `/images`. When you edit a content file, set its `contentModifiedDate` to today.

## 4. Analytics, forms and captcha (optional)

Config is committed in the files below; no `.env` is needed. Analytics and captcha stay off until your host's production environment sets `PUBLIC_ANALYTICS_ENABLED=true` / `PUBLIC_CAPTCHA_ENABLED=true`. Run `npm run build:headers` after changing any provider config, so the CSP picks up its hosts.

- **PostHog**: `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` in `src/components/analytics/posthog-config.ts`.
- **Google Tag Manager**: `GTM_CONTAINER_ID` in `src/components/analytics/gtm-config.ts`. Custom HTML tags won't run under the strict CSP; use built-in tags or custom templates, and add any extra hosts to `GTM_CSP`.
- **Brevo forms**: `BREVO_ACCOUNT_ID` in `src/components/forms/brevo.astro`, plus a `form` block with a `formId` in a resource's frontmatter.
- **Cloudflare Turnstile**: `TURNSTILE_SITE_KEY` in `src/components/captcha/turnstile-config.ts`. It must be the captcha configured on your Brevo form, which validates the token.

Other providers: `/analytics`, and AGENTS.md → Swappable providers.

## 5. Deploy

1. Set `platform.deploy` in the site config: `"cloudflare"` (default), `"netlify"`, `"vercel"` or `"amplify"`.
2. Run `npm run build:redirects` and `npm run build:headers`, delete the old host's files if the scripts warn about them, and commit.
3. Connect the host to your GitHub repo so pushing to `main` deploys. On AWS Amplify, also set the Node version from `.node-version` in its build settings.

Redirects go in `src/redirects/*.csv` (see `/redirects`); headers in `src/headers/headers.config.ts`. If your CDN or DNS layer already sets security headers, remove them there to avoid duplicates.

## 6. Lighthouse reports

`lighthouse.yml` runs Lighthouse CI on every push and PR and fails below 0.90 in any category (`lighthouserc.cjs`). Choose where the full reports go with `upload.target` in `lighthouserc.cjs`:

- **`temporary-public-storage`** (default): public links, deleted after a few days. The PR comment links to them.
- **`filesystem`**: reports only in the run's `lighthouse-reports` artifact (kept 30 days). Private, but you download them to view.
- **`lhci`**: your own [Lighthouse CI server](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/server.md), with score history. You run the server.

The PR comment step in `lighthouse.yml` reads `.lighthouseci/links.json`, which only the first and last options write.

## 7. Verify

```bash
npm run format && npm run check && npm run lint && npm run build
```

All four should pass before you push.
