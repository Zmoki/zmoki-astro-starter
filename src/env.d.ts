/// <reference path="../.astro/types.d.ts" />

// Provider config (PostHog, GTM, Turnstile, Brevo, image origin) is committed
// constants in the relevant components, not env vars — see AGENTS.md →
// Analytics/Captcha/Forms. Analytics/captcha default to on only for the deploy
// host's real production build of `main` (src/lib/deploy.ts); the two env vars
// below are optional overrides of that default.
interface ImportMetaEnv {
  /** Overrides the automatic production-only default: `"true"` forces analytics on, `"false"` forces it off. */
  readonly PUBLIC_ANALYTICS_ENABLED: string;
  /** Overrides the automatic production-only default: `"true"` forces the form captcha on, `"false"` forces it off. */
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
