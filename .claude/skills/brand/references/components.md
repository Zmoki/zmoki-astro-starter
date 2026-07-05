# Brand — components & forms

Adapt the reusable building blocks and their specimens: nav, footer, hero, cards,
links, buttons (`components/`) and inputs, labels, the action button, focus/error
states (`forms/`).

> The guidelines are **`/-/astro/brand/components/`** and
> **`/-/astro/brand/forms/`** — open them first (`/run`). Unlike color/type, these
> pages have **no build config to change**: the guideline _is_ the real component.

## The governing principle: the page mirrors production

Both pages are written to **mirror the actual markup** used in production so they
can never drift:

- `forms.astro` pins the real class strings in frontmatter (`labelClass`,
  `inputClass`, `inputErrorClass`, `buttonClass`) — the same classes
  `src/components/forms/brevo.astro` renders. The resource-gate signup is the canonical
  example; every pattern on the page comes from it.
- `components.astro` documents each block (cards, links, buttons, meta labels,
  nav/footer/hero) with a live example **and** the canonical Tailwind recipe,
  mirroring `BaseLayout`, `PostLayout`, `forms/brevo.astro`, and `Button.astro`.

So a component change is **two edits that must agree**: the real component in
`src/` **and** its specimen/recipe on the brand page.

## Where the real components live

| Block                         | Real implementation                 |
| ----------------------------- | ----------------------------------- |
| Nav, footer, meta chrome      | `src/layouts/BaseLayout.astro`      |
| Hero, cards, CTA band         | `src/pages/index.astro`             |
| Post header, prev/next, links | `src/layouts/PostLayout.astro`      |
| Button (all variants)         | `src/components/Button.astro`       |
| Form inputs, states, submit   | `src/components/forms/brevo.astro`  |
| Resource link                 | `src/components/ResourceLink.astro` |

`Button.astro` variants: `primary` (indigo fill), `secondary` (white + soft stone
border), `inverse` (white, for an indigo band); sizes `md` / `lg`. It renders an
`<a>` when given `href`, else a `<button>`.

## Workflow

1. **Open the guideline page** (`/run` → `/-/astro/brand/{components,forms}/`) and
   find the block you're changing.
2. **Change the real component** in `src/` first — that's what ships.
3. **Update the specimen** on the brand page to match: the live example **and** any
   recipe/class-string it documents. For forms, edit the pinned class-string const
   (it feeds both the example and the shown code). For components, update both the
   rendered example and the `<code>` recipe next to it.
4. **Check the tokens hold.** New surfaces still use `zmoki-*` utilities only (no
   inline hex) and keep the card recipe — soft `border border-zmoki-stone-200` +
   `shadow-sm` + rounded — unless the change is deliberately about that recipe.
5. **Contrast:** any new text/fill pair must clear WCAG AA (see
   `references/colors.md` for thresholds) — especially white text on a new fill.

## Verify

Run the shared verify (format / check / build) from `SKILL.md`, then `/run` and
compare the guideline page against the real thing it documents:

- `components/` block ↔ where it's used (`/`, a blog post, the nav/footer).
- `forms/` ↔ a real form — the resource gate / newsletter signup on a
  `/resources/{slug}/` page that has a `form`.

They must render identically. If the specimen and production disagree, that's the
drift to fix — the page is the guideline.

## Notes

- Don't fork styles: if a recipe appears in several places, change it at the
  component and let the page document that one recipe — don't hand-copy variants.
- These pages are `noindex` (internal style guide).
