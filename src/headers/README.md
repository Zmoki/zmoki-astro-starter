# Response headers

All response headers are defined in [`headers.config.ts`](./headers.config.ts) as host-neutral rules, and `npm run build:headers` compiles them into the file your host reads (`site.platform.deploy`):

| Host                | Generated file              |
| ------------------- | --------------------------- |
| Cloudflare, Netlify | `public/_headers`           |
| Vercel              | `vercel.json` (`headers[]`) |
| AWS Amplify         | `customHeaders.json`        |

The generated file is committed; never edit it by hand. To change a header, edit `headers.config.ts`, run `npm run build:headers`, and commit both. `npm run build` regenerates it too, and CI's `check:headers` fails if the committed copy is stale.

Today's rules: `X-Robots-Tag: noindex` on `/-/astro/*` and `/thank-you/*`, and on every path the security set: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`.

The CSP is built from a directive → sources map. Providers add their hosts from their own config modules, and inline snippets are allowed by hash; see AGENTS.md → Scripts and the CSP. Add any other host to the matching directive's array.

If your CDN or DNS layer also sets security headers, remove them there so responses don't carry duplicates.
