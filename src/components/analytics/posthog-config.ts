// PostHog config. A plain TS module so the provider script and the CSP
// (src/headers/headers.config.ts) read the same host.

export const POSTHOG_PROJECT_TOKEN = "phc_B5Nb3sdRsE7uugTkBUCYjfppXvKDMi8k6YtCPGyHvHeo";
export const POSTHOG_HOST = "https://a.starter.zmoki.xyz";

export const posthogConfigured = !!POSTHOG_PROJECT_TOKEN && !!POSTHOG_HOST;

// The library loads from the host (script-src) and events go to it (connect-src).
export const POSTHOG_CSP: Record<string, string[]> = posthogConfigured
  ? { "script-src": [POSTHOG_HOST], "connect-src": [POSTHOG_HOST] }
  : {};
