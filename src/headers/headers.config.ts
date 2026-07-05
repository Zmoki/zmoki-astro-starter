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

// PostHog host — the origin the PostHog snippet loads its script from (script-src)
// and sends events to (connect-src); a dedicated reverse-proxy subdomain here.
// Keep this in sync with `PUBLIC_POSTHOG_HOST` (src/env.d.ts): the env var drives
// the runtime snippet, this literal drives the committed CSP artifact — the
// drift-checked `public/_headers` can't read env, so it's duplicated.
const POSTHOG_HOST = "https://a.starter.zmoki.xyz";

// Captcha host — the origin the built-in captcha (Cloudflare Turnstile) loads its
// widget script (script-src) and iframe (frame-src) from, and which the form
// iframe is granted feature permissions for (Permissions-Policy below). Captcha
// is provider-agnostic (see src/components/Captcha.astro) — if you swap the
// provider, change this one constant to its host (e.g. https://www.google.com for
// reCAPTCHA, https://hcaptcha.com for hCaptcha).
const CAPTCHA_HOST = "https://challenges.cloudflare.com";

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
    CAPTCHA_HOST, // built-in captcha (Turnstile) widget script
    POSTHOG_HOST,
    "https://www.googletagmanager.com",
  ],
  "frame-src": [CAPTCHA_HOST], // captcha widget iframe
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
    POSTHOG_HOST,
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
  `picture-in-picture=(self "${CAPTCHA_HOST}")`,
  "publickey-credentials-get=()",
  "screen-wake-lock=()",
  "sync-xhr=()",
  "usb=()",
  "xr-spatial-tracking=()",
  `autoplay=(self "${CAPTCHA_HOST}")`,
  `cross-origin-isolated=(self "${CAPTCHA_HOST}")`,
  `fullscreen=(self "${CAPTCHA_HOST}")`,
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
