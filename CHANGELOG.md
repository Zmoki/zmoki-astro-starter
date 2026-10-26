# Changelog

Notable changes to the starter. A copied site doesn't update itself: compare your `package.json` `version` with the sections below, and follow the PR links for the code.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions: [semver](https://semver.org/) as seen by a site built from the starter: **major** means you must change your own code or content, **minor** adds or improves something, **patch** fixes something.

## [Unreleased]

### Changed

- Docs and code comments pruned: `AGENTS.md` is a short map pointing to the skills, the skills are about a third shorter, and comments explain why instead of restating code. Stale statements fixed. ([#60](https://github.com/Zmoki/zmoki-astro-starter/pull/60))
- Dependencies updated: Astro 7.4, `@astrojs/mdx` 8, `markdown-it` 15. Remark/rehype plugins moved into `unified({...})`, as Astro 7.4 requires. ([#58](https://github.com/Zmoki/zmoki-astro-starter/pull/58))
- Node pinned in one place, `.node-version` (24.22.1); CI reads it too. GitHub Actions `setup-node` v7, `cache` v6. ([#58](https://github.com/Zmoki/zmoki-astro-starter/pull/58))

### Security

- The CSP no longer allows inline scripts. Scripts are bundled files; the GTM loader is allowed by hash; provider hosts come from each provider's config module. ([#57](https://github.com/Zmoki/zmoki-astro-starter/pull/57))
  **Breaking:** rewrite any `<script is:inline>` you added as a bundled `<script>`, and move GTM Custom HTML tags to built-in tags or templates.
- `npm audit`: 38 → 12 findings, no criticals. The rest come only through Lighthouse CI. ([#58](https://github.com/Zmoki/zmoki-astro-starter/pull/58))

## [1.0.0] - 2026-07-05

The starter as of [#35](https://github.com/Zmoki/zmoki-astro-starter/pull/35):

- Astro 7, Tailwind 4, MDX; site settings in `src/site.config.ts`.
- `blog`, `resources` (with email-gated downloads) and `legal` collections.
- SEO: canonicals, per-page robots, sitemap with images, RSS, JSON-LD, build-time OG cards.
- Redirects and headers compiled for Cloudflare Pages, Netlify, Vercel or AWS Amplify.
- Swappable analytics (PostHog, GTM), forms (Brevo) and captcha (Turnstile), off by default.
- Brand system: design tokens, self-hosted fonts, one brand mark, a brand guide at `/-/astro/brand/`.
- CI checks for format, types, lint, generated files, JSON-LD, links, sitemap and Lighthouse.
- Task playbooks for AI agents in `.claude/skills/`.

[Unreleased]: https://github.com/Zmoki/zmoki-astro-starter/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Zmoki/zmoki-astro-starter/releases/tag/v1.0.0
