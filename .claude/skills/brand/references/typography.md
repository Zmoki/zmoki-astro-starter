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

Fonts are **self-hosted via [Astro's Fonts API](https://docs.astro.build/en/guides/fonts/)**
(stable in Astro 7): declared once in `astro.config.mjs`, downloaded + subset at
build, served same-origin from `/_astro/fonts/`. Astro also generates an
**optimized metrics-matched fallback automatically**, so there's no hand-tuned
`@font-face` to maintain — the old capsize step is gone. There are **no** `zmoki-*`
font tokens; families ride Tailwind's standard keys via CSS variables.

> Pick families at fonts.google.com (or any [provider](https://docs.astro.build/en/guides/fonts/#font-providers)
> Astro supports) and note each one's available axes/weights **before** starting.

## 1. Configure the fonts — `astro.config.mjs`

Edit the `fonts` array. One entry per family; each maps a font to a CSS variable:

```js
import { defineConfig, fontProviders } from "astro/config";

fonts: [
  {
    provider: fontProviders.google(),
    name: "Noto Sans",              // ← the family on the provider
    cssVariable: "--font-noto-sans",// ← how templates reference it (§2)
    weights: ["400 700"],           // variable range; covers 400/500/600/700
    styles: ["normal", "italic"],   // italic only for families used in prose
    subsets: ["latin"],
    fallbacks: ["system-ui", "sans-serif"],
  },
  {
    provider: fontProviders.google(),
    name: "Noto Sans Mono",
    cssVariable: "--font-noto-sans-mono",
    weights: ["400 700"],
    styles: ["normal"],             // mono needs weight only
    subsets: ["latin"],
    fallbacks: ["ui-monospace", "monospace"],
  },
],
```

Request **only** the families/weights/styles you use — don't leave a retired font
in the array. Astro injects the `@font-face` rules, the auto-generated optimized
fallback, and a `:root { --font-… }` definition (which already includes your
`fallbacks`), so `font-display: swap` swaps with **zero CLS** — no manual metrics
work, and nothing to keep "in lockstep."

## 2. Wire families to Tailwind — `tailwind.config.mjs`

Templates never name the family directly; they use the CSS variables from §1.

- **`fontFamily`** (in `theme.extend`) — point each stack at its variable:
  ```js
  fontFamily: {
    sans: ["var(--font-noto-sans)"],
    serif: ["Noto Serif", "Georgia", "serif"],
    mono: ["var(--font-noto-sans-mono)"],
  },
  ```
- **`headingFontStack`** (const near the imports) — the family used for `h1–h6`,
  referenced in both the `typography()` prose overrides and the `addBase` plugin:
  ```js
  const headingFontStack = "var(--font-noto-sans)";
  ```
  Keep it in sync with whichever family fills headings (all-sans ⇒ the `sans` var).

If you **rename** a `cssVariable` (or add/remove a family), also update the
`<Font cssVariable="…" />` tags in **both** layouts — `src/layouts/BaseLayout.astro`
and `src/layouts/BrandLayout.astro` (the `preload` sits on the sans face). If you
only change a font's `name`/`weights` and keep the variable, the layouts need no edit.

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

The OG cards use a **bundled** font subset loaded by Satori, **not** the Fonts API —
swapping the site face does **not** change the cards. If the brand face changed,
update `src/og/fonts.ts` + the `.woff` files in `src/og/fonts/` too, or the cards
won't match. See **`/og-images`**.

## 5. Verify

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
