---
description: Add, enable, or swap analytics providers, or add a tracked event. Use when the user wants to turn on PostHog or Google Tag Manager, plug in another analytics tool (Plausible, Fathom, GA4, Umami, …), disable analytics, or track a new event.
---

# Analytics

Analytics is provider-agnostic and can run several providers at once. Call sites never name a vendor: they call `window.track?.(event, props)` and `window.identify?.(id, props)`. Each active provider wraps the previous `window.track`, so one call reaches every provider. Script and CSP rules: `AGENTS.md` → Scripts and the CSP.

The pieces:

- `src/components/analytics/<p>-config.ts`: the provider's committed constants (public values, not env vars), a `<p>Configured` flag, and a `<P>_CSP` record of the hosts it needs per CSP directive.
- `src/components/analytics/<p>.astro`: loads the vendor and chains onto `window.track` from a bundled `<script>`.
- `src/components/Analytics.astro`: the dispatcher. Renders each provider whose flag is set, and only when `PUBLIC_ANALYTICS_ENABLED === "true"`. That switch is off by default; it is set in the host's production env and in CI for pushes to `main`.

Built in: PostHog (`posthog-config.ts`) and Google Tag Manager (`gtm-config.ts`, empty by default).

## Pick the task

Ask the user only if it's unclear:

- **A. Enable a built-in provider** → Step 1.
- **B. Add a new provider** → Step 2.
- **C. Add a tracked event** → Step 3.
- **D. Disable analytics** → Step 4.

## Step 1 — Enable a built-in provider

Set the committed constant:

- **PostHog**: `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` in `src/components/analytics/posthog-config.ts`. Both are required.
- **GTM**: `GTM_CONTAINER_ID` (e.g. `GTM-XXXXXXX`) in `src/components/analytics/gtm-config.ts`. Set up the actual tags (GA4, Ads, …) in the GTM UI, using a **Custom Event** trigger on the event name.

Both can be on at once. Then run `npm run build:headers` and commit `public/_headers`. Each provider adds its hosts to the CSP only while it's configured, and a changed `GTM_CONTAINER_ID` also changes the hash of GTM's inline loader. CI's `check:headers` fails if you skip this.

Analytics still stays off until `PUBLIC_ANALYTICS_ENABLED=true`. To test locally, prefix the dev or build command with it.

## Step 2 — Add a new provider

Let `<p>` be the provider slug (e.g. `plausible`).

1. **Config module**: create `src/components/analytics/<p>-config.ts`. `headers.config.ts` runs under plain node and imports it, so use relative `.ts` imports only, no `@/` alias.

   ```ts
   export const PLAUSIBLE_DOMAIN = "";

   export const plausibleConfigured = !!PLAUSIBLE_DOMAIN;

   export const PLAUSIBLE_CSP: Record<string, string[]> = plausibleConfigured
     ? { "script-src": ["https://plausible.io"], "connect-src": ["https://plausible.io"] }
     : {};
   ```

