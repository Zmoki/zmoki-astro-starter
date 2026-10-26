---
description: Update project dependencies (npm packages + GitHub Actions) safely, in staged and separately-verified commits. Use when the user wants to upgrade, bump, or update dependencies.
---

# Update dependencies

Bump dependencies in stages, one commit per stage, verifying each, so a regression is easy to bisect and revert. Never bump everything in one shot.

## 0. Baseline

Work on a branch or a dedicated worktree, with a clean tree. Confirm the project is green before changing anything:

```bash
npm install
npm run build && npm run check && npm run lint && npm run format:check
npm audit   # record the starting count
```

## 1. Categorize

```bash
npm outdated
```

- **Safe**: the `Wanted` column (within the current semver range).
- **Major**: `Latest` > `Wanted`. Breaking; handle one at a time.

## 2. Security audit

```bash
npm audit
```

**Never run `npm audit fix --force` blind.** It often "fixes" by downgrading to an ancient major (it proposes `@lhci/cli@0.1.0`, which breaks the tool). Read each advisory and decide.

Find where the vulnerable package sits with `npm ls <pkg>`, then:

1. **Direct dep with a forward fix**: bump it like any other update. Prefer this.
2. **Transitive dep whose parent has a newer release**: bump the parent.
3. **Transitive dep with no forward fix** (the parent is already latest): pin the patched version in `overrides` in `package.json`, reinstall, re-audit:

   ```jsonc
   "overrides": {
     "tmp": "^0.2.7",
     "uuid": "^11.1.1",
     "@tailwindcss/typography": { "postcss-selector-parser": "^6.1.5" }
   }
   ```

   Use a global override when `npm ls <pkg>` shows only one parent chain. Scope it under the parent (as with `@tailwindcss/typography` above) when other consumers still need the old version. An override can cross a major, so check the owning tool still runs: a clean `npm audit` isn't enough. For `@lhci/cli`, run `npx lhci healthcheck`.

Weigh the blast radius. A vuln in a dev/CI-only tool (Lighthouse, Prettier, ESLint) never reaches visitors; don't force a risky override for it. Commit any `overrides` change on its own (`fix(deps): …`).

**Deprecation warnings** (`npm warn deprecated …`) are maintainer notices, not advisories. If the parent still requires the old version, leave it until upstream updates. Only chase one when it has a matching `npm audit` advisory or the parent is your own direct dep.

## 3. Confirm scope

Ask the user how far to go: safe only, safe plus specific majors, or everything. Majors can be large migrations.

## 4. Stage the work, one commit per bump

Safe updates, all at once:

```bash
npm update
npm run build && npm run check && npm run lint
git commit -am "chore(deps): apply safe within-range dependency updates"
```

Each major, separately:

