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
