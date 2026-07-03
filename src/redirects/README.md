# Redirects

URL redirects, authored here as **platform-neutral CSV** — one file per group (`blog.csv`, `other.csv`, …), merged in filename order. Add more `*.csv` files freely; they're picked up automatically.

```csv
source,destination,code
/feed/old-slug/,/blog/1-new-slug/,301
/legacy/,/blog/,
```

`source` and `destination` are required; `code` is optional (defaults to `301`). `#` lines and blanks are ignored.

To add or change a redirect: edit the relevant CSV, run `npm run build:redirects`, and commit both the CSV and the regenerated artifact.

**Full docs — CSV format, per-platform output, and the commit/CI workflow — live in the `/redirects` skill: [`.claude/skills/redirects/SKILL.md`](../../.claude/skills/redirects/SKILL.md).** Don't edit the generated artifact by hand.
