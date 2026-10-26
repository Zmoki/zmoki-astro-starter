// PostHog provider config. A plain TS module (not the .astro component) so both
// the bundled provider script and the CSP (src/headers/headers.config.ts) import
// the same values — the host can't drift between the two.

// Committed, not an env var. PostHog stays off unless both are set.
export const POSTHOG_PROJECT_TOKEN = "phc_B5Nb3sdRsE7uugTkBUCYjfppXvKDMi8k6YtCPGyHvHeo";
export const POSTHOG_HOST = "https://a.starter.zmoki.xyz";

export const posthogConfigured = !!POSTHOG_PROJECT_TOKEN && !!POSTHOG_HOST;

// CSP sources by directive: the snippet loads its library from the host
// (script-src) and sends events to it (connect-src). Empty when unconfigured.
export const POSTHOG_CSP: Record<string, string[]> = posthogConfigured
  ? { "script-src": [POSTHOG_HOST], "connect-src": [POSTHOG_HOST] }
  : {};
