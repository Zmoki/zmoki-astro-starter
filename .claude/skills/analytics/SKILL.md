---
description: Add, enable, or swap analytics providers, or add a tracked event. Use when the user wants to turn on PostHog or Google Tag Manager, plug in another analytics tool (Plausible, Fathom, GA4, Umami, …), disable analytics, or track a new event.
---

# Analytics

Add/enable/swap analytics providers and tracked events. The system is **provider-agnostic and supports multiple providers at once**.

## The system

Call sites never name a vendor. They fire events through a global facade — `window.track(event, props)`, always called optionally (`window.track?.(...)`) so an unconfigured site is a silent no-op. Each **active provider chains onto `window.track`** (wrapping the previous one), so one call fans out to every provider.

- **`src/components/analytics/<p>-config.ts`** — one plain TS module per provider: its committed config constant(s) (not env vars — these are public, non-secret values), a `<p>Configured` flag, and a `<P>_CSP` record of the hosts it needs per CSP directive. The CSP (`src/headers/headers.config.ts`) imports that record, so hosts are never copied by hand.
- **`src/components/analytics/<p>.astro`** — one component per provider. It renders the loader **and** defines/extends `window.track`, from a **bundled** `<script>` that imports its config module (see **Scripts and the CSP** below).
- **`src/components/Analytics.astro`** — the **dispatcher**. Imports each provider's `<p>Configured` flag and renders the provider when it's set. All providers are further gated on one global switch, `PUBLIC_ANALYTICS_ENABLED === "true"` — **off by default**, so nothing fires unless that env var is explicitly `"true"`. A provider whose constant is empty emits **nothing** either way — no 404ing script, no Lighthouse Best-Practices hit.
- Tracked events fire from bundled scripts across layouts, pages, and components — see the **Tracked events (catalog)** section below for the full list and where each lives.

Built-in providers: **PostHog** (`POSTHOG_PROJECT_TOKEN` + `POSTHOG_HOST` in `posthog-config.ts`) and **Google Tag Manager** (`GTM_CONTAINER_ID` in `gtm-config.ts`, empty by default).

### Scripts and the CSP

The CSP's `script-src` has no `'unsafe-inline'`, so **never write a raw `<script is:inline>`** (and so no `define:vars`). Instead:

- **Default — a bundled `<script>`** (no attributes). Astro serves it as a same-origin file under `/_astro`, which `'self'` covers. It runs deferred, once per page, in document order — so providers (rendered in `<head>` by `BaseLayout`) chain onto `window.track` before any page script calls it. Read config by `import` from the provider's config module; read per-page values from `data-*` attributes on the markup.
- **A vendor's external loader** (`<script src="https://vendor…" is:inline>`) is fine — that's a file on an allowlisted host, not inline code. Put the host in the provider's `<P>_CSP`.
- **Rare — a snippet that must run before first paint** goes in `src/lib/inline-scripts.ts` as an exported string, rendered with `<script is:inline set:html={snippet} />`. `headers.config.ts` hashes the same string into `script-src`, so after changing it run `npm run build:headers` and commit the artifact (`check:headers` fails otherwise). GTM's loader is the built-in example.

`PUBLIC_ANALYTICS_ENABLED` (`src/env.d.ts`) is set to `"true"` in your host's production env and in CI for pushes to `main` (`.github/workflows/ci.yml`) — leave it unset anywhere you want analytics off (dev, PRs, previews). The full picture is in `AGENTS.md` → **Analytics**.

## Step 1 — Figure out the task

Ask the user only if unclear. The four jobs:

- **A. Enable a built-in provider** (PostHog / GTM) → fill in its constant, no other code. Step 2.
- **B. Add a new provider** (Plausible, Fathom, GA4, Umami, …) → the recipe. Step 3.
- **C. Add a tracked event** → Step 4.
- **D. Disable analytics** → Step 5.

## Step 2 — Enable a built-in provider (A)

