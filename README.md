# zmoki-website-starter

An Astro starter for personal websites — posts, projects, and resources. Built from [zmoki.xyz](https://zmoki.xyz) and genericized into a reusable template.

## What's inside

- **Astro 5** + **Tailwind CSS** with a small, documented design-token system
- **MDX** content with a custom pipeline: anchor links, external-link styling, copy buttons on code blocks, definition lists
- Three content collections: `blog`, `resources`, `legal`
- RSS feed, sitemap, and OG image generation (Puppeteer)
- **PostHog** analytics and **Brevo** email forms, wired and ready
- A living brand/design-system reference at `/-/astro/brand/` (internal, noindex)
- One config file (`src/site.config.ts`) for everything site-specific
- CI (format, type check, lint, build) and Lighthouse CI

## Quick start

```bash
npm install
npm run dev          # http://localhost:4321
```

Then follow **[SETUP.md](./SETUP.md)** to make it yours.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview the built site
- `npm run build:full` — build + generate OG images
- `npm run og:generate` — generate OG images (needs the preview server running)
- `npm run timeline:blog` — generate `blog-timeline.csv`
- `npm run check` — type check (`astro check`)
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npm run lhci:mobile` / `npm run lhci:desktop` — Lighthouse CI

## Project structure

```
src/
├── site.config.ts   # everything site-specific (edit this first)
├── design-tokens.mjs# color palette (re-skin here)
├── components/       # reusable Astro components
├── content/          # MDX/Markdown content
│   ├── blog/         # posts
│   ├── legal/        # privacy, terms
│   └── resources/    # resource pages and links
├── images/           # content images
├── layouts/          # page layouts
└── pages/            # routes (incl. /-/astro/brand/ design system)
```

## Docs

- **[SETUP.md](./SETUP.md)** — the checklist for spinning up a new site
- **[AGENTS.md](./AGENTS.md)** — full technical spec (also read by AI tools)
