# Brand — components & forms

Adapt the building blocks and their specimens: nav, footer, hero, cards, links and buttons (`/-/astro/brand/components/`), and inputs, labels, the action button and focus/error states (`/-/astro/brand/forms/`). Open the page first (`/run`).

These pages mirror production markup, so every change is two edits that must agree: the real component in `src/`, and its specimen on the brand page.

- `forms.astro` pins the real class strings in frontmatter (`labelClass`, `inputClass`, `inputErrorClass`, `buttonClass`), the same ones `src/components/forms/brevo.astro` renders.
- `components.astro` shows each block as a live example plus its Tailwind recipe.

## Where the real components live

| Block                         | Real implementation                |
| ----------------------------- | ---------------------------------- |
| Nav, footer, meta chrome      | `src/layouts/BaseLayout.astro`     |
| Hero, cards, CTA band         | `src/pages/index.astro`            |
| Post header, prev/next, links | `src/layouts/PostLayout.astro`     |
| Button (all variants)         | `src/components/Button.astro`      |
| Form inputs, states, submit   | `src/components/forms/brevo.astro` |

`Button.astro` variants: `primary` (indigo fill), `secondary` (white + soft stone border), `inverse` (white, for an indigo band); sizes `md` / `lg`. It renders an `<a>` when given `href`, else a `<button>`.

## Workflow

1. Find the block on the guideline page.
2. Change the real component in `src/` first; that's what ships.
3. Update the specimen to match. For forms, edit the pinned class-string const (it feeds both the example and the shown code). For components, update the rendered example and the `<code>` recipe next to it.
4. Keep `zmoki-*` utilities only, and the card recipe (`border border-zmoki-stone-200` + `shadow-sm` + rounded) unless the change is about that recipe.
5. New text/fill pairs must pass WCAG AA (`references/colors.md`), especially white text on a new fill.

If a recipe appears in several places, change it in the component and document that one recipe. Don't hand-copy variants.

## Verify

Run the verify block from `SKILL.md`, then `/run` and compare each specimen with the real thing:

- `components/` blocks ↔ `/`, a blog post, the nav and footer.
- `forms/` ↔ the resource-gate form on a `/resources/{slug}/` page that has a `form`.

They must render identically.
