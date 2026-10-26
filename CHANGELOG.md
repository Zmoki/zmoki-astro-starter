# Changelog

Notable changes to the starter, for sites built from it. A site copied from the starter doesn't update itself, so each entry says what changed, why, and how to bring it into your copy.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/) as seen by a site built from the starter: a **major** version means you have to change your own code or content to adopt it, a **minor** adds or improves something you can port as-is, and a **patch** is a fix. Your copy's `package.json` `version` is the starter release it began from; compare it with the sections below to see what you're missing.

Every PR that changes the starter adds its entry under **Unreleased**, in the same PR.

## [Unreleased]

### Changed

- **Dependencies updated.** Astro 7.0 → 7.4, `@astrojs/mdx` 7 → 8, `markdown-it` 14 → 15, and every other package to the newest version its range allows. ([#58](https://github.com/Zmoki/zmoki-astro-starter/pull/58))
  - MDX 8 hands `.mdx` files to the configured Markdown processor. With `unified()` that needs `@astrojs/markdown-remark` 7.3 or later.
  - The remark/rehype plugins moved from `markdown.remarkPlugins` / `rehypePlugins` / `remarkRehype` into `unified({...})`, which Astro 7.4 requires (the old keys are deprecated).
  - `markdown-it` 15 ships its own types, so `@types/markdown-it` is gone. It also stopped linking scheme-less URLs (`www.example.com`) by default; the RSS feed turns that back on with `parser.linkify.set({ fuzzyLink: true })`.
  - `astro dev` and `astro preview` now run as background daemons: stop them with `astro dev stop` / `astro preview stop`. If the port is taken they pick another one, so read the printed URL.

  **To adopt:** copy the `dependencies`, `devDependencies` and `overrides` from `package.json`, run `npm install`, then apply the `markdown` block from `astro.config.mjs` and the `fuzzyLink` line from `src/pages/rss.xml.ts`. Check that a rendered post still has its code-block Copy buttons.

- **Node is pinned in one place, `.node-version` (now 24.22.1, a security release).** CI reads it via `node-version-file`, so CI builds with the same Node as Cloudflare Pages and Netlify. `engines.node` stays the minimum (`>=24`). GitHub Actions `setup-node` → v7 and `cache` → v6. ([#58](https://github.com/Zmoki/zmoki-astro-starter/pull/58))

  **To adopt:** update `.node-version`, and in both workflows replace `node-version: "24"` with `node-version-file: .node-version` and bump the two actions. On AWS Amplify, which reads neither file, set the Node version in the app's build settings.

### Security

- **The CSP no longer allows inline scripts.** `script-src` drops `'unsafe-inline'`, so an injected inline script doesn't run. ([#57](https://github.com/Zmoki/zmoki-astro-starter/pull/57), closes [#36](https://github.com/Zmoki/zmoki-astro-starter/issues/36))
  - Every script is now a bundled `<script>` served from `/_astro`, and `vite.build.assetsInlineLimit: 0` keeps Astro from inlining small ones. Build-time values reach scripts through `data-*` attributes or imports instead of `define:vars`. `post_viewed` now fires from `PostLayout`, which takes a `slug` prop.
  - Snippets that must run before first paint live in `src/lib/inline-scripts.ts`, and the CSP allows them by hash. Today that's only the GTM loader.
  - Provider hosts reach the CSP by import from each provider's config module (`analytics/posthog-config.ts`, `analytics/gtm-config.ts`, `captcha/turnstile-config.ts`) instead of being copied into `headers.config.ts`. A provider adds its hosts only while it's configured, so an unused GTM no longer puts Google hosts in the policy.

  **To adopt (breaking if you wrote your own inline scripts):**
  1. Copy `src/lib/inline-scripts.ts`, the three `*-config.ts` modules and `src/headers/headers.config.ts`; move your own provider constants into the config modules.
  2. Copy the updated components, layouts and pages: `Analytics`, `Captcha`, `Prose`, `analytics/*`, `captcha/turnstile`, `forms/brevo`, `BaseLayout`, `PostLayout`, `blog/[...slug]` and `thank-you/[...slug]`. Then add `build: { assetsInlineLimit: 0 }` under `vite` in `astro.config.mjs`.
  3. Rewrite any `<script is:inline>` of your own as a bundled `<script>` (see "Scripts & the CSP" in `AGENTS.md`). JSON-LD blocks and external vendor loaders can stay as they are.
  4. Run `npm run build:headers` and commit the regenerated artifact. If you use GTM, Custom HTML tags won't run under the new policy; switch them to built-in tags or custom templates.

- `npm audit` goes from 38 findings to 12, clearing the critical ones in `astro`, `dompurify` and `proxy-addr`. A scoped override moves `postcss-selector-parser` under `@tailwindcss/typography` to a fixed release. The 12 left all come only through Lighthouse CI (`@lhci/cli`, already at its latest version), so none of them reach visitors. ([#58](https://github.com/Zmoki/zmoki-astro-starter/pull/58))

## [1.0.0] - 2026-07-05

The baseline: the starter as of [#35](https://github.com/Zmoki/zmoki-astro-starter/pull/35). If your copy predates this changelog, it is somewhere on the way to this version.

### Added

- **Site shell.** Astro 7 with MDX, Tailwind 4 and TypeScript. Everything site-specific lives in `src/site.config.ts`; `SETUP.md` is the checklist for turning the starter into your own site.
- **Content.** `blog`, `resources` and `legal` collections on the Content Layer API. Posts carry their own author, an optional cover photo and a canonical override for cross-posts. Resources can gate a download behind an email form, with a thank-you page that also offers the file directly.
- **SEO.** Canonical URLs, Open Graph and Twitter meta from one URL helper; per-entry `robots` directives; a sitemap built from a registry of page collections, with image entries for post covers; an RSS feed; schema.org JSON-LD (`BlogPosting`, `ImageObject`) through a `JsonLd` component.
- **OG images.** Brand-aware 1200×630 cards rendered at build time with Satori, one per page, plus a brand guide page for them.
- **Images.** Build-time optimization of committed or remote originals (`site.platform.imagesCDNHost`), responsive by default.
- **Hosting.** Redirects (CSV) and response headers (including a CSP and the standard security set) authored once and compiled for Cloudflare Pages, Netlify, Vercel or AWS Amplify from `site.platform.deploy`.
- **Swappable vendors.** Provider-agnostic analytics (PostHog and Google Tag Manager, through one `window.track` facade), forms (Brevo) and captcha (Cloudflare Turnstile). All off by default and configured with committed constants, not env vars.
- **Brand system.** Color tokens in `src/design-tokens.mjs`, self-hosted fonts through the Astro Fonts API, a favicon set and OG mark from one `public/brand-mark.svg`, and internal brand pages under `/-/astro/brand/`.
- **CI guards.** Format, type check, lint, redirect and header drift, structured data, internal links and sitemap coverage, plus Lighthouse CI with a public report link.
- **AI-agent skills.** Tool-agnostic playbooks in `.claude/skills/` (`/run`, `/brand`, `/redirects`, `/og-images`, `/update-deps`, `/analytics`, `/structured-data`, `/images`), with `AGENTS.md` as the technical spec.

[Unreleased]: https://github.com/Zmoki/zmoki-astro-starter/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Zmoki/zmoki-astro-starter/releases/tag/v1.0.0
