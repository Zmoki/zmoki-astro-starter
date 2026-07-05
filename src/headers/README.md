# Response headers

HTTP response headers, authored here as **platform-neutral rules** in
[`headers.config.ts`](./headers.config.ts) — the single source of truth. The
Content-Security-Policy is built from a directives-to-sources map, so adding an
allowlisted host is a one-line push onto the relevant array.

Current rules: `X-Robots-Tag: noindex` on the internal (`/-/astro/*`) and
thank-you paths; on `/*` the standard security set — `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`,
`Content-Security-Policy`, and `Permissions-Policy`.

To add or change a header: edit `headers.config.ts`, run `npm run build:headers`,
and commit both the config and the regenerated artifact.

The compiled artifact depends on `site.platform.deploy` (`public/_headers` for
Cloudflare/Netlify, `vercel.json` `headers[]` for Vercel, `customHeaders.json` for
Amplify) — **never edit it by hand.** It's committed, and CI's
`npm run check:headers` fails on drift.

> If your CDN/DNS layer (e.g. a Cloudflare zone managed in Terraform) also sets
> some of these security headers, remove them there so responses don't carry
> duplicates — let this config be the single source.

The model mirrors redirects exactly (neutral source → per-platform artifact →
committed + CI drift check). Full platform table: **Deploy & infrastructure** in
[`AGENTS.md`](../../AGENTS.md).
