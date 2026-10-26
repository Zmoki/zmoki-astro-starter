# Redirects

Redirects are written here as host-neutral CSV, one file per group (`blog.csv`, `other.csv`, …), merged in filename order. New `*.csv` files are picked up automatically.

```csv
source,destination,code
/feed/old-slug/,/blog/1-new-slug/,301
/legacy/,/blog/,
```

`source` and `destination` are required; `code` is optional (defaults to `301`). `#` lines and blanks are ignored.

To add or change a redirect, edit the CSV, run `npm run build:redirects`, and commit the CSV and the regenerated file (never edit that file by hand). Everything else, including which file each host gets, is in the [`/redirects` skill](../../.claude/skills/redirects/SKILL.md).
