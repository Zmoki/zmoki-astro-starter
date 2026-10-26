# Brand — voice & tone

Rewrite how the site sounds: voice pillars, house style, worked examples. It all lives in `src/pages/-/astro/brand/voice.astro` (renders `/-/astro/brand/voice/`).

The shipped page is an example house style (neutral, product-oriented) that a real site should rewrite. It reads the site name from `site.name`; use `site.name` in new copy the same way.

## What to edit

Data consts at the top of the file; the markup below maps over them.

| Const             | Drives                     | Shape                                        |
| ----------------- | -------------------------- | -------------------------------------------- |
| `pillars`         | The voice principles       | `{ label, summary, detail }`, one per pillar |
| `mechanics`       | House-style do/don't rules | `{ rule, right, wrong }`                     |
| `examples`        | Side-by-side rewrites      | `{ context, wrong, right, note }`            |
| `sampleQuestions` | FAQ-style question models  | strings                                      |
| `lexicon`         | Use / avoid word lists     | `{ use: [...], avoid: [...] }`               |
| `microcopy`       | Voice in UI copy           | `{ pattern, example, note }`                 |
| `checklist`       | Pre-publish self-check     | strings                                      |

Section headings, the `<h1>` and the "Who's speaking" intro are in the markup. To add or remove a whole section, edit both the const and its rendering block.

## Workflow

1. **Settle the voice first.** If the user hasn't given them, ask for the 3–4 principles and the audience. Don't invent a brand voice.
2. **Rewrite the data.** Keep `right`/`wrong` pairs truly contrastive: `wrong` is the generic marketing default, `right` is the voice in practice.
3. **Make the page follow its own rules**: its intro and section blurbs should obey the new voice (sentence-case headings, plain words, …).
4. **Update the Voice & tone card `summary`** in `src/pages/-/astro/brand/index.astro`.

Leave the do/don't accent colors (`zmoki-emerald-700` = do, `zmoki-rose-700` = don't) unless a re-skin changes conventions. No `contentModifiedDate` bump: that rule is for content collections only.

## Verify

```bash
npm run check
npm run build
```

Then open `/-/astro/brand/voice/` via `/run` and read it top to bottom. Every do/don't and rewrite should make sense, and the page should sound like the voice it describes.
