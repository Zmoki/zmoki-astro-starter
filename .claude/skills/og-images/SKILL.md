---
description: Customize the Open Graph / social-share image cards — layout, colors, fonts, text, dimensions, add a template variant, or change which pages get a card. Use when the user wants to change how link previews / social cards / OG images look.
---

# OG images

Social-share cards (the image shown when a page is posted to X, Slack, LinkedIn, …). They are **purpose-built cards rendered at build time** by Satori (vdom → SVG) then resvg (SVG → PNG) — no browser, no running server, nothing committed. `astro build` emits them to `dist/og/**/*.png`; `astro dev` renders the same route on request.

## Model

Everything lives in `src/og/` plus one endpoint. Edit the file that owns what you're changing:

| File                               | Owns                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/og/manifest.ts`               | **Which** pages get a card + each card's text (`title`, `description`, `eyebrow`, `alt`) |
| `src/og/card.ts`                   | **How** the cards look — the `article` and `site` layouts (Satori nodes)                 |
| `src/og/theme.ts`                  | Card colors (from design tokens) + dimensions (`OG_WIDTH`/`OG_HEIGHT`)                   |
| `src/og/fonts.ts` + `fonts/*.woff` | The card font (Noto Sans subset)                                                         |
| `src/og/types.ts`                  | `OgEntry` shape + the `OgTemplate` union                                                 |
| `src/pages/og/[...path].png.ts`    | The endpoint: `getStaticPaths` from the manifest → render → PNG                          |

The **manifest is the single source of truth**, shared by the endpoint (to render every card) and `BaseLayout.astro` (for each page's `og:image` + `og:image:alt`, via `getOgImage(pathname)`). Pages with no entry fall back to the `default` card.

## Preview loop

There is no separate generate step. To see a change:

```bash
# dev: hit the route directly (renders on request)
npm run dev        # then open /og/index.png, /og/blog/<id>.png, /og/default.png
# or build: emits every card
npm run build      # then open dist/og/**/*.png
```

Read the PNG to eyeball it. Always finish with a build (below).

## Common edits

### Change the card colors

Cards read from the design tokens, so a **re-skin does this for you** — run the `brand-colors` skill and the cards follow. To tune only the cards, edit the token picks in `src/og/theme.ts` (`bg`, `ink`, `muted`, `accent`, …). Every value is passed through `culori`'s `formatHex` (see Gotchas).

### Change the card font

Edit `src/og/fonts.ts` and drop the new `.woff`/`.ttf` (Satori needs the file, not a CSS `@font-face`) into `src/og/fonts/`, then use its `name` in `card.ts` styles. **This is separate from the site's Google Fonts** — if you swap the brand typeface (`brand-typography` skill), update these too or the cards won't match.

### Tweak a card's layout or copy

Edit `articleCard` / `siteCard` in `src/og/card.ts`. They're built with a tiny `el(type, style, children)` helper (React-like Satori nodes — no JSX). To change the _text_ on a card (e.g. the eyebrow format, or the site card's tagline), edit `src/og/manifest.ts` instead.

### Add a new template variant

1. Add the name to the `OgTemplate` union in `src/og/types.ts`.
2. Write a `fooCard(entry)` builder in `src/og/card.ts` and route to it in `renderCard`.
3. In `src/og/manifest.ts`, build entries with `template: "foo"`.

### Change which pages get a card

Edit `buildEntries()` in `src/og/manifest.ts`. It mirrors the sitemap (home, blog index, posts, resources, legal, + `default`). Adding a new content collection? Add a `getCollection(...)` block and map it to entries, using a unique `key` (the filename stem under `/og/`, e.g. `key: "notes/<id>"` → `/og/notes/<id>.png`).

### Change the image dimensions

Edit `OG_WIDTH` / `OG_HEIGHT` in `src/og/theme.ts` **and** the `og:image:width` / `og:image:height` meta in `src/layouts/BaseLayout.astro`. Keep the 1.91:1 ratio (1200×630) unless you have a reason not to.

## Gotchas (Satori's rendering is a strict subset)

- **Colors must be hex/rgb, not oklch.** Tailwind v4's default palettes are `oklch()` strings, which resvg renders as near-black. `theme.ts` converts every token with `culori`'s `formatHex`; keep that wrapper on any new token.
- **Every multi-child container needs `display: "flex"`** and an explicit `flexDirection`. Satori has no block layout.
- **No line-clamp.** Long text overflows the canvas, so the manifest truncates `title`/`description` (`TITLE_MAX` / `DESC_MAX`). Adjust those caps rather than expecting wrapping to save you.
- **The bundled font is the Latin subset only.** For other scripts, bundle a fuller `.woff` in `src/og/fonts/`.
- The footer's site name / domain / brand initial come from `src/site.config.ts` — no need to hardcode them in a card.

## Verify

```bash
npm run build        # all cards emit to dist/og/ — a broken font/color pipeline still "builds" but yields blank/black cards, so...
# open a couple of dist/og/**.png and confirm colors, font, and text render
npm run check        # types
npm run lint
npm run format
```

Nothing is committed — the PNGs are build output (`dist/` is gitignored). The only committed OG assets are the font files under `src/og/fonts/`.