Set the provider's committed constant (values are public/non-secret, so this is a normal code change, not a deploy-time secret):

- **PostHog** — `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` in `src/components/analytics/posthog-config.ts` (both required, or PostHog stays off).
- **GTM** — `GTM_CONTAINER_ID` in `src/components/analytics/gtm-config.ts` (e.g. `GTM-XXXXXXX`). Wire the actual tags (GA4, Ads, …) inside the GTM UI; match tracked events with a **Custom Event** trigger on the event name.

Both can be on at once. Once their constants are filled in, analytics still stays off until `PUBLIC_ANALYTICS_ENABLED=true` (production env, or CI on `main`). To test locally, prefix the dev/build command with it.

**Then rebuild the headers.** Each config module hands its hosts to the CSP (`POSTHOG_CSP`: `POSTHOG_HOST` in `script-src` + `connect-src`; `GTM_CSP`: the Google Tag Manager and Analytics hosts), and only while the provider is configured. So after filling in or blanking a constant, run `npm run build:headers` and commit the regenerated `public/_headers` (CI's `check:headers` fails otherwise). Changing `GTM_CONTAINER_ID` also changes the hash of GTM's inline loader, which the same rebuild picks up.

## Step 3 — Add a new provider (B)

Five steps. Let `<p>` be the provider slug (e.g. `plausible`).

1. **Config module** — create `src/components/analytics/<p>-config.ts` with the committed constant(s), an enable flag, and the hosts the vendor needs per CSP directive. It's a plain TS module so both the component and `headers.config.ts` (run by plain node) can import it — use relative `.ts` imports only, no `@/` alias:

   ```ts
   export const PLAUSIBLE_DOMAIN = "";

   export const plausibleConfigured = !!PLAUSIBLE_DOMAIN;

   export const PLAUSIBLE_CSP: Record<string, string[]> = plausibleConfigured
     ? { "script-src": ["https://plausible.io"], "connect-src": ["https://plausible.io"] }
     : {};
   ```

2. **Component** — create `src/components/analytics/<p>.astro`. Load the vendor library, then **chain** onto `window.track` from a bundled `<script>` (keep scripts top-level — a script wrapped in a `{ }` expression breaks Prettier's Astro parser):

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

   The external loader may keep `is:inline` (it's a file on an allowlisted host, not inline code); the facade must be a bundled script. If the vendor's snippet needs config, `import` it from the config module inside the script rather than using `define:vars`. A vendor snippet you'd rather not retype can start with `/* eslint-disable */` and `// @ts-nocheck` (see `posthog.astro`).

   The chaining wrapper (`prev` = the previously-installed `track`) is the load-bearing part — it's what lets providers coexist. Map `track(event, props)` to the vendor's own call. **Prop support varies**: PostHog/GTM/GA4/Plausible carry props; Fathom's lower tiers ignore them — that's fine, treat props as best-effort.

   Facade mappings for common vendors:

   | Provider   | `track(event, props)` →               |
   | ---------- | ------------------------------------- |
   | GA4 (gtag) | `gtag('event', event, props)`         |
   | Plausible  | `plausible(event, { props })`         |
   | Fathom     | `fathom.trackEvent(event)` (no props) |
   | Umami      | `umami.track(event, props)`           |

3. **Dispatcher** — in `src/components/Analytics.astro`, import the component and its flag, and render it:

   ```js
   import Plausible from "@/components/analytics/plausible.astro";
   import { plausibleConfigured } from "@/components/analytics/plausible-config";
   ```

   ```astro
   {analyticsEnabled && plausibleConfigured && <Plausible />}
   ```

4. **Window globals** — if the vendor exposes a new global, add it to the `Window` interface in `src/env.d.ts` (like `posthog` / `dataLayer`). No env var declaration needed — the config lives in the config module.

5. **CSP** — add `PLAUSIBLE_CSP` to `providerSources` in **`src/headers/headers.config.ts`** (never the generated `public/_headers`), then run `npm run build:headers` and commit the regenerated artifact. Without it the browser blocks the script in production. A directive the base policy doesn't declare fails the build — add it to `baseDirectives` first.

## Step 4 — Add a tracked event (C)

Fire it from the relevant bundled `<script>` with the neutral facade — **never** name a vendor:

```js
window.track?.("event_name", { some_prop: value });
```

Copy the pattern from an existing call site (e.g. `src/layouts/BaseLayout.astro` → `contact_email_clicked`, or `src/components/Prose.astro` → `code_block_copied`). Keep event names `snake_case`. Then **add a row to the catalog below** (event, where fired, properties). To associate the visitor with an id (e.g. after a form submit), call `window.identify?.(id)` — it fans out the same way.

## Tracked events (catalog)

The events this starter fires today. All go through `window.track(...)` and reach every active provider. Property support varies by provider — GTM/PostHog carry full props; some vendors (e.g. Fathom) ignore them.

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

`resource_gate_submitted` is preceded by an `identify(email)` call. (Every resource-funnel event shares the `resource_` prefix.)

**Lead-magnet gate funnel:** `resource_gate_viewed` → `resource_gate_submitted` → `resource_download_confirmed` (reached the thank-you page) → `resource_downloaded` (clicked the direct download).

## Step 5 — Disable analytics (D)

- **Everywhere it's currently off by default** (dev, PRs, previews) — nothing to do.
- **In production** — remove/unset `PUBLIC_ANALYTICS_ENABLED=true` from the host's env config.
- **One provider only** — blank its constant(s) (`GTM_CONTAINER_ID = ""` in `gtm-config.ts`, or both PostHog constants in `posthog-config.ts`). It then emits nothing regardless of the switch, and its hosts leave the CSP once you run `npm run build:headers`.

## Step 6 — Verify

```bash
npm run format      # class/format order is plugin-enforced
npm run check       # 0 errors
npm run lint
npm run build       # must pass
```

Then confirm the rendered output — a plain `npm run build` stays off (not a production deploy), so force it on with `PUBLIC_ANALYTICS_ENABLED=true` and grep `dist/`. Providers now live in bundled files, so grep `dist/_astro/` for them:

```bash
PUBLIC_ANALYTICS_ENABLED=true npm run build >/dev/null 2>&1
grep -l "posthog.init\|gtm.js?id=" dist/index.html dist/_astro/*.js   # each active provider present
grep -c 'type="module" src="/_astro/' dist/index.html                  # providers + page scripts load as files
```

Also check the **default-off** case (the Lighthouse guarantee): a plain `npm run build` with no override → no `posthog` script tag and no `gtm.js?id=` in `dist/index.html`, regardless of the provider constants.

And check the **CSP**: serve `dist/` with the header from `public/_headers` (the dev server and `astro preview` don't send it) and load a few pages with DevTools open — any `Refused to execute` / `Refused to load` message names the source to fix. A blocked vendor host means its `<P>_CSP` is missing it; a blocked inline script means a raw `is:inline` slipped in (see **Scripts and the CSP**). If a provider loads client-side, `/run` the dev server with `PUBLIC_ANALYTICS_ENABLED=true` and confirm the network request + a test event in the vendor dashboard.

## Notes

- Keep **`src/env.d.ts`**, **`AGENTS.md` → Analytics**, and **`SETUP.md` → §5** in sync whenever the provider set changes.
- The chaining wrapper must run **before** any page script calls `track`. Bundled scripts are module scripts, which run in document order after parsing; `<Analytics />` is in `<head>`, so its scripts come first and ordering holds — don't move `<Analytics />` below the page scripts. GTM's inline loader runs even earlier, during parsing.
- GTM's `<noscript>` iframe is intentionally omitted: it belongs in `<body>`, and no-JS users can't fire our JS events anyway.
