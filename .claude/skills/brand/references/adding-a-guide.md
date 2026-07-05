# Brand — add a new guide

The style guide is meant to grow. Add a section when the brand gains a concern the
existing pages (color, typography, forms, components, voice) don't cover — e.g.
**iconography**, **imagery/photography**, **motion**, **spacing & layout**,
**data viz**, **accessibility**, **logo & wordmark usage**.

A guide is just another page under `src/pages/-/astro/brand/`, built on
`BrandLayout`, linked from the brand index. Everything under `/-/astro/*` is
`noindex` already (via `public/_headers`), so a new page is internal automatically.

## Steps

1. **Create the page** — `src/pages/-/astro/brand/<name>.astro`. Copy an existing
   page (`voice.astro` for a mostly-prose guide, `components.astro` for
   example+recipe blocks) as the starting shape. Keep the house conventions:
   - Wrap in `BrandLayout` with a `title` (`Brand — <Name>`) and `description`.
   - Open with the standard header: a back-link
     `← Zmoki Astro Starter brand` → `/-/astro/brand/`, an `<h1>`, and a one-line intro.
   - Put editable content in **frontmatter data** (arrays/objects) and map over it
     in the markup — that's the pattern every page uses; it keeps future edits to
     the data, not the layout.
   - Colors via `zmoki-*` utilities only (no inline hex); cards use the soft recipe
     (`border border-zmoki-stone-200` + `shadow-sm` + rounded). New text/fill pairs
     must clear WCAG AA (see `references/colors.md`).

2. **Register it on the index** — add an entry to the `sections` array in
   `src/pages/-/astro/brand/index.astro`:

   ```js
   {
     title: "Iconography",
     summary: "One line on what this guide covers.",
     href: "/-/astro/brand/iconography/",
     accent: "bg-zmoki-indigo-600",
   },
   ```

   (`href: null` renders a dashed "Coming soon" card — use it to stub a guide you
   haven't built yet.)

3. **If the guide documents something implemented in code**, note where that lives
   and keep the two in sync — same rule as every other guide (the page mirrors
   production). A pure-prose guide (like voice) is self-contained.

## Keep the map current

When you add a guide, update the places that enumerate the pages so tooling and
docs don't fall behind:

- **This skill** — add the page to the guideline table in `SKILL.md` (and a task
  reference here if it needs a real workflow).
- **`AGENTS.md`** — the "URL structure" list of `/-/astro/brand/…` routes.
- **`SETUP.md`** — mentions the brand pages as a living style guide.

## Verify

```bash
npm run check   # 0 errors
npm run build   # must pass — confirms the new route builds
```

Then `/run` and open `/-/astro/brand/` — the new card should appear and link to a
page that renders. Read the page top to bottom; it should look and sound like the
rest of the system.
