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

import { createHash } from "node:crypto";
import { site } from "../site.config.ts";
import { inlineScripts } from "../lib/inline-scripts.ts";
import { POSTHOG_CSP } from "../components/analytics/posthog-config.ts";
import { GTM_CSP } from "../components/analytics/gtm-config.ts";
import { TURNSTILE_CSP } from "../components/captcha/turnstile-config.ts";

// ── Content-Security-Policy ───────────────────────────────────────────────────
// Directives → arrays of sources, joined into the header string below.
//
// script-src has no 'unsafe-inline': bundled scripts are same-origin files
// ('self'), and the few inline snippets in src/lib/inline-scripts.ts are
// allowed by hash. JSON-LD blocks are data, not scripts, so CSP ignores them.
//
// Provider hosts are imported from each provider's config module, never copied
// here: a provider contributes its hosts only while it's configured, so
// dropping a vendor drops its hosts. To add one, export a `<NAME>_CSP` record
// from its config module and add it to `providerSources` below.

// Hash of each inline snippet, exactly as rendered (set:html emits it verbatim).
const inlineScriptHashes = inlineScripts.map(
  (snippet) => `'sha256-${createHash("sha256").update(snippet, "utf8").digest("base64")}'`,
);

// Remote image origin (fallback for images that render unoptimized — optimized
// ones are served same-origin from /_astro). Sourced from `site.platform.imagesCDNHost`,
// the same value the build uses, so the CSP can't drift. Empty ⇒ not added.
const IMAGE_CDN_HOST = (site.platform.imagesCDNHost || "").trim().replace(/\/+$/, "");

const baseDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    ...inlineScriptHashes,
    "https://static.cloudflareinsights.com", // Cloudflare Web Analytics (injected by the host)
  ],
  "frame-src": [],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": [
    "'self'",
    "data:",
    // remote image origin (fallback for images that render unoptimized); omitted when unset
    ...(IMAGE_CDN_HOST ? [IMAGE_CDN_HOST] : []),
  ],
  "media-src": ["'self'"],
  "font-src": ["'self'"],
  "manifest-src": ["'self'"],
  "connect-src": ["'self'", "https://cloudflareinsights.com"],
  "object-src": ["'none'"],
  "frame-ancestors": ["'none'"],
};

// Each provider's sources, by directive. Empty records for unconfigured ones.
const providerSources: Record<string, string[]>[] = [POSTHOG_CSP, GTM_CSP, TURNSTILE_CSP];

const cspDirectives: Record<string, string[]> = Object.fromEntries(
  Object.entries(baseDirectives).map(([directive, sources]) => [
    directive,
    [...new Set([...sources, ...providerSources.flatMap((p) => p[directive] ?? [])])],
  ]),
);
for (const provider of providerSources) {
  for (const directive of Object.keys(provider)) {
    if (!(directive in baseDirectives)) {
      throw new Error(`Provider CSP uses "${directive}", which baseDirectives doesn't declare`);
    }
  }
}

const contentSecurityPolicy =
  Object.entries(cspDirectives)
    .filter(([, sources]) => sources.length > 0)
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
