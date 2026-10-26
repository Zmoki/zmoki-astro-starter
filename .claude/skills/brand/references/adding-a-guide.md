# Brand — add a new guide

Add a guide when the brand gains a concern the existing pages don't cover, e.g. iconography, imagery, motion, spacing & layout, data viz, accessibility, logo usage.

A guide is a page under `src/pages/-/astro/brand/` on `BrandLayout`, linked from the brand index. Everything under `/-/astro/*` is already `noindex`.

## Steps

1. **Create `src/pages/-/astro/brand/<name>.astro`.** Copy `voice.astro` for a mostly-prose guide or `components.astro` for example-and-recipe blocks. Follow the house pattern:
   - `BrandLayout` with `title` (`Brand — <Name>`) and `description`.
   - Header: a back-link `← {site.name} brand` to `/-/astro/brand/` (`import { site } from "@/site.config"`), an `<h1>`, a one-line intro.
   - Editable content as frontmatter data (arrays/objects), mapped in the markup.
   - `zmoki-*` utilities only, the soft card recipe (`border border-zmoki-stone-200` + `shadow-sm` + rounded), and WCAG AA for new pairs (`references/colors.md`).

2. **Register it** in the `sections` array of `src/pages/-/astro/brand/index.astro`:

   ```js
   {
     title: "Iconography",
     summary: "One line on what this guide covers.",
     href: "/-/astro/brand/iconography/",
     accent: "bg-zmoki-indigo-600",
   },
   ```

   `href: null` renders a dashed "Coming soon" card, for stubbing a guide.

3. **If the guide documents code**, note where it lives and keep them in sync, like the other guides.

4. **Update the lists of brand pages**: the guideline table in `SKILL.md` (plus a reference file here if the guide needs a workflow), and `AGENTS.md` → URLs or `SETUP.md` → Brand if they list the brand pages individually.

## Verify

```bash
npm run check
npm run build
```

Then `/run`, open `/-/astro/brand/`, and follow the new card to the page. It should look and sound like the rest of the guide.
