# Brand — typography (font swap)

The guideline is `/-/astro/brand/typography/`. Open it first (`/run`) and update it in step 4.

The site uses three Tailwind families with fixed roles:

| Family | Utility      | Role                                                 |
| ------ | ------------ | ---------------------------------------------------- |
| sans   | `font-sans`  | Headings **and** body copy + prose (global `<body>`) |
| serif  | `font-serif` | Available but unused (all-sans starter)              |
| mono   | `font-mono`  | Code, eyebrows, dates, nav, footer, buttons          |

The default is Noto Sans + Noto Sans Mono, self-hosted via [Astro's Fonts API](https://docs.astro.build/en/guides/fonts/): downloaded and subset at build, served from `/_astro/fonts/`. Astro generates a metrics-matched fallback, so there's no manual `@font-face` or metrics work. To add a display serif for headings, `font-serif` is the family to set (see Notes).

Before starting, pick families at fonts.google.com (or another [Astro font provider](https://docs.astro.build/en/guides/fonts/#font-providers)) and note their available weights and axes.

## 1. Names — `src/design-tokens.mjs`

The only place family names live. `name` is the family on the provider; `variable` is the CSS custom property everything else uses:

```js
export const fonts = {
  sans: { name: "Noto Sans", variable: "--font-noto-sans" },
  mono: { name: "Noto Sans Mono", variable: "--font-noto-sans-mono" },
};
```

`astro.config.mjs`, `tailwind.config.mjs`, the layouts' `<Font>` tags and the brand pages all import this. If you change a `variable`, also update its literal in the JSDoc `@type` above `fonts` (it pins the values for the `<Font cssVariable>` prop type).

## 2. Provider and axes — `astro.config.mjs`

The `fonts` array takes `name` / `cssVariable` from step 1. Set the provider and fetch only the weights, styles and subsets you use:

```js
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
    styles: ["normal"],
    subsets: ["latin"],
    fallbacks: ["ui-monospace", "monospace"],
  },
],
```

## 3. Tailwind — `tailwind.config.mjs`

Templates never name a family; they use the CSS variables:

- `fontFamily` (in `theme.extend`) points each utility at its variable:
  ```js
  fontFamily: {
    sans: [`var(${fonts.sans.variable})`],
    serif: ["Noto Serif", "Georgia", "serif"],
    mono: [`var(${fonts.mono.variable})`],
  },
  ```
- `headingFontStack` (near the imports) is the `h1`–`h6` family, used by the `typography()` prose overrides and the `addBase` plugin. In the all-sans setup it's the sans variable:
  ```js
  const headingFontStack = `var(${fonts.sans.variable})`;
  ```

If you rename a `cssVariable` or add/remove a family, update the `<Font cssVariable="…" />` tags in both `src/layouts/BaseLayout.astro` and `src/layouts/BrandLayout.astro` (the sans face carries `preload`). Changing only `name` or weights needs no layout edit.

## 4. Brand specimen and docs

Family names render from step 1 automatically. Edit the copy that describes the typeface's character:

- `src/pages/-/astro/brand/typography.astro`: intro prose, the font-pairing cards (weight/character notes), the prose specimen.
- `src/pages/-/astro/brand/index.astro`: the Typography card `summary`.
- `src/pages/-/astro/brand/components.astro`: check the heading specimens still read well.
- `SETUP.md` → Brand and `AGENTS.md` → Styling, if they describe the type.

## 5. OG card font

The OG cards bundle their own font files for Satori; the site swap doesn't change them. Update `src/og/fonts.ts` and the `.woff` files in `src/og/fonts/` too. See `/og-images`.

## 6. Verify

Run the verify block from `SKILL.md`, then:

```bash
# no leftovers of the old family (replace with its name)
grep -rn "<old family name>" src/ astro.config.mjs tailwind.config.mjs

# utilities compiled to the new CSS variables
grep -rhoE "\.font-(sans|serif|mono)\{[^}]*\}" dist/_astro/*.css | sort -u

# fonts self-hosted, and Astro's fallback generated
ls dist/_astro/fonts/
grep -rho "font-family:[^;}]*fallback[^;}]*" dist/**/*.html | sort -u | head
```

Reload `/-/astro/brand/typography/` via `/run`. To check layout shift, run `npm run build && npm run lhci:desktop` and confirm the home page's `cumulative-layout-shift` stays low (the hero shifts most easily).

## Notes

- If a family changes role (e.g. a serif for headings), update both the `font-*` utilities in templates and `headingFontStack`. They must agree.
- Existing `font-sans` / `font-mono` usages pick up the new face with no template edits.
