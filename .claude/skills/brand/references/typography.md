# Brand — typography (font swap)

> The type guideline is **`/-/astro/brand/typography/`** — open it first (`/run`).
> It's the living specimen; a font change must update it (step 4) so the guideline
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

Fonts are **self-hosted via [Astro's Fonts API](https://docs.astro.build/en/guides/fonts/)**
(stable in Astro 7): downloaded + subset at build, served same-origin from
`/_astro/fonts/`. Astro also generates an **optimized metrics-matched fallback
automatically**, so there's no hand-tuned `@font-face` to maintain — the old
capsize step is gone.

The family **names + CSS variables are a single source of truth** in
**`src/design-tokens.mjs`** (`export const fonts`) — the same file that holds the
color tokens. Everything else reads from it: `astro.config.mjs` (the Fonts API
entry), `tailwind.config.mjs` (the `font-*` utilities), the layouts' `<Font>`
tags, and the brand specimen pages (so a swap never leaves a stale font name in
display text). So editing the name in one place updates the whole system.

> Pick families at fonts.google.com (or any [provider](https://docs.astro.build/en/guides/fonts/#font-providers)
> Astro supports) and note each one's available axes/weights **before** starting.

## 1. Name the fonts — `src/design-tokens.mjs`

This is the **only** place the family names live. Set `name` (the family on the
provider) and `variable` (the CSS custom property the rest of the system uses):

```js
export const fonts = {
  sans: { name: "Noto Sans", variable: "--font-noto-sans" },
  mono: { name: "Noto Sans Mono", variable: "--font-noto-sans-mono" },
};
```

`astro.config.mjs`, `tailwind.config.mjs`, the layouts' `<Font>` tags, and the
brand specimen pages all import this — so changing a name/variable here flows
everywhere and no display text drifts.

## 2. Set provider + axes — `astro.config.mjs`

The `fonts` array pulls `name`/`cssVariable` from §1; you set the rest here — the
provider and which weights/styles/subsets to fetch. Request **only** what you use:

```js
import { defineConfig, fontProviders } from "astro/config";
import { fonts } from "./src/design-tokens.mjs";

fonts: [
  {
    provider: fontProviders.google(),
    name: fonts.sans.name,
    cssVariable: fonts.sans.variable,
    weights: ["400 700"], // variable range; covers 400/500/600/700
    styles: ["normal", "italic"], // italic only for families used in prose
    subsets: ["latin"],
    fallbacks: ["system-ui", "sans-serif"],
  },
  {
    provider: fontProviders.google(),
    name: fonts.mono.name,
    cssVariable: fonts.mono.variable,
    weights: ["400 700"],
    styles: ["normal"], // mono needs weight only
    subsets: ["latin"],
    fallbacks: ["ui-monospace", "monospace"],
  },
],
```

Astro injects the `@font-face` rules, the auto-generated optimized fallback, and a
`:root { --font-… }` definition (which already includes your `fallbacks`), so
`font-display: swap` swaps with **zero CLS** — no manual metrics work.

## 3. Wire families to Tailwind — `tailwind.config.mjs`

Templates never name the family directly; they use the CSS variables from §1
(imported, so they can't drift):

- **`fontFamily`** (in `theme.extend`) — point each stack at its variable:
  ```js
  import { colors as brandColors, fonts } from "./src/design-tokens.mjs";
  // …
  fontFamily: {
    sans: [`var(${fonts.sans.variable})`],
    serif: ["Noto Serif", "Georgia", "serif"],
    mono: [`var(${fonts.mono.variable})`],
  },
  ```
- **`headingFontStack`** (const near the imports) — the family used for `h1–h6`,
  referenced in both the `typography()` prose overrides and the `addBase` plugin:
  ```js
  const headingFontStack = `var(${fonts.sans.variable})`;
  ```
  Keep it in sync with whichever family fills headings (all-sans ⇒ the `sans` var).

If you **rename** a `cssVariable` (or add/remove a family), also update the
`<Font cssVariable="…" />` tags in **both** layouts — `src/layouts/BaseLayout.astro`
and `src/layouts/BrandLayout.astro` (the `preload` sits on the sans face). If you
only change a font's `name`/`weights` and keep the variable, the layouts need no edit.

## 4. Update the brand specimen

The **family name** already renders dynamically from §1 (`fonts.sans.name` /
`fonts.mono.name`) across `brand/typography.astro`, `brand/index.astro`, and the
landing page — so it won't drift. What you **do** still edit is the _editorial_
copy that describes the font's character (e.g. "one clean sans", the weight note),
since that's specific to the typeface you chose:

- `src/pages/-/astro/brand/typography.astro` — the descriptive prose in the intro,
  the font-pairing cards (the weight/character note), and the prose specimen.
- `src/pages/-/astro/brand/index.astro` — the Typography card `summary` wording.
- `src/pages/-/astro/brand/components.astro` — heading specimens; confirm they
  still read right with the new face.

Also update the **Fonts** row in `AGENTS.md` (Tech stack table) and the type note
in `SETUP.md` so the docs match.

## 5. OG card font (separate!)

The OG cards use a **bundled** font subset loaded by Satori, **not** the Fonts API —
swapping the site face does **not** change the cards. If the brand face changed,
update `src/og/fonts.ts` + the `.woff` files in `src/og/fonts/` too, or the cards
won't match. See **`/og-images`**.

## 6. Verify

Run the shared verify (format / check / build) from `SKILL.md`, then:

```bash
# expect: no retired fonts / dead family keys left behind
grep -rn "Space Grotesk\|Google Sans\|Space Mono\|font-heading" src/ astro.config.mjs tailwind.config.mjs

# confirm the utilities compiled to the new CSS variables
grep -rhoE "\.font-(sans|serif|mono)\{[^}]*\}" dist/_astro/*.css | sort -u

# confirm the fonts were self-hosted + Astro's optimized fallback was generated
ls dist/_astro/fonts/                                    # the subset .woff2 files
grep -rho "font-family:[^;}]*fallback[^;}]*" dist/**/*.html | sort -u | head
```

Then reload `/-/astro/brand/typography/` (via `/run`) to eyeball the specimen. To
double-check CLS (Astro's fallback should keep it ~0), `npm run build && npm run
lhci:desktop`, then confirm the home page's `cumulative-layout-shift` stays low
(the hero is the most shift-prone page).

## Notes

- If you change which role a family fills (e.g. a serif for headings instead of
  all-sans), update **both** the `font-*` utilities in templates **and**
  `headingFontStack` — they must agree.
- `font-sans` and `font-mono` are Tailwind defaults, so existing `font-mono` label
  usages pick up the new face for free.