2. **Component**: create `src/components/analytics/<p>.astro`. Load the vendor, then chain onto `window.track` from a bundled `<script>`:

   ```astro
   ---
   import { PLAUSIBLE_DOMAIN } from "@/components/analytics/plausible-config";
   ---

   <script
     is:inline
     defer
     data-domain={PLAUSIBLE_DOMAIN}
     src="https://plausible.io/js/script.manual.js"></script>
   <script>
     window.track = ((prev) => (event: string, props?: Record<string, unknown>) => {
       prev?.(event, props);
       window.plausible?.(event, { props });
     })(window.track);
   </script>
   ```

   - The external loader may keep `is:inline` (it's a file on an allowlisted host). The facade must be a bundled script: no raw inline script, no `define:vars`. If it needs config, `import` it from the config module.
   - Calling `prev` is what lets providers coexist. Don't drop it.
   - Keep scripts top-level. A script inside a `{ }` expression breaks Prettier's Astro parser.
   - A pasted vendor snippet can start with `/* eslint-disable */` and `// @ts-nocheck` (see `posthog.astro`).

   Facade mappings (props are best-effort; some vendors ignore them):

   | Provider   | `track(event, props)` →               |
   | ---------- | ------------------------------------- |
   | GA4 (gtag) | `gtag('event', event, props)`         |
   | Plausible  | `plausible(event, { props })`         |
   | Fathom     | `fathom.trackEvent(event)` (no props) |
   | Umami      | `umami.track(event, props)`           |

3. **Dispatcher**: in `src/components/Analytics.astro`, import the component and flag and render it:

   ```js
   import Plausible from "@/components/analytics/plausible.astro";
   import { plausibleConfigured } from "@/components/analytics/plausible-config";
   ```

   ```astro
   {analyticsEnabled && plausibleConfigured && <Plausible />}
   ```

4. **Window globals**: if the vendor exposes a new global, add it to the `Window` interface in `src/env.d.ts` (like `posthog` / `dataLayer`).

5. **CSP**: add `PLAUSIBLE_CSP` to `providerSources` in `src/headers/headers.config.ts` (never edit the generated `public/_headers`). Run `npm run build:headers` and commit the artifact. A directive missing from `baseDirectives` fails the build; add it there first.

## Step 3 — Add a tracked event

Fire it from a bundled `<script>` through the facade. Never name a vendor:

```js
window.track?.("event_name", { some_prop: value });
```

Copy an existing call site, e.g. `contact_email_clicked` in `src/layouts/BaseLayout.astro` or `code_block_copied` in `src/components/Prose.astro`. Use `snake_case` names. Add a row to the catalog below. To tie the visitor to an id (e.g. after a form submit), call `window.identify?.(id)`.

## Tracked events (catalog)

| Event                         | Where fired                 | Properties                      |
| ----------------------------- | --------------------------- | ------------------------------- |
| `contact_email_clicked`       | `BaseLayout.astro`          | `email`                         |
| `post_viewed`                 | `PostLayout.astro`          | `post_slug`, `post_title`       |
| `post_navigation_clicked`     | `PostLayout.astro`          | `direction`, `destination_slug` |
| `code_block_copied`           | `Prose.astro`               | `snippet_length`                |
| `resource_gate_viewed`        | `forms/brevo.astro`         | `resource_slug`, `form_id`      |
| `resource_gate_submitted`     | `forms/brevo.astro`         | `form_id`, `resource_slug`      |
| `resource_download_confirmed` | `thank-you/[...slug].astro` | `resource_name`, `resource_url` |
| `resource_downloaded`         | `thank-you/[...slug].astro` | `resource_name`, `asset_url`    |

`resource_gate_submitted` is preceded by `identify(email)`.

Lead-magnet funnel: `resource_gate_viewed` → `resource_gate_submitted` → `resource_download_confirmed` (reached the thank-you page) → `resource_downloaded` (clicked the direct download).

## Step 4 — Disable analytics

- **Dev, PRs, previews**: already off. Nothing to do.
- **Production**: unset `PUBLIC_ANALYTICS_ENABLED` in the host's env config.
- **One provider**: blank its constant(s) (`GTM_CONTAINER_ID = ""`, or both PostHog constants). It then emits nothing. Run `npm run build:headers` so its hosts leave the CSP, and commit the artifact.

## Step 5 — Verify

```bash
npm run format
npm run check
npm run lint
npm run build
```

A plain build has analytics off. Force it on and check the output:

```bash
PUBLIC_ANALYTICS_ENABLED=true npm run build >/dev/null 2>&1
grep -l "posthog.init\|gtm.js?id=" dist/index.html dist/_astro/*.js   # each active provider present
grep -c 'type="module" src="/_astro/' dist/index.html                  # scripts load as files
```

Then check:

- **Default off**: a plain `npm run build` has no `posthog` script and no `gtm.js?id=` in `dist/index.html`, whatever the constants say. Lighthouse relies on this.
- **CSP**: the dev server and `astro preview` don't send it. Serve `dist/` with the headers from `public/_headers` and load a few pages with DevTools open. A `Refused to load` for a vendor host means its `<P>_CSP` lacks it; a `Refused to execute` inline script means a raw `is:inline` slipped in.
- **Live**: `/run` the dev server with `PUBLIC_ANALYTICS_ENABLED=true` and confirm the network request and a test event in the vendor dashboard.

## Notes

- When the provider set changes, update `src/env.d.ts`, `AGENTS.md` → Swappable providers, and `SETUP.md` → Analytics, forms and captcha.
- Providers must chain before any page script calls `track`. Bundled scripts run in document order, and `<Analytics />` is in `<head>`, so ordering holds. Don't move `<Analytics />` below page scripts.
- GTM's `<noscript>` iframe is omitted on purpose: it belongs in `<body>`, and no-JS visitors can't fire our events anyway.
