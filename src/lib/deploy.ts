// Deploy-host facts shared by src/lib/urls.ts and the scripts in scripts/.
// No dependencies and relative imports only: plain `node` scripts load it and
// don't resolve the `@/` alias.

/** Supported hosts. The active one is `site.platform.deploy`. */
export type Platform = "cloudflare" | "netlify" | "vercel" | "amplify";

// Cloudflare Pages and Amplify have no "is production" flag, so any other branch
// marks a preview. Change this if production deploys from another branch.
const PRODUCTION_BRANCH = "main";

/** Preview host suffix per platform, to recognize a preview URL without the build's env vars (e.g. in CI). */
export const PREVIEW_HOST_SUFFIX: Record<Platform, string> = {
  cloudflare: ".pages.dev",
  netlify: ".netlify.app",
  vercel: ".vercel.app",
  amplify: ".amplifyapp.com",
};

/** Whether this is a host's preview build (a PR or non-production branch). Local and CI builds aren't. */
export function isPreviewBuild(platform: Platform): boolean {
  const env = process.env;
  switch (platform) {
    case "cloudflare":
      return !!env.CF_PAGES_BRANCH && env.CF_PAGES_BRANCH !== PRODUCTION_BRANCH;
    case "netlify":
      // CONTEXT is "production" | "deploy-preview" | "branch-deploy".
      return !!env.CONTEXT && env.CONTEXT !== "production";
    case "vercel":
      return env.VERCEL_ENV === "preview";
    case "amplify":
      return (
        !!env.AWS_PULL_REQUEST_ID || (!!env.AWS_BRANCH && env.AWS_BRANCH !== PRODUCTION_BRANCH)
      );
  }
}

/** Origin of the current preview deployment, or null on production or when the host exposes none. */
export function previewOrigin(platform: Platform): string | null {
  if (!isPreviewBuild(platform)) return null;
  const env = process.env;
  switch (platform) {
    case "cloudflare":
      return env.CF_PAGES_URL ?? null;
    case "netlify":
      return env.DEPLOY_PRIME_URL ?? null;
    case "vercel":
      // VERCEL_URL has no scheme.
      return env.VERCEL_URL ? `https://${env.VERCEL_URL}` : null;
    case "amplify":
      // Amplify exposes no preview URL; it follows from the app id and the PR or branch.
      if (!env.AWS_APP_ID) return null;
      return env.AWS_PULL_REQUEST_ID
        ? `https://pr-${env.AWS_PULL_REQUEST_ID}.${env.AWS_APP_ID}.amplifyapp.com`
        : `https://${env.AWS_BRANCH!.replaceAll("/", "-")}.${env.AWS_APP_ID}.amplifyapp.com`;
  }
}
