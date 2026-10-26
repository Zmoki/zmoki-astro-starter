// Cloudflare Turnstile config. A plain TS module so the CSP
// (src/headers/headers.config.ts) can import its hosts.

export const TURNSTILE_SITE_KEY = "0x4AAAAAAB2gqKaM5dY-L2kN";

// CSP hosts for the widget script and its iframe.
export const TURNSTILE_CSP: Record<string, string[]> = TURNSTILE_SITE_KEY
  ? {
      "script-src": ["https://challenges.cloudflare.com"],
      "frame-src": ["https://challenges.cloudflare.com"],
    }
  : {};
