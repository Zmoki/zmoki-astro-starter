---
description: Change the site's brand color palette (re-skin). Use when the user wants to recolor the site, shift to a different color (e.g. "make it red/green/blue"), or define a custom brand color.
---

# Brand colors

Re-skin the site's color palette.

## The system

All colors are **Tailwind's default palettes namespaced under the `zmoki-` prefix** — `zmoki-neutral`, `zmoki-blue`, `zmoki-red`, … — each a full `50→950` scale. They're defined in **`src/design-tokens.mjs`** (single source of truth, consumed by `tailwind.config.mjs` and the brand reference page). Templates use `zmoki-*` utility classes only — **no inline hex**.

The starter is **monochrome**: templates use `zmoki-neutral` (plus Tailwind's built-in `white` / `slate-*`). Every chromatic group already exists as a utility — it's just unused until you reach for it.

Live reference: `/-/astro/brand/color/`.

## Step 1 — Ask the user

Use the `AskUserQuestion` tool to settle two things before editing:

1. **Which color?** A Tailwind color name (slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose) **or** a custom brand color (a hex like `#2f6bff`). Free-text is fine.
2. **Scope?** Whole site (every ink/text/border/fill recolors) **or** accents only (links, nav button, hero, CTA, action buttons — body text, borders, and background stay neutral grey).

## Step 2 — Pick the path

- **Built-in Tailwind color** (the answer is one of the names above) → **Path A**. Nothing to add in `design-tokens.mjs`; the `zmoki-<name>-*` utilities already exist.
- **Custom color** (a hex, not a Tailwind default) → **Path B**. Build a scale first.

### Path B — build a custom scale

The user prefers **[colorhexa.com](https://www.colorhexa.com/)**. Build a full `50→950` scale from their base color:

1. The base hex is `500`.
2. From colorhexa's **"Shades and Tints"** ramp: lighter tints (toward white) fill `400 300 200 100 50`; darker shades (toward black) fill `600 700 800 900 950`.
3. **Pick by eye for even spacing** — Tailwind's own scales ramp non-linearly, so match that feel rather than grabbing fixed 10% stops.

You can fetch `https://www.colorhexa.com/<hex-without-#>` (e.g. `.../2f6bff`) with WebFetch to read off the shade/tint hexes, or ask the user to paste the scale.

Add it to `customPalettes` in `src/design-tokens.mjs` (there's a commented `zmoki-brand` example):

```js
const brand = { 50: "#…", 100: "#…", /* … */ 950: "#…" };
const customPalettes = { "zmoki-brand": brand };
```

It auto-generates `zmoki-brand-*` utilities and auto-appears on `/-/astro/brand/color/` (via the `customPaletteNames` export). Use `zmoki-brand` as the target group in Step 4.

## Step 3 — Check combinations (WCAG AA)

Before committing to shades, make sure every text/background pair the palette produces meets **at least WCAG AA**. Verify each pair with Figma's checker: **<https://www.figma.com/color-contrast-checker/>** (paste the two hex values from `src/design-tokens.mjs` / `/-/astro/brand/color/`).

Thresholds:

- **Normal text** — contrast ratio **≥ 4.5:1**
- **Large text** (≥ 24px, or ≥ 18.66px bold) and **UI / graphical elements** (borders, icons, focus rings) — **≥ 3:1**

Pairs to check on every re-skin (`<target>` = the chosen group):

| Foreground                                      | Background                                       | Min   |
| ----------------------------------------------- | ------------------------------------------------ | ----- |
| Ink text (`<target>-900` / `zmoki-neutral-900`) | page bg `zmoki-neutral-200`, cards `white`       | 4.5:1 |
| Muted text `zmoki-neutral-600`                  | `white` / page bg                                | 4.5:1 |
| Inverse text `white` / `slate-50`               | colored fills — nav CTA, hero, CTA band, buttons | 4.5:1 |
| Hard borders / focus ring (`-900`)              | `white` / page bg                                | 3:1   |

Rules:

- A fill that carries **white text** (buttons, CTA, hero) must be dark enough to pass — usually `-600` / `-700`. The mid/light shades of bright hues (yellow, lime, amber, cyan, sky, …) **fail** white-on-fill AA: either go darker, or flip to **dark text on a light fill**.
- If a pair fails AA, **fix the shade — don't ship it**. Prefer adjusting the shade over weakening the rule.
- For custom (colorhexa) scales, check the specific shades you actually use, not just `-500`.
- Note any pair that lands close to the threshold in the commit/PR.

## Step 4 — Apply

Let `<target>` be the chosen group (`zmoki-blue`, `zmoki-brand`, …).

- **Whole site** — find/replace `zmoki-neutral` → `<target>` across `src/`. This recolors text, borders, and fills together. Confirm the count looks right before and after:

  ```bash
  grep -rl "zmoki-neutral" src | xargs sed -i '' "s/zmoki-neutral/<target>/g"
  ```

  Note: in `zsh`, pass file paths explicitly to `sed` (unquoted `$VAR` is not word-split). The bracketed filename `src/pages/thank-you/[...slug].astro` must be quoted.

- **Accents only** — recolor just the primary action surfaces, leaving body text / borders / page bg as `zmoki-neutral`. The canonical accent spots:
  - nav CTA button — `src/layouts/BaseLayout.astro`
  - hero + closing CTA band — `src/pages/index.astro`
  - in-prose links — handled by the `ink` constant in `tailwind.config.mjs` (change it there if links should recolor)
  - action / copy buttons — `astro.config.mjs` copy-button string + form submit (`src/components/BrevoForm.astro`)

  Change `zmoki-neutral-900` → `<target>-600` (or the shade that reads well) on those elements only. **Confirm the exact element list with the user** — "accents" is subjective.

Keep the inverse text on colored fills readable: `text-white` / `text-slate-50` on dark shades — and confirm each fill still passes the Step 3 contrast check at the shade you land on.

## Step 5 — Verify

```bash
npm run format      # Tailwind class order is plugin-enforced — always format
npm run check       # 0 errors
npm run build       # must pass
```

Then open `/-/astro/brand/color/` (via `/run`) and eyeball the palette and a couple of real pages (`/`, a blog post). Re-confirm the Step 3 contrast pairs at the shades you shipped — at minimum ink-on-bg and white-on-CTA. Sanity-check the generated CSS if unsure:

```bash
grep -oE "\.bg-<target>-600\{[^}]*\}" dist/_astro/*.css | head -1
```

## Notes

- The full re-skin rules — including the WCAG AA combinations — also live in `AGENTS.md` ("Changing the palette") and `SETUP.md` ("Palette") — keep all in sync if the workflow changes.
- Don't reintroduce semantic role tokens (`zmoki-primary`, `-accent`, …) — the system is intentionally palette-group-based, not role-based.
