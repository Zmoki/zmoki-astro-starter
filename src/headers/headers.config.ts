/**
 * Platform-neutral HTTP response headers — the single source of truth.
 *
 * Compiled by `scripts/generate-headers.ts` (`npm run build:headers`, also run
 * automatically before `npm run build`) into the artifact for the host set by
 * `site.deploy.platform` in `src/site.config.ts`:
 *   "cloudflare" | "netlify" → public/_headers
 *   "vercel"                 → vercel.json (headers[] merged in)
 *   "amplify"                → customHeaders.json (paste into the Amplify console / IaC)
 *
 * The generated artifact is committed; CI's `npm run check:headers` fails on drift.
 * Edit rules here, then run `npm run build:headers` and commit the result.
 * See `.claude/skills/redirects/SKILL.md` (headers section) and `src/headers/README.md`.
 */

// ── Content-Security-Policy ───────────────────────────────────────────────────
// Authored as directives → arrays of sources, joined into the header string
// below. Add a host by pushing it onto the relevant directive.
//
// Third-party hosts in use: Cloudflare (Web Analytics + Turnstile), Google Tag
// Manager / Analytics (for the GTM provider — drop if unused), Google Fonts.
//
// `https://starter.zmoki.xyz` is this site's own origin. It's listed for the
// PostHog analytics + image/media hosts assuming a same-origin reverse proxy
// (e.g. PostHog behind your own domain). It's redundant with `'self'` for
// same-origin requests, but kept explicit; if you proxy PostHog under a
// *dedicated subdomain* instead, replace it with that host in `script-src`,
// `connect-src`, `img-src`, and `media-src`.
const SITE_ORIGIN = "https://starter.zmoki.xyz";

const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "https://static.cloudflareinsights.com",
    "https://challenges.cloudflare.com",
    SITE_ORIGIN,
    "https://www.googletagmanager.com",
  ],
  "frame-src": ["https://challenges.cloudflare.com"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "img-src": [
    "'self'",
    "data:",
    SITE_ORIGIN,
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ],
  "media-src": ["'self'", SITE_ORIGIN],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": [
    "'self'",
    "https://cloudflareinsights.com",
    SITE_ORIGIN,
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
      // the template is A-grade on every platform, not just Cloudflare. NOTE: if
      // your Cloudflare zone (Terraform) also sets HSTS / X-Content-Type-Options /
      // Referrer-Policy, drop them there so responses don't carry duplicates.
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY", // legacy; CSP frame-ancestors 'none' is the modern equivalent
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Content-Security-Policy": contentSecurityPolicy,
      "Permissions-Policy": permissionsPolicy,
    },
  },
];
