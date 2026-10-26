# zmoki-astro-starter

An Astro starter for personal and project websites (posts, resources, legal pages), built to be **maintained through an AI coding agent**. The technical SEO is done and guarded by CI, every vendor is swappable, and the brand guide lives inside the site. Built from [zmoki.xyz](https://zmoki.xyz) and made generic.

**Live demo: [starter.zmoki.xyz](https://starter.zmoki.xyz/)**

[![Security Headers](https://img.shields.io/badge/security%20headers-A-brightgreen)](https://securityheaders.com/?q=https%3A%2F%2Fstarter.zmoki.xyz%2F&followRedirects=on)
[![Lighthouse](https://img.shields.io/badge/lighthouse-100%2F100%2F100%2F100-brightgreen)](https://starter.zmoki.xyz/)

## Features

**Technical SEO, guarded by CI**

- Sitemap with image entries, built from one registry of page types; CI fails if an indexable page is missing or a noindex page is listed.
- Canonical, Open Graph and JSON-LD URLs from one helper, so they can't drift apart. Cross-posts can point their canonical at the original.
- Robots rules per page (frontmatter) and per path (response headers).
- schema.org JSON-LD, validated on every build.
- A 1200×630 social card for every page, rendered at build time in the site's own colors.
- Post covers ready for Google Discover.
- CI fails on broken internal links.

**No vendor lock-in**

- Deploys to Cloudflare Pages, Netlify, Vercel or AWS Amplify. Redirects and headers are written once and compiled for the host.
- Analytics (PostHog and Google Tag Manager built in, several at once), forms (Brevo) and captcha (Cloudflare Turnstile) sit behind small dispatchers, so swapping one is a single component.
- Content images can live on any bucket or CDN; Astro optimizes them at build.

**Brand system.** An internal style guide at `/-/astro/brand/` (color, typography, forms, components, voice, OG cards), rendered from the same design tokens the site uses. Fonts are self-hosted.

**Fast and locked down.** Static output, Lighthouse 100 in all four categories (checked in CI), and security headers including a strict CSP with no inline scripts.

## Working with an AI agent

[`AGENTS.md`](./AGENTS.md) is the technical guide every coding agent reads (`CLAUDE.md` imports it), and `.claude/skills/` holds eight task playbooks in plain Markdown. A session looks like this:

```
> Re-skin the site to a green accent
  Claude reads the /brand skill, swaps zmoki-indigo for zmoki-emerald,
  checks WCAG AA contrast on every affected pair, and shows you
  /-/astro/brand/color/ to review.

> Redirect /my-old-post to /blog/new-post
  Claude reads the /redirects skill, adds a row to src/redirects/blog.csv,
  rebuilds the host's redirect file, and commits both.

> Add Plausible analytics alongside PostHog
  Claude reads the /analytics skill, adds a provider component and its
  config, registers it, and adds its hosts to the CSP.

> Move the site from Cloudflare to Netlify
  Claude changes platform.deploy in src/site.config.ts and regenerates
  the redirect and header files.
```

## Start a site from this template

Pick one:

```bash
npm create astro@latest my-new-site -- --template Zmoki/zmoki-astro-starter
```

- or **Use this template → Create a new repository** on [GitHub](https://github.com/Zmoki/zmoki-astro-starter), if you want a hosted repo for push-to-deploy from the start;
- or clone it and drop the history: `git clone https://github.com/Zmoki/zmoki-astro-starter.git my-new-site && cd my-new-site && rm -rf .git && git init`.

Then run `npm install` and `npm run dev`, and work through **[SETUP.md](./SETUP.md)**, or ask your AI agent to go through it with you. To see what changed in the starter since you copied it, read **[CHANGELOG.md](./CHANGELOG.md)**.

## Project structure

```
src/
├── site.config.ts     # everything site-specific (edit this first)
├── design-tokens.mjs  # colors and font families
├── content.config.ts  # content collection schemas
├── content/           # blog/, resources/, legal/
├── components/        # components, plus analytics/, forms/, captcha/ providers
├── layouts/           # Base, Post, Resource, Legal, Brand
├── pages/             # routes, including the /-/astro/brand/ guide
├── lib/               # URLs, page registry, robots, inline scripts
├── og/                # social card templates and manifest
├── headers/           # response-header rules
├── redirects/         # redirect CSVs
├── images/            # committed content images
└── styles/            # Tailwind entry point
```

## Docs

- **[SETUP.md](./SETUP.md)**: the checklist for a new site
- **[AGENTS.md](./AGENTS.md)**: how the code fits together, commands, CI and conventions
- **[CHANGELOG.md](./CHANGELOG.md)**: what changed, and how to bring it into your copy
- **`.claude/skills/`**: playbooks for recurring tasks
