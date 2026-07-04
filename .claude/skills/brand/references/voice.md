# Brand — voice & tone

Rewrite how the site _sounds_ — the voice pillars, house style, and worked
examples. Everything lives in one file:

**`src/pages/-/astro/brand/voice.astro`** → renders `/-/astro/brand/voice/`.

The page is data-driven: near the top are plain arrays/objects you edit; the
markup below maps over them. The page is meant to **model its own rules**, so the
copy you write here should itself obey the voice you're describing.

> This page ships with an example "house style" (neutral, product-oriented). On a
> real project it's expected you rewrite it to match the actual brand — this is
> the main file `SETUP.md` calls out for editing. It uses the placeholder name
> **`My Project X`** and is **not** wired to `src/site.config.ts`.

## What to edit (the data blocks, top of the file)

| Const             | Drives                      | Shape                                         |
| ----------------- | --------------------------- | --------------------------------------------- |
| `pillars`         | The voice principles        | `{ label, summary, detail }` — one per pillar |
| `mechanics`       | House-style do/don't rules  | `{ rule, right, wrong }`                      |
| `examples`        | Side-by-side rewrites       | `{ context, wrong, right, note }`             |
| `sampleQuestions` | FAQ-style question models   | strings                                       |
| `lexicon`         | Use / avoid word lists      | `{ use: [...], avoid: [...] }`                |
| `microcopy`       | Voice in UI copy, not prose | `{ context, right, wrong }` (or similar)      |
| `checklist`       | Pre-publish self-check      | strings                                       |

The section headings that render these live in the markup below the data — the
`<h1>` is "Voice & tone" and there's a "Who's speaking" intro `<section>`. If you
add or remove a whole section (not just entries), edit both the data const **and**
its rendering block.

## Workflow

1. **Settle the voice first.** If the user hasn't given you the pillars/tone, ask
   the user for the 3–4 principles and the audience before rewriting —
   don't invent a brand voice silently.
2. **Rewrite the data blocks** to match. Keep the `right`/`wrong` pairs genuinely
   contrastive — the `wrong` should be the generic marketing default, the `right`
   the voice in practice.
3. **Practice what you preach.** The page's own prose (intro, section blurbs)
   should obey the new rules — sentence-case headings, plain words, etc.
4. **Sync the summary elsewhere:** the Voice & tone card `summary` on
   `src/pages/-/astro/brand/index.astro` should echo the new tone in a line.

## Verify

Voice is content, not build config, so the shared `npm run build` is enough to
prove it compiles. The real check is a read-through:

```bash
npm run check   # 0 errors (catches broken markup / TS in the frontmatter)
npm run build   # must pass
```

Then open `/-/astro/brand/voice/` (via `/run`) and read it top to bottom — every
do/don't and rewrite should still make sense, and the page should _sound_ like the
voice it prescribes. Note: the `contentModifiedDate` bump rule applies only to
content collections (blog/resources/legal), **not** these internal brand pages —
no date bump needed here.

## Notes

- Colors used for the do/don't accents (`zmoki-emerald-700` = do,
  `zmoki-rose-700` = don't) come from the palette — leave them unless a re-skin
  changes conventions.
- This page is `noindex` (internal style guide); it won't appear in search or the
  sitemap.
