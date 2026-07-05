// Shared deploy-host knowledge — the single source of truth for "where does
// this site deploy, and what does its preview deployment look like". Reused by
// src/lib/urls.ts (to point OG/asset URLs at the current preview) and by
// scripts/check-links.ts (to flag links that hard-code our own origin). Keep
// this dependency-free and relatively-imported so the plain `node` scripts can
// load it too (they don't resolve the `@/` tsconfig alias).

/**
 * The supported hosts (mirrors `scripts/generate-{redirects,headers}.ts`). The
 * active one is `site.platform.deploy`, which also drives the redirect/header
 * artifacts.
 */
export type DeployPlatform = "cloudflare" | "netlify" | "vercel" | "amplify";

/**
 * Cloudflare Pages' production branch. Pages' build env has no explicit
 * "is production" flag (unlike Netlify's CONTEXT / Vercel's VERCEL_ENV), so a
 * non-matching CF_PAGES_BRANCH is what marks a preview. Change if you deploy
 * production from a branch other than `main`.
 */
const PRODUCTION_BRANCH = "main";

/**
 * Preview-deployment host *suffix* per platform. Unlike `previewOrigin` (which
 * needs the current build's env vars), this lets an offline consumer recognize
 * a preview URL for this host family from the string alone — e.g. catching a
 * committed `*.pages.dev` link in CI on `main`, where no preview env is set.
 */
export const PREVIEW_HOST_SUFFIX: Record<DeployPlatform, string> = {
  cloudflare: ".pages.dev",
  netlify: ".netlify.app",
  vercel: ".vercel.app",
  amplify: ".amplifyapp.com",
};

/**
 * Build-time origin of the *current preview deployment* for the configured host,
 * or null when this build is production / not a preview / the host exposes no
 * preview URL. Each host is read through its own native build env vars.
 */
export function previewOrigin(platform: DeployPlatform): string | null {
  const env = process.env;
  switch (platform) {
    case "cloudflare":
      // Pages sets CF_PAGES_URL (this deploy's URL) + CF_PAGES_BRANCH.
      return env.CF_PAGES_URL && env.CF_PAGES_BRANCH && env.CF_PAGES_BRANCH !== PRODUCTION_BRANCH
        ? env.CF_PAGES_URL
        : null;
    case "netlify":
      // CONTEXT is "production" | "deploy-preview" | "branch-deploy";
      // DEPLOY_PRIME_URL is this deploy's permalink.
      return env.CONTEXT && env.CONTEXT !== "production" ? (env.DEPLOY_PRIME_URL ?? null) : null;
    case "vercel":
      // VERCEL_ENV is "production" | "preview" | "development"; VERCEL_URL has no scheme.
      return env.VERCEL_ENV === "preview" && env.VERCEL_URL ? `https://${env.VERCEL_URL}` : null;
    case "amplify":
      // Amplify exposes no standard single preview-URL env var — stay on production.
      return null;
  }
}

/**
 * True only on the host's own production build of `main` — false on previews,
 * local `astro dev`, and CI (GitHub Actions sets none of these vars). Unlike
 * `previewOrigin`, which defaults to "production" when it can't tell, this
 * requires positive evidence — used to gate side effects (analytics, captcha)
 * that must never fire outside a real deploy.
 */
export function isProductionDeploy(platform: DeployPlatform): boolean {
  const env = process.env;
  switch (platform) {
    case "cloudflare":
      return env.CF_PAGES_BRANCH === PRODUCTION_BRANCH;
    case "netlify":
      return env.CONTEXT === "production";
    case "vercel":
      return env.VERCEL_ENV === "production";
    case "amplify":
      return env.AWS_BRANCH === PRODUCTION_BRANCH;
  }
}
