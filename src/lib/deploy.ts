// Deploy-host facts shared by src/lib/urls.ts and the scripts in scripts/.
// No dependencies and relative imports only: plain `node` scripts load it and
// don't resolve the `@/` alias.

/** Supported hosts. The active one is `site.platform.deploy`. */
export type Platform = "cloudflare" | "netlify" | "vercel" | "amplify";

// Cloudflare Pages has no "is production" flag, so any other CF_PAGES_BRANCH
// marks a preview. Change this if production deploys from another branch.
const PRODUCTION_BRANCH = "main";

/** Preview host suffix per platform, to recognize a preview URL without the build's env vars (e.g. in CI). */
export const PREVIEW_HOST_SUFFIX: Record<Platform, string> = {
  cloudflare: ".pages.dev",
  netlify: ".netlify.app",
  vercel: ".vercel.app",
  amplify: ".amplifyapp.com",
};

/** Origin of the current preview deployment, or null on production or when the host exposes none. */
export function previewOrigin(platform: Platform): string | null {
  const env = process.env;
  switch (platform) {
    case "cloudflare":
      return env.CF_PAGES_URL && env.CF_PAGES_BRANCH && env.CF_PAGES_BRANCH !== PRODUCTION_BRANCH
        ? env.CF_PAGES_URL
        : null;
    case "netlify":
      // CONTEXT is "production" | "deploy-preview" | "branch-deploy".
      return env.CONTEXT && env.CONTEXT !== "production" ? (env.DEPLOY_PRIME_URL ?? null) : null;
    case "vercel":
      // VERCEL_URL has no scheme.
      return env.VERCEL_ENV === "preview" && env.VERCEL_URL ? `https://${env.VERCEL_URL}` : null;
    case "amplify":
      // Amplify has no standard preview-URL env var.
      return null;
  }
}
