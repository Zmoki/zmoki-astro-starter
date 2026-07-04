/// <reference path="../.astro/types.d.ts" />
interface ImportMetaEnv {
  readonly PUBLIC_POSTHOG_PROJECT_TOKEN: string;
  readonly PUBLIC_POSTHOG_HOST: string;
  readonly PUBLIC_GTM_CONTAINER_ID: string;
  readonly PUBLIC_ANALYTICS_ENABLED: string;
  readonly PUBLIC_BREVO_ACCOUNT_ID: string;
  readonly PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: string;
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
