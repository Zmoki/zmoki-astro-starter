# Brand — colors (re-skin)

Recolor the site: shift the accent, recolor the canvas/greys, or define a custom
brand color.

> The color guideline is **`/-/astro/brand/color/`** — open it first (`/run`); it
> renders live from the tokens and states the usage conventions. Work from it, and
> update its convention copy alongside the tokens so the guideline stays true.

## The system

All colors are **Tailwind's default palettes namespaced under `zmoki-`** —
`zmoki-stone`, `zmoki-indigo`, `zmoki-red`, … — each a full `50→950` scale,
defined in **`src/design-tokens.mjs`** (single source of truth, consumed by
`tailwind.config.mjs` and the brand reference page). Templates use `zmoki-*`
utility classes only — **no inline hex**.

The starter is **warm-indigo**: an ivory canvas (**`zmoki-cream`**, a *custom*
scale), warm greys for ink/borders (**`zmoki-stone`**), and a single **indigo**
accent (**`zmoki-indigo`**). Every other chromatic group already exists as a
utility — it's just unused until you reach for it.

Live reference: `/-/astro/brand/color/`.

## Step 1 — Ask the user

Use `AskUserQuestion` to settle two things before editing:

1. **Which color?** A Tailwind color name (slate, gray, zinc, neutral, stone,
   red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue,
   indigo, violet, purple, fuchsia, pink, rose) **or** a custom brand color (a hex
   like `#2f6bff`). Free-text is fine.
2. **Scope?** Accent only (links, nav button, hero, CTA, action buttons — canvas,
   body text, borders stay as-is) **or** a fuller re-skin (also recolor the
   `zmoki-cream` canvas and/or `zmoki-stone` greys).

## Step 2 — Pick the path

- **Built-in Tailwind color** (one of the names above) → **Path A**. Nothing to
  add in `design-tokens.mjs`; the `zmoki-<name>-*` utilities already exist.
- **Custom color** (a hex, not a Tailwind default) → **Path B**. Build a scale
  first.

### Path B — build a custom scale

The user prefers **[colorhexa.com](https://www.colorhexa.com/)**. Build a full
`50→950` scale from their base color:

1. The base hex is `500`.
2. From colorhexa's **"Shades and Tints"** ramp: lighter tints (toward white) fill
   `400 300 200 100 50`; darker shades (toward black) fill `600 700 800 900 950`.
3. **Pick by eye for even, Tailwind-like spacing** — Tailwind's own scales ramp
   non-linearly, so match that feel rather than fixed 10% stops.

Fetch `https://www.colorhexa.com/<hex-without-#>` (e.g. `.../2f6bff`) with
WebFetch to read off the shade/tint hexes, or ask the user to paste the scale.

Add it to `customPalettes` in `src/design-tokens.mjs` (the existing `zmoki-cream`
scale is the worked example):

```js
const brand = { 50: "#…", 100: "#…", /* … */ 950: "#…" };
const customPalettes = {
  "zmoki-cream": cream,
  "zmoki-brand": brand,
};
```

It auto-generates `zmoki-brand-*` utilities and auto-appears on
`/-/astro/brand/color/` (via the `customPaletteNames` export). Use `zmoki-brand`
as the target group in Step 4.

## Step 3 — Check combinations (WCAG AA)

Before committing to shades, make sure every text/background pair the palette
produces meets **at least WCAG AA**. Verify each pair with Figma's checker:
**<https://www.figma.com/color-contrast-checker/>** (paste the two hexes from
`src/design-tokens.mjs` / `/-/astro/brand/color/`).

Thresholds:

- **Normal text** — **≥ 4.5:1**
- **Large text** (≥ 24px, or ≥ 18.66px bold) and **UI / graphical elements**
  (borders, icons, focus rings) — **≥ 3:1**

Pairs to check on every re-skin (`<target>` = the chosen accent group):

| Foreground                                   | Background                                        | Min   |
| -------------------------------------------- | ------------------------------------------------- | ----- |
| Ink text `zmoki-stone-900`                   | page bg `zmoki-cream-100`, cards `white`          | 4.5:1 |
| Muted text `zmoki-stone-500`                 | `white` / page bg                                 | 4.5:1 |
| Inverse text `white`                         | accent fills — nav CTA, hero, CTA band, buttons   | 4.5:1 |
| Borders / focus ring (`<target>-500`/`-600`) | `white` / page bg                                 | 3:1   |

Rules:

- A fill that carries **white text** (buttons, CTA, hero) must be dark enough to
  pass — usually `-600` / `-700`. The mid/light shades of bright hues (yellow,
  lime, amber, cyan, sky, …) **fail** white-on-fill AA: go darker, or flip to
  **dark text on a light fill**.
- If a pair fails AA, **fix the shade — don't ship it.**
- For custom (colorhexa) scales, check the specific shades you actually use, not
  just `-500`.
- Note any pair that lands close to the threshold in the commit/PR.

## Step 4 — Apply

Let `<target>` be the chosen accent group (`zmoki-blue`, `zmoki-brand`, …).

- **Accent only** — find/replace the accent group site-wide:

  ```bash
  grep -rl "zmoki-indigo" src | xargs sed -i '' "s/zmoki-indigo/<target>/g"
  ```

  This recolors links, nav CTA, hero, closing CTA band, action/copy buttons, and
  soft accent fills together. In-prose links are driven by the `accent` constant
  in `tailwind.config.mjs` — update it there too so links recolor.

- **Fuller re-skin** — also swap the canvas and/or greys the same way:
  `zmoki-cream` → new canvas scale, `zmoki-stone` → new grey scale. The
  `ink`/`accent` constants in `tailwind.config.mjs` drive the prose/link CSS that
  can't reference a utility class — keep them in step with the utilities.

Notes on `sed` in `zsh`: pass file paths explicitly (unquoted `$VAR` isn't
word-split); the bracketed filename `src/pages/thank-you/[...slug].astro` must be
quoted. Confirm the match count looks right before and after.

Keep inverse text on colored fills readable (`text-white` on dark shades) and
re-confirm each fill still passes the Step 3 contrast check at the shade you land
on.

## Step 5 — Sync docs & the brand page

- Update **AGENTS.md** ("Color system", "Conventions", "Changing the palette") and
  **SETUP.md** ("Palette") if the conventions/shades changed.
- The `/-/astro/brand/color/` page is generated from the tokens — no edit needed
  for the swatches, but check its intro copy still describes the palette.
- OG cards recolor automatically (`src/og/theme.ts` reads the tokens) — see
  **`/og-images`** only if you want card-specific tuning.

## Step 6 — Verify

Run the shared verify (format / check / build) from `SKILL.md`, then:

```bash
# confirm the accent utilities compiled to the new group
grep -oE "\.bg-<target>-600\{[^}]*\}" dist/_astro/*.css | head -1
```

Open `/-/astro/brand/color/` (via `/run`) and eyeball the palette plus `/` and a
blog post. Re-confirm the Step 3 pairs at the shades you shipped — at minimum
ink-on-bg and white-on-CTA.

## Notes

- The re-skin rules (incl. WCAG AA pairs) also live in `AGENTS.md` and `SETUP.md`
  — keep all in sync if the workflow changes.
- `zmoki-cream` is a custom scale (not a Tailwind default) — the worked example of
  adding one. Don't reintroduce semantic role tokens; the system is
  palette-group-based.
