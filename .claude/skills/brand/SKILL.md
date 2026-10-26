---
description: Work on the site's brand guidelines. The living guideline is the internal style guide under /-/astro/brand/ (color, typography, forms, components, voice & tone) — this skill orients you there and helps you improve or adapt it, keeping the implementation in sync. Use when the user wants to evolve the brand: recolor/re-skin, define a custom brand color, swap fonts, rewrite voice/tone or house style, adapt components/forms, add a new guide/section, or edit any brand page.
---

# Brand

The brand guideline is the internal, `noindex` style guide under `/-/astro/brand/`. It's the source of truth for how the site looks and sounds. Change a guideline page and the code it describes in the same pass, so they never drift. If they disagree, that's the bug to fix.

The pages read the site name from `site.name` (`src/site.config.ts`); the rest of the copy is written in the pages themselves.

## Guideline pages

| Page (`/-/astro/brand/…`) | File                                       | Covers                                   |
| ------------------------- | ------------------------------------------ | ---------------------------------------- |
| `index/`                  | `src/pages/-/astro/brand/index.astro`      | Home: section cards and summaries        |
| `color/`                  | `src/pages/-/astro/brand/color.astro`      | Palette, swatches, usage conventions     |
| `typography/`             | `src/pages/-/astro/brand/typography.astro` | Typefaces, roles, prose specimen         |
| `forms/`                  | `src/pages/-/astro/brand/forms.astro`      | Inputs, labels, action button, states    |
| `components/`             | `src/pages/-/astro/brand/components.astro` | Nav, footer, hero, cards, links, buttons |
| `voice/`                  | `src/pages/-/astro/brand/voice.astro`      | Voice pillars, house style, rewrites     |
| `og/`                     | `src/pages/-/astro/brand/og.astro`         | OG / social cards: templates and anatomy |

## Where each guideline is implemented

| Guideline        | Implemented in                                                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color            | `src/design-tokens.mjs` (the `zmoki-*` scales) → Tailwind utilities                                                                                               |
| Typography       | `src/design-tokens.mjs` (`fonts`: names + CSS variables), `astro.config.mjs` (`fonts`: provider + axes), `tailwind.config.mjs` (`fontFamily`, `headingFontStack`) |
| Voice & tone     | `voice.astro` itself; nothing else                                                                                                                                |
| Components/forms | The real components in `src/components/` and `src/layouts/`                                                                                                       |

## Workflow

1. **Orient.** `/run` and open the guideline page you're changing. Its `.astro` frontmatter usually holds the data you'll edit.
2. **Agree the direction with the user** when it's open (which color, which font, what voice).
3. **Change the guideline and its implementation together**, following the task reference:
   - Recolor, re-skin, custom brand color → `references/colors.md`
   - Swap fonts → `references/typography.md`
   - Rewrite voice, tone, house style → `references/voice.md`
   - Adapt components or forms → `references/components.md`
   - Add a new guide (iconography, imagery, motion, …) → `references/adding-a-guide.md`
4. **Update the docs** if conventions changed: `AGENTS.md` → Styling and `SETUP.md` → Brand.
5. **Verify** (below).

OG cards read the brand tokens, so color and font changes reach them automatically. For card-specific tuning, use `/og-images`.

## Rules

- **No inline hex in templates.** Use `zmoki-*` utilities. Raw hex lives only in `src/design-tokens.mjs` (and `src/og/theme.ts` reads from it).
- **WCAG AA.** Every text/background pair needs at least 4.5:1 (normal text) or 3:1 (large text, borders, focus rings, UI). Fix the shade; don't ship a failing pair. Details in `references/colors.md`.
- **No role tokens** (`zmoki-primary`, `-accent`, …). The system is built on palette groups.
- **Font names live once, in `src/design-tokens.mjs`.** The layouts' `<Font>` tags and Tailwind read the CSS variables from there; don't hard-code a family in a layout.

## Verify

```bash
npm run format   # Tailwind class order is plugin-enforced
npm run check
npm run build
```

Then `/run` and compare the guideline page you changed with a couple of real pages (`/`, a blog post). Each task reference adds its own checks.
