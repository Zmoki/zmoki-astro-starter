/// <reference path="../.astro/types.d.ts" />

// Provider config (PostHog, GTM, Turnstile, Brevo, image origin) is committed
// constants in the relevant components, not env vars — see AGENTS.md →
// Analytics/Captcha/Forms. Analytics/captcha are the exception: both default
// OFF and only turn on when their env var is literally "true" (set it in your
// host's production env, in CI for the main branch, or locally to test).
interface ImportMetaEnv {
  /** Set to `"true"` to turn analytics on (default off). */
  readonly PUBLIC_ANALYTICS_ENABLED: string;
  /** Set to `"true"` to turn the form captcha on (default off). */
  readonly PUBLIC_CAPTCHA_ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /**
   * Vendor-neutral analytics facade. Each active provider (PostHog, GTM, …)
   * chains onto it, so one call fans out to all of them. Undefined when no
   * provider is configured — always call it optionally: `window.track?.(...)`.
   * See src/components/Analytics.astro.
   */
  track?: (event: string, props?: Record<string, unknown>) => void;
  posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
  dataLayer?: unknown[];
}
