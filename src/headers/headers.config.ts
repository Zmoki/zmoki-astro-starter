/**
 * HTTP response headers for every host. `npm run build:headers` (also run before
 * `npm run build`) compiles them for `site.platform.deploy`:
 *   "cloudflare" | "netlify" → public/_headers
 *   "vercel"                 → vercel.json (headers[] merged in)
 *   "amplify"                → customHeaders.json (paste into the Amplify console)
 *
 * Commit the generated file: CI's `check:headers` fails if it drifts from this one.
 * See src/headers/README.md.
 */

import { createHash } from "node:crypto";
import { inlineScripts } from "../lib/inline-scripts.ts";
import { POSTHOG_CSP } from "../components/analytics/posthog-config.ts";
import { GTM_CSP } from "../components/analytics/gtm-config.ts";
import { TURNSTILE_CSP } from "../components/captcha/turnstile-config.ts";

// ── Content-Security-Policy ───────────────────────────────────────────────────
// script-src has no 'unsafe-inline': bundled scripts are 'self', and the inline
// snippets in src/lib/inline-scripts.ts are allowed by hash.
//
// Provider hosts are imported, never copied here, so an unconfigured provider
// adds none. To add a provider, export a `<NAME>_CSP` record from its config
// module and add it to `providerSources`.

// Hash of each inline snippet, exactly as rendered (set:html emits it verbatim).
const inlineScriptHashes = inlineScripts.map(
  (snippet) => `'sha256-${createHash("sha256").update(snippet, "utf8").digest("base64")}'`,
);

const baseDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    ...inlineScriptHashes,
    "https://static.cloudflareinsights.com", // Cloudflare Web Analytics (injected by the host)
  ],
  "frame-src": [],
  "style-src": ["'self'", "'unsafe-inline'"],
  // No image origin: images on it are always optimized to same-origin /_astro files.
  "img-src": ["'self'", "data:"],
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
      // Set here so every host gets them. If your CDN also sets HSTS,
      // X-Content-Type-Options or Referrer-Policy, drop them there to avoid duplicates.
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY", // legacy; CSP frame-ancestors 'none' is the modern equivalent
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Content-Security-Policy": contentSecurityPolicy,
      "Permissions-Policy": permissionsPolicy,
    },
  },
];
