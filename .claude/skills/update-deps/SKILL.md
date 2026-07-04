---
description: Update project dependencies (npm packages + GitHub Actions) safely, in staged and separately-verified commits. Use when the user wants to upgrade, bump, or update dependencies.
---

# Update dependencies

Bump dependencies in **staged, separately-committed steps**, verifying at each
step, so a regression is easy to bisect and revert. Never bump everything in one
shot.

## 0. Baseline

Work on a branch (or a dedicated worktree). Ensure a clean tree, install, and
confirm the project is green **before** changing anything — otherwise you can't
tell what your changes broke:

```bash
npm install
npm run build && npm run check && npm run lint && npm run format:check
```

## 1. Categorize

```bash
npm outdated
```

Split the results into two buckets:

- **Safe** — the `Wanted` column (within the current semver range). Low risk.
- **Major** — `Latest` > `Wanted` (a new major). Breaking; handle one at a time.

## 2. Confirm scope

Ask the user how far to go: safe-only, safe + specific majors,
or everything. Majors can be large migrations — don't assume.

## 3. Stage the work — one commit per bump

For **safe updates** (all at once is fine):

```bash
npm update
npm run build && npm run check && npm run lint
git commit -am "chore(deps): apply safe within-range dependency updates"
```

For **each major**, separately:

1. **Research** the breaking changes first — read the official upgrade guide
   (fetch it). Don't trust memory for versions newer than your cutoff.
2. `npm install <pkg>@^<major>` (install coupled packages together — see below).
3. Apply the code/config migration.
4. **Verify** (section 4), then commit with a message explaining what broke and
   how you migrated it.

## 4. Verification gates (every stage)

- `npm run build` — must produce output; a green build alone isn't proof.
- `npm run check` (astro type check) and `npm run lint`.
- `npm run format` — the Tailwind + astro Prettier plugins re-sort/reflow;
  run it so `format:check` (CI) passes. Expect wide class-reorder diffs after a
  Tailwind bump — that's cosmetic, not functional.
- **Runtime**, not just a green build: start `npm run preview` (and `npm run dev`
  — the Vite dev path differs) and `curl` real pages. Confirm the stylesheet
  links and serves, and that content-pipeline output is intact (copy buttons
  `data-copy-button`, external-link `data-external`, shiki `astro-code`). See
  the `/run` skill.
- After a **satori**, **@resvg/resvg-js**, or **culori** bump, run `npm run build`
  and open a couple of `dist/og/**.png` — confirm the cards still render with the
  brand colors, fonts, and text (a broken font/color pipeline still "builds" but
  produces blank or black cards). See `src/og/`.

## 5. Lockfile hygiene (critical for CI)

Incremental `npm install` calls can leave `package-lock.json` missing
cross-platform **optional** deps (e.g. Tailwind 4 pulls `@tailwindcss/oxide`
native/wasm bindings + `@emnapi/*`). CI's `npm ci` validates the lock strictly
and fails with `EUSAGE … Missing: <pkg> from lock file`. After the majors,
regenerate cleanly and validate the way CI does:

```bash
rm -rf node_modules package-lock.json
npm install
npm ci        # must succeed — this is exactly what CI runs
```

Commit the regenerated lock.

## 6. GitHub Actions

Workflow actions are dependencies too, and pinned by major tag. Check them:

```bash
grep -rn "uses:" .github/workflows/
for a in actions/checkout actions/setup-node actions/upload-artifact actions/github-script; do
  echo "$a -> $(gh api repos/$a/releases/latest --jq .tag_name)"
done
```

Bump each `uses: <action>@vN` to the latest major. For `github-script`, skim the
inline `script:` — v8/v9 keep `github.rest.*`, `context.*`, and `require`, so
stable scripts carry over.

### Node version — keep three files in sync

The Node major is pinned in **three** places that must move together whenever you
bump the `engines` floor:

- **`package.json`** `engines.node` (e.g. `">=24"`) — the declared floor.
- **`.github/workflows/*.yml`** `node-version:` (`ci.yml` + `lighthouse.yml`) — CI.
- **`.node-version`** (repo root, e.g. `24.11.1`) — **Cloudflare Pages**, the deploy
  builder. This is the easy one to forget: Cloudflare reads _neither_ `engines`
  nor the CI workflow, so if it's missing/stale the build falls back to an older
  default Node. That bit us once — Cloudflare ran Node 22, which can't execute the
  `.ts` build scripts natively (`node scripts/generate-redirects.ts` in `prebuild`),
  and the deploy died with `ERR_UNKNOWN_FILE_EXTENSION` even though CI was green.
  The build scripts are `.ts` and rely on Node ≥24's native type-stripping — so the
  deploy Node version is load-bearing, not cosmetic.

After bumping the floor, grep to confirm nothing drifted:

```bash
grep -H node .node-version; grep -n '"node"' package.json; grep -rn node-version .github/workflows/
```

## 7. PR + watch CI

```bash
git push -u origin <branch>
gh pr create --base main --title "chore(deps): …" --body "…"
gh pr checks <PR#> --watch --interval 15
```

Both `ci` and `lighthouse` must go green. If `ci` fails in seconds at "Install
dependencies", it's the lockfile — go back to section 5.

**Worktree caveat:** `gh pr merge --delete-branch` fails with
`'main' is already used by worktree` because the primary checkout holds `main`.
The merge still lands on GitHub; just delete the branch manually afterward:
`git push origin --delete <branch>`.

## Project-specific migration notes

Discovered during the Astro 7 / Tailwind 4 / Puppeteer 25 upgrade — check these
if bumping past those majors:

- **Astro 7 markdown** defaults to the new **Sätteri** processor, which does
  **not** run remark/rehype plugins. This project depends on custom rehype
  plugins, `remarkRehype` handlers, and shiki, so it opts back into the unified
  pipeline: `npm i @astrojs/markdown-remark`, then `markdown.processor:
unified()` in `astro.config.mjs`. Keep it unless you port the plugins.
- **Astro Content Layer** replaced the legacy `type: "content"` collections API.
  Config lives at `src/content.config.ts` with `glob()` loaders (`astro/loaders`);
  entries use `.id` (not `.slug`) and `render(entry)` from `astro:content`
  (not `entry.render()`). `entry.body` is now `string | undefined` — guard it.
- **Tailwind 4** drops the `@astrojs/tailwind` integration (which also caps
  Astro at 5) — use the `@tailwindcss/vite` plugin in `astro.config.mjs`. Astro 7
  and Tailwind 4 are therefore **coupled** — bump them together. Styles enter via
  `src/styles/global.css` (`@import "tailwindcss"`) imported in `BaseLayout` and
  `BrandLayout`. The v3-style `tailwind.config.mjs` is kept via the `@config`
  directive; the JS `safelist` is gone — use `@source inline("…")` for classes
  the scanner can't see (the rehype-injected copy-button classes). Verify the
  brand color page renders: `/-/astro/brand/color/`.
