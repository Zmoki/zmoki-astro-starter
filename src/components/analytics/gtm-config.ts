// Google Tag Manager config. A plain TS module so the loader snippet
// (src/lib/inline-scripts.ts) and the CSP (src/headers/headers.config.ts) read
// the same values.

// Set to your GTM-XXXXXXX id to turn GTM on.
export const GTM_CONTAINER_ID = "";

export const gtmConfigured = !!GTM_CONTAINER_ID;

// The container script plus the GA4 hits a typical container sends. Tags you
// add in GTM may need more hosts.
export const GTM_CSP: Record<string, string[]> = gtmConfigured
  ? {
      "script-src": ["https://www.googletagmanager.com"],
      "img-src": ["https://www.googletagmanager.com", "https://www.google-analytics.com"],
      "connect-src": ["https://www.googletagmanager.com", "https://www.google-analytics.com"],
    }
  : {};
