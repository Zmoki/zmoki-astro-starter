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

- **`fontFamily`** (in `theme.extend`) — set the three stacks. Note the
  `"… Fallback"` entry right after the web font (see §1b — it prevents layout
  shift when the web font swaps in):
  ```js
  fontFamily: {
    sans: ["Noto Sans", "Noto Sans Fallback", "system-ui", "sans-serif"],
    serif: ["Noto Serif", "Georgia", "serif"],
    mono: ["Noto Sans Mono", "ui-monospace", "monospace"],
  },
  ```
- **`headingFontStack`** (const near the imports) — the family used for `h1–h6`.
  It's referenced in **two** places (the `typography()` prose overrides and the
  `addBase` plugin), so editing the const updates both. Include the same
  metrics-matched fallback:
  ```js
  const headingFontStack = "'Noto Sans', 'Noto Sans Fallback', system-ui, sans-serif";
  ```
  Keep it in sync with whichever family fills headings (all-sans ⇒ the `sans`
  stack).

## 1b. Metrics-matched fallback — CLS (`src/styles/global.css`)

The fonts load **non-render-blocking** (preload + `media="print"` onload swap in
both layouts), so text first paints in a fallback and then swaps to the web font.
Without help, that swap reflows the text and costs **CLS** (Cumulative Layout
Shift → a lower Lighthouse Performance score). To stop it, `src/styles/global.css`
declares a `@font-face` that makes a local system font (**Arial**) render at the
web font's exact metrics, so the swap causes little-to-no shift:

```css
@font-face {
  font-family: "Noto Sans Fallback";
  src: local("Arial");
  ascent-override: 99.55%;
  descent-override: 27.29%;
  line-gap-override: 0%;
  size-adjust: 107.38%;
}
```

That family name is what sits in the stacks in §1 — so a font swap means updating
**three** things in lockstep: the `@font-face` name, the four override numbers, and
the stacks. **Recompute the numbers for the new font** — they're specific to Noto
Sans. `@capsizecss/unpack` (already a dependency) reads the real metrics; run this
against the new font file (download the `.ttf`/`.woff` from Google Fonts, or reuse
`src/og/fonts/*.woff` if it's the same family) and paste the output:

```bash
node --input-type=module -e '
import { readFileSync } from "node:fs";
import { fromBuffer } from "@capsizecss/unpack";
const t = await fromBuffer(readFileSync(process.argv[1]));   // the NEW web font
const f = { unitsPerEm: 2048, xWidthAvg: 904 };              // Arial (capsize reference)
const sizeAdjust = (t.xWidthAvg / t.unitsPerEm) / (f.xWidthAvg / f.unitsPerEm);
const p = (n) => (n * 100).toFixed(2) + "%";
console.log("size-adjust:      ", p(sizeAdjust));
console.log("ascent-override:  ", p((t.ascent / t.unitsPerEm) / sizeAdjust));
console.log("descent-override: ", p((Math.abs(t.descent) / t.unitsPerEm) / sizeAdjust));
console.log("line-gap-override:", p((t.lineGap / t.unitsPerEm) / sizeAdjust));
' path/to/new-font-400.woff
```

Rename the `@font-face` to `"<New Family> Fallback"`, drop in the four values, and
update both stacks in §1 to match. If headings use a **serif**, base its fallback
on `local("Times New Roman")` with Arial swapped for Times in `f` (unitsPerEm 2048,
xWidthAvg ≈ 924). A metrics fallback fixes line-height and near-eliminates shift;
very large display headings can still re-wrap slightly, so verify CLS in §5.

## 2. Load the fonts — both layouts

Update the Google Fonts `<link>` in **both** files (each loads its own — the URL
lives in a `fontsHref` const in each):

- `src/layouts/BaseLayout.astro`
- `src/layouts/BrandLayout.astro`

Use the variable `css2` URL. Include italic axes for any family used in prose
(sans + serif); mono usually needs weight only. Request **only** the families you
use — don't leave retired fonts in the URL:

```
https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Sans+Mono:wght@100..900&display=optional
```

Keep **`display=optional`** (not `swap`). Paired with the metrics-matched fallback
(§1b), it means the web font never swaps in mid-render, so there's zero layout
shift (CLS) — that's what keeps Lighthouse Performance at 100. The trade-off:
a first-time visitor on a cold cache sees the fallback (which, thanks to §1b,
renders at the web font's dimensions); the real font shows on subsequent visits.
If you drop the metrics fallback, revisit this choice.

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

# confirm the metrics fallback (§1b) is present and its name matches the stacks
grep -rho "size-adjust:[^;}]*\|font-family:[^;}]*Fallback[^;}]*" dist/_astro/*.css | sort -u
```

Then reload `/-/astro/brand/typography/` (via `/run`) to eyeball the specimen. If
you changed the fallback (§1b), also check **CLS** — `npm run build && npm run
lhci:desktop`, then confirm the home page's `cumulative-layout-shift` stays low
(the hero is the most shift-prone page).

## Notes

- If you change which role a family fills (e.g. a serif for headings instead of
  all-sans), update **both** the `font-*` utilities in templates **and**
  `headingFontStack` — they must agree.
- `font-sans` and `font-mono` are Tailwind defaults, so existing `font-mono` label
  usages pick up the new face for free.
