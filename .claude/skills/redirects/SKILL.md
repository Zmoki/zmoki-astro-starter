---
description: Add or edit URL redirects. Use when the user wants to redirect a legacy/old URL, moved page, or external link — anything that should return a 301/302 on the site's host (Cloudflare, Netlify, Vercel, or Amplify).
---

# Redirects

Redirects are written once as platform-neutral CSV and compiled into the host's format.

- **Source**: `src/redirects/*.csv`, one file per group (`blog.csv`, `other.csv`, …). Add files freely; they merge in filename order.
- **Builder**: `scripts/generate-redirects.ts`, run by `npm run build:redirects` and automatically before `npm run build` (`prebuild`).
- **Output**: chosen by `platform.deploy` in `src/site.config.ts`. Generated; never edit it by hand.

| `platform`               | Generated artifact  | Format                                                      |
| ------------------------ | ------------------- | ----------------------------------------------------------- |
| `"cloudflare"` (default) | `public/_redirects` | `/old /new 301`                                             |
| `"netlify"`              | `public/_redirects` | same `_redirects` format                                    |
| `"vercel"`               | `vercel.json`       | `redirects[]` merged in (`{source,destination,statusCode}`) |
| `"amplify"`              | `redirects.json`    | `[{source,target,status}]`; paste into console / IaC        |

- Vercel accepts 3xx only. A `200` row is skipped with a warning; configure rewrites separately on Vercel.
- After switching platforms, the build warns about the previous platform's artifact. Delete it.

## CSV format

Columns `source,destination,code`, one redirect per row:

```csv
source,destination,code
/feed/old-slug/,/blog/1-new-slug/,301
/resources/something/,https://external.example.com/,302
/legacy/,/blog/,
```

- `source`: the incoming path. Required.
- `destination`: a site path or a full external URL. Required.
- `code`: optional, default `301`. Allowed: `200`, `301`, `302`, `303`, `307`, `308`.
- Lines starting with `#` and blank lines are ignored.

Blog-post moves go in `blog.csv`; resources, external links and one-offs in `other.csv`. Or create a new group file.

## Add a redirect

1. Edit or add a CSV under `src/redirects/`.
2. Run `npm run build:redirects`.
3. Commit the CSV and the regenerated artifact together.

The artifact is committed so redirect changes show in PR diffs (and Vercel reads `vercel.json` from the repo). CI's `npm run check:redirects` regenerates it and fails if it differs from what's committed.

Use `301` for permanent moves (passes SEO signal) and `302` only for provisional ones. URLs on this site end in `/`; match the real path.

Don't add redirects at the CDN/DNS layer (e.g. Terraform-managed zone rules) or in the generated artifact. Author them here.

## Validation and limits

An invalid `code` or a row missing `source`/`destination` fails the build with a line-numbered error (e.g. `blog.csv:2: invalid code "999"`).

The build warns at 90% of the host's redirect cap and fails once it's exceeded:

| `platform`   | Cap                                    | Beyond the cap                                                      |
| ------------ | -------------------------------------- | ------------------------------------------------------------------- |
| `cloudflare` | 2,100 (2,000 static + 100 dynamic)     | Cloudflare Bulk Redirects (rules past the cap are dropped silently) |
| `vercel`     | 1,024 (shared with rewrites + headers) | Edge Middleware + Edge Config                                       |
| `netlify`    | no hard count (file-size bound)        | wildcards/placeholders; Edge Functions past ~10k                    |
| `amplify`    | no documented quota                    | —                                                                   |
