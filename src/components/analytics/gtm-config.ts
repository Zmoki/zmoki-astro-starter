// Google Tag Manager provider config. A plain TS module (not the .astro
// component) so the loader snippet (src/lib/inline-scripts.ts) and the CSP
// (src/headers/headers.config.ts) import the same values.

// Committed, not an env var. Empty by default (GTM is unused on this site).
export const GTM_CONTAINER_ID = "";

export const gtmConfigured = !!GTM_CONTAINER_ID;

// CSP sources by directive: the container script, plus the GA4 hits a typical
// container sends. Tags you add in GTM may need more. Empty when unconfigured.
export const GTM_CSP: Record<string, string[]> = gtmConfigured
  ? {
      "script-src": ["https://www.googletagmanager.com"],
      "img-src": ["https://www.googletagmanager.com", "https://www.google-analytics.com"],
      "connect-src": ["https://www.googletagmanager.com", "https://www.google-analytics.com"],
    }
  : {};
