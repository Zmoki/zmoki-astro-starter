---
description: Customize the Open Graph / social-share image cards — layout, colors, fonts, text, dimensions, add a template variant, or change which pages get a card. Use when the user wants to change how link previews / social cards / OG images look.
---

# OG images

Social-share cards are rendered at build time: Satori (nodes → SVG), then resvg (SVG → PNG). `astro build` writes them to `dist/og/**/*.png` (1200×630); `astro dev` renders the same route on request. Nothing is committed except the card fonts.

## Files

| File                               | Owns                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| `src/og/manifest.ts`               | Which pages get a card, and each card's text (`title`, `description`, `eyebrow`, `alt`) |
| `src/og/card.ts`                   | How cards look: the `article` and `site` layouts                                        |
| `src/og/theme.ts`                  | Card colors (from design tokens) and `OG_WIDTH` / `OG_HEIGHT`                           |
| `src/og/fonts.ts` + `fonts/*.woff` | The card font (Noto Sans Latin subset)                                                  |
| `src/og/types.ts`                  | The `OgEntry` shape and the `OgTemplate` union                                          |
| `src/pages/og/[...path].png.ts`    | The endpoint: `getStaticPaths` from the manifest → render → PNG                         |

The manifest feeds both the endpoint and `BaseLayout.astro` (`og:image` + `og:image:alt` via `getOgImage(pathname)`). A page with no entry gets the `default` card.

## Preview

```bash
npm run dev     # then open /og/index.png, /og/blog/<id>.png, /og/default.png
npm run build   # then open dist/og/**/*.png
```

Read the PNG to check it. Always finish with a build.

## Common edits

### Colors

Cards read the design tokens, so a re-skin via `/brand` recolors them. To tune only the cards, edit the token picks in `src/og/theme.ts` (`bg`, `ink`, `muted`, `accent`, …).

Every text/background pair must meet WCAG AA: 4.5:1 for normal text, 3:1 for large text (the title/name). Check against the card background, `cream-100`, not white. The tight pair is muted text (`stone-500`) on `cream-100`, at about 4.5:1: lightening `bg` or `muted` drops the eyebrow, description and domain below AA first. If a pair fails, darken the token or enlarge/bold the text.

### Font

Put the new `.woff`/`.ttf` in `src/og/fonts/` (Satori needs the file, not a CSS `@font-face`), load it in `src/og/fonts.ts`, and use its `name` in `card.ts`. The bundled font is a Latin subset; other scripts need a fuller file. This font is separate from the site's self-hosted fonts: a brand typeface swap (`/brand`) must update it too.

### Layout or copy

Layout: edit `articleCard` / `siteCard` in `src/og/card.ts`, built with the small `el(type, style, children)` helper (no JSX). The brand mark comes from `public/brand-mark.svg`, and the site name and domain from `src/site.config.ts`.

Text (eyebrow format, site-card tagline, truncation): edit `src/og/manifest.ts`.

### New template variant

1. Add the name to the `OgTemplate` union in `src/og/types.ts`.
2. Write a `fooCard(entry)` builder in `src/og/card.ts` and route to it in `renderCard`.
3. Build entries with `template: "foo"` in `src/og/manifest.ts`.

### Which pages get a card

`computeEntries()` in `src/og/manifest.ts` builds the list from three sources:

- **Collection pages** (posts, resources, legal) come from `getPageRecords()` in `src/lib/page-collections.ts`, the same registry as the sitemap. A new page section registered there gets cards automatically.
- **Standalone pages** (home, blog index) come from the `meta` each page exports. A page without `title` + `description` falls back to `default`.
- **`default`** is listed explicitly.

An entry's `key` is its filename stem under `/og/` (`"blog/<id>"` → `/og/blog/<id>.png`).

### Dimensions

Change `OG_WIDTH` / `OG_HEIGHT` in `src/og/theme.ts` and the `og:image:width` / `og:image:height` meta in `src/layouts/BaseLayout.astro`. Keep 1.91:1 unless there's a reason not to.

## Satori gotchas

- **Colors must be hex/rgb, not oklch.** Tailwind v4 palettes are `oklch()`, which resvg renders near-black. `theme.ts` wraps every token in `culori`'s `formatHex`; keep that on new tokens.
- **Every multi-child container needs `display: "flex"`** and an explicit `flexDirection`. There's no block layout.
- **No line-clamp.** Long text overflows, so the manifest truncates with `TITLE_MAX` / `DESC_MAX`. Adjust those caps.

## Verify

```bash
npm run build   # then open a few dist/og/**.png: colors, font and text
npm run check
npm run lint
npm run format
```

A broken font or color pipeline still builds but yields blank or black cards, so look at the PNGs. If you changed a card color or font size, recheck the AA pairs above.
