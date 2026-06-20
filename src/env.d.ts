/// <reference path="../.astro/types.d.ts" />
interface ImportMetaEnv {
  readonly PUBLIC_POSTHOG_PROJECT_TOKEN: string;
  readonly PUBLIC_POSTHOG_HOST: string;
  readonly PUBLIC_ANALYTICS_ENABLED: string;
  readonly PUBLIC_BREVO_ACCOUNT_ID: string;
  readonly PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
