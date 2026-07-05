// Single source of truth for "what commit is this build" — read by the
// <meta name="version"> tag in BaseLayout/BrandLayout and by the health
// check (src/pages/-/astro/health.astro). Works in local dev, host builds
// (Cloudflare/Netlify/Vercel/Amplify all clone with .git present), and CI,
// since it shells out to git rather than relying on a platform-specific env var.
import { execSync } from "child_process";

export const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
