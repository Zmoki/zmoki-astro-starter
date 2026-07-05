/**
 * Platform-neutral HTTP response headers — the single source of truth.
 *
 * Compiled by `scripts/generate-headers.ts` (`npm run build:headers`, also run
 * automatically before `npm run build`) into the artifact for the host set by
 * `site.platform.deploy` in `src/site.config.ts`:
 *   "cloudflare" | "netlify" → public/_headers
 *   "vercel"                 → vercel.json (headers[] merged in)
 *   "amplify"                → customHeaders.json (paste into the Amplify console / IaC)
 *
 * The generated artifact is committed; CI's `npm run check:headers` fails on drift.
 * Edit rules here, then run `npm run build:headers` and commit the result.
 * See `.claude/skills/redirects/SKILL.md` (headers section) and `src/headers/README.md`.
 */

import { site } from "../site.config.ts";

// ── Content-Security-Policy ───────────────────────────────────────────────────
// Directives → arrays of sources, joined into the header string below. Add a
// host by pushing it onto the relevant directive.
//
// Third-party hosts in use: Cloudflare (Web Analytics + Turnstile), Google Tag
// Manager / Analytics (GTM provider — drop if unused), Google Fonts.

// PostHog host (https://a.starter.zmoki.xyz), a reverse-proxy subdomain: keep
// in sync with the POSTHOG_HOST constant in src/components/analytics/posthog.astro.
// Duplicated as a literal because this file compiles into the committed,
// drift-checked public/_headers artifact, which can't import an .astro export.

// Captcha host (https://challenges.cloudflare.com): swap to your provider's
// host if you change captcha (src/components/Captcha.astro), e.g.
// https://www.google.com for reCAPTCHA, https://hcaptcha.com for hCaptcha.

// Remote image origin (fallback for images that render unoptimized — optimized
// ones are served same-origin from /_astro). Sourced from `site.platform.imagesCDNHost`,
// the same value the build uses, so the CSP can't drift. Empty ⇒ not added.
const IMAGE_CDN_HOST = (site.platform.imagesCDNHost || "").trim().replace(/\/+$/, "");

const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "https://static.cloudflareinsights.com",
    "https://challenges.cloudflare.com", // built-in captcha (Turnstile) widget script
    "https://a.starter.zmoki.xyz", // PostHog
    "https://www.googletagmanager.com",
  ],
  "frame-src": ["https://challenges.cloudflare.com"], // captcha widget iframe
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": [
    "'self'",
    "data:",
    // remote image origin (fallback for images that render unoptimized); omitted when unset
    ...(IMAGE_CDN_HOST ? [IMAGE_CDN_HOST] : []),
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ],
  "media-src": ["'self'"],
  "font-src": ["'self'"],
  "manifest-src": ["'self'"],
  "connect-src": [
    "'self'",
    "https://cloudflareinsights.com",
    "https://a.starter.zmoki.xyz", // PostHog
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ],
  "object-src": ["'none'"],
  "frame-ancestors": ["'none'"],
};

const contentSecurityPolicy =
  Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ") + ";";

// ── Permissions-Policy ────────────────────────────────────────────────────────
const permissionsPolicy = [
  "accelerometer=()",
  "camera=()",
  "display-capture=()",
  "encrypted-media=()",
  "geolocation=()",
  "gyroscope=()",
  "keyboard-map=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  'picture-in-picture=(self "https://challenges.cloudflare.com")',
  "publickey-credentials-get=()",
  "screen-wake-lock=()",
  "sync-xhr=()",
  "usb=()",
  "xr-spatial-tracking=()",
  'autoplay=(self "https://challenges.cloudflare.com")',
  'cross-origin-isolated=(self "https://challenges.cloudflare.com")',
  'fullscreen=(self "https://challenges.cloudflare.com")',
].join(", ");

export interface HeaderRule {
  /** Path pattern the headers apply to (host glob syntax, e.g. `/*`, `/-/astro/*`). */
  source: string;
  /** Header name → value. */
  headers: Record<string, string>;
}

/** Header rules, applied in order. Later rules do not override earlier ones on
 *  Cloudflare/Netlify (all matching blocks apply), so keep names unique per path. */
export const headerRules: HeaderRule[] = [
  {
    source: "/thank-you/*",
    headers: { "X-Robots-Tag": "noindex" },
  },
  {
    source: "/-/astro/*",
    headers: { "X-Robots-Tag": "noindex" },
  },
  {
    source: "/*",
    headers: {
      // Standard security headers — kept here (not only at the CDN/zone level) so
      // the template is A-grade on every host. NOTE: if your CDN or DNS layer
      // (e.g. a Cloudflare zone managed in Terraform) also sets HSTS /
      // X-Content-Type-Options / Referrer-Policy, drop them there so responses
      // don't carry duplicates.
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY", // legacy; CSP frame-ancestors 'none' is the modern equivalent
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Content-Security-Policy": contentSecurityPolicy,
      "Permissions-Policy": permissionsPolicy,
    },
  },
];