1. Read the official upgrade guide (fetch it; don't trust memory for recent versions).
2. `npm install <pkg>@^<major>`. Install coupled packages together (see the notes at the end).
3. Apply the code/config migration.
4. Verify (section 5), then commit with a message saying what broke and how you migrated it.

## 5. Verify every stage

- `npm run build`, `npm run check`, `npm run lint`.
- `npm run format`, so CI's `format:check` passes. A Tailwind bump can produce wide class-reorder diffs; they're cosmetic.
- **Runtime**, not just a green build: start `npm run preview` and `npm run dev` (the Vite dev path differs), `curl` real pages at the URL each prints, then stop them with `npx astro preview stop` / `npx astro dev stop`. Confirm the stylesheet loads and the content pipeline output is intact: copy buttons (`data-copy-button`), external links (`data-external`), Shiki (`astro-code`). See `/run`.
- After a **satori**, **@resvg/resvg-js** or **culori** bump, open a few `dist/og/**.png`. A broken font/color pipeline still builds but produces blank or black cards.

## 6. Lockfile hygiene

Incremental installs can leave `package-lock.json` missing cross-platform optional deps (e.g. Tailwind 4's `@tailwindcss/oxide` bindings and `@emnapi/*`). CI's `npm ci` then fails with `EUSAGE … Missing: <pkg> from lock file`. After the majors, regenerate and validate the way CI does:

```bash
rm -rf node_modules package-lock.json
npm install
npm ci        # must succeed; this is what CI runs
```

Commit the regenerated lock.

## 7. GitHub Actions

Actions are pinned by major tag. List them with their latest release:

```bash
grep -rn "uses:" .github/workflows/
for a in $(grep -rhoE "uses: [^@]+" .github/workflows/ | awk '{print $2}' | sort -u); do
  echo "$a -> $(gh api repos/$a/releases/latest --jq .tag_name)"
done
```

Bump each `uses: <action>@vN` to the latest major. For `github-script`, skim the inline `script:`; v8/v9 keep `github.rest.*`, `context.*` and `require`.

### Node and npm versions

- **`.node-version`** (exact, e.g. `24.22.1`) is the one pin. CI reads it (`actions/setup-node` with `node-version-file: .node-version`), and so do Cloudflare Pages and Netlify. Cloudflare reads nothing else, so a missing or stale file falls back to an older Node. The build scripts (`node scripts/*.ts` in `prebuild`) need Node ≥ 24's native type-stripping; on older Node the deploy fails with `ERR_UNKNOWN_FILE_EXTENSION` even when CI is green.
- **`package.json` `engines.node`** (`">=24"`) is the floor, not a pin. Vercel reads its major. Raise it only for a new Node major, and keep `@types/node` on the pinned major.
- **AWS Amplify** reads neither; set the Node version in its build settings (or `nvm use` in `amplify.yml`) to match `.node-version`.
- **npm** isn't pinned separately: each Node release bundles its npm. (Don't add `packageManager`; it relies on corepack, which newer Node no longer bundles.)

On each pass, bump `.node-version` to the latest patch of its major (patches are often security releases):

```bash
curl -s https://nodejs.org/dist/index.json | python3 -c "import json,sys; m=open('.node-version').read().split('.')[0]; print(next(r['version'] for r in json.load(sys.stdin) if r['version'].startswith('v'+m+'.')))"
grep -H . .node-version; grep -n '"node"' package.json; grep -rn node-version .github/workflows/
```

Move to a new Node major only once it's LTS, as its own commit.

## 8. PR and CI

```bash
git push -u origin <branch>
gh pr create --base main --title "chore(deps): …" --body "…"
gh pr checks <PR#> --watch --interval 15
```

Both `ci` and `lighthouse` must pass. If `ci` fails within seconds at "Install dependencies", it's the lockfile: go back to section 6.

In a worktree, `gh pr merge --delete-branch` fails with `'main' is already used by worktree`. The merge still lands; delete the branch with `git push origin --delete <branch>`.

## Project-specific migration notes

- **Astro 7 Markdown** defaults to the Sätteri processor, which doesn't run remark/rehype plugins. This project needs its custom rehype plugins, `remarkRehype` handlers and Shiki, so it uses the unified pipeline: `@astrojs/markdown-remark` and `markdown.processor: unified({...})` in `astro.config.mjs`, with the plugins passed inside `unified({...})` (Astro 7.4 deprecates the old `markdown.remarkPlugins` / `rehypePlugins` / `remarkRehype` keys). MDX 8 needs `@astrojs/markdown-remark` 7.3 or later.
- **Content Layer**: collections live in `src/content.config.ts` with `glob()` loaders (`astro/loaders`). Entries use `.id` (not `.slug`) and `render(entry)` from `astro:content` (not `entry.render()`). `entry.body` is `string | undefined`; guard it.
- **Tailwind 4** uses the `@tailwindcss/vite` plugin in `astro.config.mjs`; the old `@astrojs/tailwind` integration caps Astro at 5, so Astro 7 and Tailwind 4 move together. Styles enter via `src/styles/global.css` (`@import "tailwindcss"`), imported in `BaseLayout` and `BrandLayout`. `tailwind.config.mjs` is loaded with `@config`. There's no JS `safelist`; use `@source inline("…")` for classes the scanner can't see (the rehype-injected copy-button classes). Check `/-/astro/brand/color/` still renders.
- **`@lhci/cli` audit noise (dev-only)**: the remaining `npm audit` findings and most deprecation warnings trace to `@lhci/cli` and its Lighthouse sub-deps. It's already latest, so there's no forward fix, and `audit fix --force` would downgrade it to 0.1.0. The `tmp` and `uuid` overrides clear the advisories they target; confirm with `npx lhci healthcheck`. The `inflight` / `rimraf@3` / `glob@7` warnings come from `chrome-launcher` and carry no advisory. Leave them: forcing `rimraf@4+` (callback API removed) breaks chrome-launcher's temp-profile cleanup.
