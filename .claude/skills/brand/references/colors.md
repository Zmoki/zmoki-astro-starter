# Brand — colors (re-skin)

Shift the accent, recolor the canvas and greys, or add a custom brand color.

The guideline is `/-/astro/brand/color/`. Open it first (`/run`); it renders live from the tokens. Update its convention copy along with the tokens.

Every color is a `zmoki-*` scale (`50`→`950`) defined in `src/design-tokens.mjs`. All of Tailwind's default palettes are already there as `zmoki-<name>`. The starter uses three: `zmoki-cream` (the ivory canvas, a custom scale), `zmoki-stone` (warm greys for ink and borders) and `zmoki-indigo` (the accent).

## Step 1 — Ask the user

1. **Which color?** A Tailwind color name (slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose) or a custom hex like `#2f6bff`.
2. **Scope?** Accent only (links, nav button, hero, CTA, action buttons), or a fuller re-skin that also recolors the `zmoki-cream` canvas and/or `zmoki-stone` greys.

## Step 2 — Custom color only: build a scale

A Tailwind color name needs no token edits; skip to Step 3.

For a custom hex, build a full `50`→`950` scale with [colorhexa.com](https://www.colorhexa.com/) (the user's preferred tool):

1. The base hex is `500`.
2. From colorhexa's "Shades and Tints", lighter tints fill `400 300 200 100 50` and darker shades fill `600 700 800 900 950`.
3. Pick by eye for even, Tailwind-like spacing. Tailwind's scales aren't linear, so don't use fixed 10% steps.

Fetch `https://www.colorhexa.com/<hex-without-#>` to read the values, or ask the user to paste the scale. Add it to `customPalettes` in `src/design-tokens.mjs` (`zmoki-cream` is the example):

```js
const brand = { 50: "#…", 100: "#…", /* … */ 950: "#…" };
const customPalettes = {
  "zmoki-cream": cream,
  "zmoki-brand": brand,
};
```

This generates `zmoki-brand-*` utilities and adds the scale to `/-/astro/brand/color/` (via `customPaletteNames`).

## Step 3 — Check contrast (WCAG AA)

Check every pair with Figma's checker: <https://www.figma.com/color-contrast-checker/>. Take the hexes from `src/design-tokens.mjs` or the color page.

- **Normal text**: at least 4.5:1.
- **Large text** (24px+, or 18.66px+ bold) and **UI elements** (borders, icons, focus rings): at least 3:1.

| Foreground                                   | Background                                     | Min   |
| -------------------------------------------- | ---------------------------------------------- | ----- |
| Ink text `zmoki-stone-900`                   | page bg `zmoki-cream-100`, cards `white`       | 4.5:1 |
| Muted text `zmoki-stone-500`                 | `white` / page bg                              | 4.5:1 |
| Inverse text `white`                         | accent fills: nav CTA, hero, CTA band, buttons | 4.5:1 |
| Borders / focus ring (`<target>-500`/`-600`) | `white` / page bg                              | 3:1   |

- A fill under white text usually needs `-600` or `-700`. The mid and light shades of bright hues (yellow, lime, amber, cyan, sky, …) fail; go darker or use dark text on a light fill.
- For a custom scale, check the shades you actually use, not just `-500`.
- If a pair fails, fix the shade. Note any pair close to the threshold in the PR.

## Step 4 — Apply

Let `<target>` be the new accent group (`zmoki-blue`, `zmoki-brand`, …).

**Accent only**: replace the group across `src/`:

```bash
grep -rl "zmoki-indigo" src | xargs sed -i '' "s/zmoki-indigo/<target>/g"
```

Prose links and global link hover don't use utilities; they use the `accent` / `accentHover` constants (`twColors.indigo[600]` / `[700]`) in `tailwind.config.mjs`. Change those too.

**Fuller re-skin**: also replace `zmoki-cream` (canvas) and/or `zmoki-stone` (greys) the same way, and keep the `ink` constant in `tailwind.config.mjs` in step.

Count matches before and after. In zsh, quote paths like `src/pages/thank-you/[...slug].astro`, and don't rely on word-splitting an unquoted `$VAR` of file paths. Recheck Step 3 at the shades you end up with.

## Step 5 — Sync docs

- Update the conventions table in `AGENTS.md` → Styling and `SETUP.md` → Brand if conventions or shades changed.
- The color page's swatches come from the tokens; check its intro copy still describes the palette.
- OG cards recolor automatically (`src/og/theme.ts` reads the tokens). Use `/og-images` only for card-specific tuning.

## Step 6 — Verify

Run the verify block from `SKILL.md`, then:

```bash
# the accent utilities compiled to the new group
grep -oE "\.bg-<target>-600\{[^}]*\}" dist/_astro/*.css | head -1
```

`/run` and check `/-/astro/brand/color/`, `/` and a blog post. Recheck at least ink-on-bg and white-on-CTA at the shipped shades.
