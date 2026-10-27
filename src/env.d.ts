/// <reference path="../.astro/types.d.ts" />

// The only env vars: other provider config is committed in its config module.
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
   * Vendor-neutral analytics facade; every active provider chains onto it. With
   * analytics off it logs to the console. Call it as `window.track?.(...)`.
   */
  track?: (event: string, props?: Record<string, unknown>) => void;
  /** Associates the visitor with an id. Call it as `window.identify?.(...)`. */
  identify?: (id: string, props?: Record<string, unknown>) => void;
  posthog?: {
    capture: (event: string, props?: Record<string, unknown>) => void;
    identify: (id: string, props?: Record<string, unknown>) => void;
  };
  dataLayer?: unknown[];
}
