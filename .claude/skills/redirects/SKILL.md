---
description: Add or edit URL redirects. Use when the user wants to redirect a legacy/old URL, moved page, or external link — anything that should return a 301/302 on the site's host (Cloudflare, Netlify, Vercel, or Amplify).
---

# Redirects

URL redirects. Authored once as platform-neutral CSV in `src/redirects/`, compiled to the host's redirect format (see Platform below).

## Model

- **Source of truth:** `src/redirects/*.csv` — platform-neutral, one file per group (`blog.csv`, `other.csv`, …). Add new files freely; they're merged in filename order.
- **Generated output:** depends on `site.platform.deploy` (see below) — **never edit by hand.** Overwritten on every build.
- **Builder:** `scripts/generate-redirects.ts`, run via `npm run build:redirects`. Also runs automatically before `npm run build` (the `prebuild` npm hook), so CI keeps the output in sync.

## Platform

The output artifact is chosen by `platform.deploy` in `src/site.config.ts`:

| `platform`               | Generated artifact  | Format                                                      |
| ------------------------ | ------------------- | ----------------------------------------------------------- |
| `"cloudflare"` (default) | `public/_redirects` | `/old /new 301`                                             |
| `"netlify"`              | `public/_redirects` | same `_redirects` format                                    |
| `"vercel"`               | `vercel.json`       | `redirects[]` merged in (`{source,destination,statusCode}`) |
| `"amplify"`              | `redirects.json`    | `[{source,target,status}]` — paste into console / IaC       |

The CSV format is the same regardless of platform; only the emitted artifact changes. Vercel accepts 3xx redirects only — a `200` row is skipped with a warning (a 200 is a rewrite/proxy, configured separately on Vercel). Switching platforms warns about the stale artifact left behind by the previous one; delete it.

## CSV format

Columns: `source,destination,code` — one redirect per row.

```csv
source,destination,code
/feed/old-slug/,/blog/1-new-slug/,301
/resources/something/,https://external.example.com/,302
/legacy/,/blog/,
```

- `source` — the incoming path (required)
- `destination` — where to send it: a site path or a full external URL (required)
- `code` — HTTP status (optional, defaults to `301`). Allowed: `200`, `301`, `302`, `303`, `307`, `308`
- Lines starting with `#` and blank lines are ignored — use them for comments

Pick the file by kind: blog-post moves → `blog.csv`; resources, external links, and one-offs → `other.csv`; or create a new grouping CSV.

## Add a redirect

1. Edit the relevant CSV under `src/redirects/` (choose an existing group or add a new `*.csv`).
2. Rebuild:
   ```bash
   npm run build:redirects
   ```
3. Commit **both** the CSV and the regenerated artifact together.

## Commit & CI

- The generated artifact is **committed to git** (not gitignored) — so redirect changes show in PR diffs and Vercel reads `vercel.json` from the repo source.
- CI runs `npm run check:redirects`, which regenerates the artifact and **fails if it drifts** from what's committed. So a CSV edit without a rebuild is caught before merge — always rebuild and commit the result.

## Platform limits

Each host caps how many redirects the artifact may hold. The build **warns at ≥90%** of the cap and **fails the build once it's exceeded** (so you find out before deploy, not after silent drops):

| `platform`   | Cap                                        | Beyond the cap                                                |
| ------------ | ------------------------------------------ | ------------------------------------------------------------- |
| `cloudflare` | **2,100** (2,000 static + 100 dynamic)     | Cloudflare Bulk Redirects (silently drops rules past the cap) |
| `vercel`     | **1,024** (shared with rewrites + headers) | Edge Middleware + Edge Config                                 |
| `netlify`    | no hard count (file-size bound)            | wildcards/placeholders; Edge Functions past ~10k              |
| `amplify`    | no documented quota                        | —                                                             |

For a personal site you'll be far under these, but the guard means a runaway generator or a bulk import can't silently blow the ceiling.

## Notes

- **301 vs 302:** use `301` (permanent) for slugs that moved for good — this passes SEO signal. Use `302` (temporary) only when the move is provisional.
- Trailing slashes matter — this site's URLs end in `/`. Match the real path.
- **Validation:** an invalid `code`, or a row missing `source`/`destination`, fails the build with a line-numbered error (e.g. `blog.csv:2: invalid code "999"`). Fix the CSV and rebuild.
- Do not add redirects at the CDN/DNS layer (e.g. Terraform-managed zone rules) or edit the generated artifact directly — both are wrong paths for this. Author them as CSV here and let the build compile the artifact.
