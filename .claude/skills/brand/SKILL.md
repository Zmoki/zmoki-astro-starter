---
description: Work on the site's brand guidelines. The living guideline is the internal style guide under /-/astro/brand/ (color, typography, forms, components, voice & tone) — this skill orients you there and helps you improve or adapt it, keeping the implementation in sync. Use when the user wants to evolve the brand: recolor/re-skin, define a custom brand color, swap fonts, rewrite voice/tone or house style, adapt components/forms, add a new guide/section, or edit any brand page.
---

# Brand

**The brand guideline is the style guide under `/-/astro/brand/`.** Those pages are
the source of truth for how the site looks and sounds — read the relevant one
first, and let it lead the work. This skill orients you across them and helps you
improve or adapt a guideline, then bring the implementation into line so the two
never drift.

The pages are an internal, `noindex` living style guide. They use the placeholder
name **`My Project X`** and are **not** wired to `src/site.config.ts` — you edit
them directly.

## The guideline pages (source of truth)

| Page (`/-/astro/brand/…`) | File                                       | Governs                                   |
| ------------------------- | ------------------------------------------ | ----------------------------------------- |
| `index/`                  | `src/pages/-/astro/brand/index.astro`      | The system home — section cards/summaries |
| `color/`                  | `src/pages/-/astro/brand/color.astro`      | Palette, swatches, usage conventions      |
| `typography/`             | `src/pages/-/astro/brand/typography.astro` | Typefaces, roles, prose specimen          |
| `forms/`                  | `src/pages/-/astro/brand/forms.astro`      | Inputs, labels, action button, states     |
| `components/`             | `src/pages/-/astro/brand/components.astro` | Nav, footer, hero, cards, links, buttons  |
| `voice/`                  | `src/pages/-/astro/brand/voice.astro`      | Voice pillars, house style, rewrites      |

Start here: run **`/run`** and open the page you're changing. It shows the current
guideline live, and its `.astro` frontmatter holds the data you'll usually edit.

## Where each guideline is _implemented_

A guideline page is documentation; the behavior it documents lives in code. When
you adapt a guideline, change **both** — the page (so the guideline stays true)
and its implementation (so the site matches) — in the same pass.

| Guideline        | Implemented in                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| Color            | `src/design-tokens.mjs` (the `zmoki-*` scales) → Tailwind utilities                                                   |
| Typography       | `tailwind.config.mjs` (`fontFamily`, `headingFontStack`) + font `<link>`s in `BaseLayout.astro` & `BrandLayout.astro` |
| Voice & tone     | The `voice.astro` page **is** the artifact — no separate implementation                                               |
| Components/forms | The actual components in `src/components/` and `src/layouts/`                                                         |

## Workflow

1. **Orient.** Open the relevant guideline page (`/run` → `/-/astro/brand/…`) and
   read it. It is the current truth — work from it, not from memory.
2. **Settle the change with the user** if the direction is open (which color, which
   font, what the voice should be). Ask the user rather than guessing.
3. **Adapt the guideline + implementation together.** The task references below
   carry the concrete how-to (files, commands, gotchas):
   - Recolor / re-skin / custom brand color → `references/colors.md`
   - Swap fonts (sans / serif / mono) → `references/typography.md`
   - Rewrite voice, tone, house style → `references/voice.md`
   - Adapt components or forms → `references/components.md`
   - **Add a new guide/section** (iconography, imagery, motion, …) →
     `references/adding-a-guide.md`
4. **Keep the docs honest.** `AGENTS.md` (Color system / Fonts) and `SETUP.md`
   (Design) summarize the system for tooling — update them if conventions changed.
5. **Verify** (below).

OG / social-share cards are a separate, deeper skill — run **`/og-images`**. They
read the brand tokens, so a color or font change flows into them automatically;
`/og-images` covers card-specific tuning.

## Verify (all tasks)

```bash
npm run format      # Tailwind class order is plugin-enforced — always format
npm run check       # 0 errors
npm run build       # must pass
```

Then **`/run`** and eyeball the guideline page you changed **plus** a couple of
real pages (`/`, a blog post) — the page and the live site should agree. Each task
reference adds specific checks (contrast, compiled utilities, retired-font grep).

## Guardrails

- **The page leads.** If the guideline page and the code disagree, that's the bug
  to fix — don't let a change land in one without the other.
- **No inline hex in templates** — colors ride `zmoki-*` utilities generated from
  `src/design-tokens.mjs` (the only home for raw hex, plus `src/og/theme.ts`, which
  reads from it).
- **WCAG AA is non-negotiable.** Every text/background pair must clear **≥ 4.5:1**
  (normal text) or **≥ 3:1** (large text, borders, focus rings, UI). Fix the shade,
  don't ship a failing pair. Details in `references/colors.md`.
- **Don't reintroduce role tokens** (`zmoki-primary`, `-accent`, …). The system is
  palette-group-based, not semantic-role-based.
- **Keep the two font `<link>`s in sync** — `BaseLayout.astro` and
  `BrandLayout.astro` each load their own.
