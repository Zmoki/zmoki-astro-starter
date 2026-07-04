# Brand — typography (font swap)

> The type guideline is **`/-/astro/brand/typography/`** — open it first (`/run`).
> It's the living specimen; a font change must update it (step 3) so the guideline
> keeps matching the site.

Change the brand typefaces in one pass. The site uses exactly three Tailwind font
families — `font-sans` / `font-serif` / `font-mono` — and the roles are fixed:

| Family | Utility      | Role                                                 |
| ------ | ------------ | ---------------------------------------------------- |
| sans   | `font-sans`  | Headings **and** body copy + prose (global `<body>`) |
| serif  | `font-serif` | Available but unused in the current all-sans starter |
| mono   | `font-mono`  | Code, eyebrows, dates, nav, footer, buttons          |

The starter is **all-sans**: Noto Sans fills both headings and body, Noto Sans
Mono is code. `font-serif` is wired but unused — if you introduce a display serif
for headings, that's the family to set (and see the last note).

There are **no** `zmoki-*` font tokens — fonts ride Tailwind's standard family
keys (unlike colors, which live in `src/design-tokens.mjs`). Changing a family key
updates every `font-*` usage and the `.prose` layer automatically.

> Fonts are Google Fonts (variable). Pick families at fonts.google.com and note
> each one's available axes/weights **before** starting.

## 1. Tailwind families — `tailwind.config.mjs`

Two edits, both near the top / in `theme.extend`:

- **`fontFamily`** (in `theme.extend`) — set the three stacks:
  ```js
  fontFamily: {
    sans: ["Noto Sans", "system-ui", "sans-serif"],
    serif: ["Noto Serif", "Georgia", "serif"],
    mono: ["Noto Sans Mono", "ui-monospace", "monospace"],
  },
  ```
- **`headingFontStack`** (const near the imports) — the family used for `h1–h6`.
  It's referenced in **two** places (the `typography()` prose overrides and the
  `addBase` plugin), so editing the const updates both:
  ```js
  const headingFontStack = "'Noto Sans', system-ui, sans-serif";
  ```
  Keep it in sync with whichever family fills headings (all-sans ⇒ the `sans`
  stack).

## 2. Load the fonts — both layouts

Update the Google Fonts `<link>` in **both** files (each loads its own — the URL
lives in a `fontsHref` const in each):

- `src/layouts/BaseLayout.astro`
- `src/layouts/BrandLayout.astro`

Use the variable `css2` URL. Include italic axes for any family used in prose
(sans + serif); mono usually needs weight only. Request **only** the families you
use — don't leave retired fonts in the URL:

```
https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Sans+Mono:wght@100..900&display=swap
```

## 3. Update the brand specimen

The brand page documents the system and must not drift:

- `src/pages/-/astro/brand/typography.astro` — the intro sentence, the font-pairing
  cards (label `· font-*`, the family name, the weight note), and the prose
  specimen sentence.
- `src/pages/-/astro/brand/index.astro` — the Typography card `summary`.
- `src/pages/-/astro/brand/components.astro` — heading specimens; confirm they
  still read right with the new face.

Also update the **Fonts** row in `AGENTS.md` (Tech stack table) and the type note
in `SETUP.md` so the docs match.

## 4. OG card font (separate!)

The OG cards use a **bundled** font subset, not Google Fonts — swapping the site
face does **not** change the cards. If the brand face changed, update
`src/og/fonts.ts` + the `.woff` files in `src/og/fonts/` too, or the cards won't
match. See **`/og-images`**.

## 5. Verify

Run the shared verify (format / check / build) from `SKILL.md`, then:

```bash
# expect: no retired fonts / dead family keys left behind
grep -rn "Space Grotesk\|Google Sans\|Space Mono\|font-heading" src/ tailwind.config.mjs

# confirm the utilities compiled to the new families
grep -rhoE "\.font-(sans|serif|mono)\{[^}]*\}" dist/_astro/*.css | sort -u
```

Then reload `/-/astro/brand/typography/` (via `/run`) to eyeball the specimen.

## Notes

- If you change which role a family fills (e.g. a serif for headings instead of
  all-sans), update **both** the `font-*` utilities in templates **and**
  `headingFontStack` — they must agree.
- `font-sans` and `font-mono` are Tailwind defaults, so existing `font-mono` label
  usages pick up the new face for free.
