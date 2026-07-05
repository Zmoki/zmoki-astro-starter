/// <reference path="../.astro/types.d.ts" />

// Source of truth for the site's PUBLIC_* env vars: declare each here (with a
// doc comment) first, then mirror the key into .env.example. All are optional —
// an unconfigured provider simply stays off.
interface ImportMetaEnv {
  /** PostHog project token. Set together with PUBLIC_POSTHOG_HOST to load PostHog. */
  readonly PUBLIC_POSTHOG_PROJECT_TOKEN: string;
  /** PostHog host URL. Set together with PUBLIC_POSTHOG_PROJECT_TOKEN to load PostHog. */
  readonly PUBLIC_POSTHOG_HOST: string;
  /** Google Tag Manager container ID (e.g. `GTM-XXXXXXX`). Loads GTM when set. */
  readonly PUBLIC_GTM_CONTAINER_ID: string;
  /** Global analytics kill switch: set to `"false"` to disable every provider. */
  readonly PUBLIC_ANALYTICS_ENABLED: string;
  /** Brevo account ID, for the email signup forms. */
  readonly PUBLIC_BREVO_ACCOUNT_ID: string;
  /**
   * Cloudflare Turnstile site key — the built-in captcha provider for forms.
   * Captcha is provider-agnostic (see src/components/Captcha.astro); set this to
   * enable Turnstile, or add another provider's key to swap it.
   */
  readonly PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: string;
  /** Global captcha kill switch: set to `"false"` to disable the form captcha. */
  readonly PUBLIC_CAPTCHA_ENABLED: string;
  /**
   * Base URL of the remote image origin for content images, e.g.
   * "https://images.zmoki.xyz" (an R2 bucket on a custom domain). Content images
   * are OPTIMIZED AT BUILD by Astro and served by the deploy host — the origin is
   * pure storage, DECOUPLED from where the site deploys. Setting this authorizes
   * the domain for build-time optimization (astro.config.mjs `image.remotePatterns`)
   * and lets content reference images by bare key. Unset ⇒ commit images to
   * src/images and import them. See src/image.config.ts.
   */
  readonly PUBLIC_IMAGE_CDN_HOST: string;
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
