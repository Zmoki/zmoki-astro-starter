// Cloudflare Turnstile provider config. A plain TS module (not the .astro
// component) so the CSP (src/headers/headers.config.ts) imports its hosts.

// Committed, not an env var.
export const TURNSTILE_SITE_KEY = "0x4AAAAAAB2gqKaM5dY-L2kN";

// CSP sources by directive: the widget script and its iframe. Empty when unset.
export const TURNSTILE_CSP: Record<string, string[]> = TURNSTILE_SITE_KEY
  ? {
      "script-src": ["https://challenges.cloudflare.com"],
      "frame-src": ["https://challenges.cloudflare.com"],
    }
  : {};
