---
description: Add, enable, or swap analytics providers, or add a tracked event. Use when the user wants to turn on PostHog or Google Tag Manager, plug in another analytics tool (Plausible, Fathom, GA4, Umami, …), disable analytics, or track a new event.
---

# Analytics

Add/enable/swap analytics providers and tracked events. The system is **provider-agnostic and supports multiple providers at once**.

## The system

Call sites never name a vendor. They fire events through a global facade — `window.track(event, props)`, always called optionally (`window.track?.(...)`) so an unconfigured site is a silent no-op. Each **active provider chains onto `window.track`** (wrapping the previous one), so one call fans out to every provider.

- **`src/components/analytics/*.astro`** — one component per provider. Each exports its own committed config constant(s) (not env vars — these are public, non-secret values), renders its loader snippet, **and** defines/extends `window.track`.
- **`src/components/Analytics.astro`** — the **dispatcher**. Imports each provider's constant(s), computes an enable flag from them, and renders it. All providers are further gated on one global switch, `PUBLIC_ANALYTICS_ENABLED === "true"` — **off by default**, so nothing fires unless that env var is explicitly `"true"`. A provider whose constant is empty emits **nothing** either way — no 404ing script, no Lighthouse Best-Practices hit.
- Tracked events fire from inline scripts across layouts, pages, and components — see the **Tracked events (catalog)** section below for the full list and where each lives.

Built-in providers: **PostHog** (`POSTHOG_PROJECT_TOKEN` + `POSTHOG_HOST` constants in `posthog.astro`) and **Google Tag Manager** (`GTM_CONTAINER_ID` constant in `gtm.astro`, empty by default).

`PUBLIC_ANALYTICS_ENABLED` (`src/env.d.ts`) is set to `"true"` in your host's production env and in CI for pushes to `main` (`.github/workflows/ci.yml`) — leave it unset anywhere you want analytics off (dev, PRs, previews). The full picture is in `AGENTS.md` → **Analytics**.

## Step 1 — Figure out the task

Ask the user only if unclear. The four jobs:

- **A. Enable a built-in provider** (PostHog / GTM) → fill in its constant, no other code. Step 2.
- **B. Add a new provider** (Plausible, Fathom, GA4, Umami, …) → the recipe. Step 3.
- **C. Add a tracked event** → Step 4.
- **D. Disable analytics** → Step 5.

## Step 2 — Enable a built-in provider (A)

Set the provider's committed constant (values are public/non-secret, so this is a normal code change, not a deploy-time secret):

- **PostHog** — `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` in `src/components/analytics/posthog.astro` (both required, or PostHog stays off).
- **GTM** — `GTM_CONTAINER_ID` in `src/components/analytics/gtm.astro` (e.g. `GTM-XXXXXXX`). Wire the actual tags (GA4, Ads, …) inside the GTM UI; match tracked events with a **Custom Event** trigger on the event name.

Both can be on at once. Once their constants are filled in, analytics still stays off until `PUBLIC_ANALYTICS_ENABLED=true` (production env, or CI on `main`). To test locally, prefix the dev/build command with it.

**PostHog CSP host.** The snippet loads its script from (`script-src`) and sends events to (`connect-src`) `POSTHOG_HOST`, so that origin must be in the CSP or the browser blocks it in production. A cross-origin host needs an explicit allowlist entry — PostHog Cloud (`app.posthog.com`) is cross-origin, and so is a **reverse-proxy subdomain** on your own domain. It's hard-coded as a literal (in `script-src` and `connect-src`) in **`src/headers/headers.config.ts`** — **keep it in sync with the `POSTHOG_HOST` constant in `posthog.astro`**. The value is duplicated on purpose: `headers.config.ts` compiles into a committed, drift-checked `public/_headers` artifact that can only import plain TS modules, not `.astro` component exports, so the CSP needs its own literal. After editing either one, run `npm run build:headers` and commit the regenerated `public/_headers`.

## Step 3 — Add a new provider (B)

Four steps. Let `<p>` be the provider slug (e.g. `plausible`).

1. **Component** — create `src/components/analytics/<p>.astro`: frontmatter exports the provider's config as a committed constant (not an env var — these are public, non-secret values) for `define:vars`; the body is a single top-level `<script is:inline>` (keep it top-level — a script wrapped in a `{ }` expression breaks Prettier's Astro parser) that (a) loads the vendor library and (b) **chains** onto `window.track`:

   ```astro
   ---
   export const PLAUSIBLE_DOMAIN = "";
   const domain = PLAUSIBLE_DOMAIN;
   ---

   <script
     is:inline
     define:vars={{ domain }}
     defer
     data-domain={domain}
     src="https://plausible.io/js/script.manual.js"></script>
   <script is:inline>
     window.track = (function (prev) {
       return function (event, props) {
         if (prev) prev(event, props);
         window.plausible && window.plausible(event, { props: props });
       };
     })(window.track);
   </script>
   ```

   The chaining wrapper (`prev` = the previously-installed `track`) is the load-bearing part — it's what lets providers coexist. Map `track(event, props)` to the vendor's own call. **Prop support varies**: PostHog/GTM/GA4/Plausible carry props; Fathom's lower tiers ignore them — that's fine, treat props as best-effort.

   Facade mappings for common vendors:

   | Provider   | `track(event, props)` →               |
   | ---------- | ------------------------------------- |
   | GA4 (gtag) | `gtag('event', event, props)`         |
   | Plausible  | `plausible(event, { props })`         |
   | Fathom     | `fathom.trackEvent(event)` (no props) |
   | Umami      | `umami.track(event, props)`           |

2. **Dispatcher** — in `src/components/Analytics.astro`, import the component and its constant, add an enable flag from it, and render it:

   ```js
   import Plausible, { PLAUSIBLE_DOMAIN } from "@/components/analytics/plausible.astro";
   const plausibleEnabled = !!PLAUSIBLE_DOMAIN;
   ```

   ```astro
   {analyticsEnabled && plausibleEnabled && <Plausible />}
   ```

3. **Window globals** — if the vendor exposes a new global, add it to the `Window` interface in `src/env.d.ts` (like `posthog` / `dataLayer`). No env var declaration needed — the config constant lives in the component itself.

4. **CSP** — allowlist the vendor's script/connect (and any pixel `img-src`) hosts in the `cspDirectives` in **`src/headers/headers.config.ts`** (the source of truth — **not** the generated `public/_headers`), then run `npm run build:headers` and commit the regenerated artifact. Without this the browser blocks the script in production. GTM already ships allowlisted; a new provider needs its own host added. (See the **PostHog CSP host** note in Step 2 for why hosts are duplicated as literals here rather than imported from the component.)

## Step 4 — Add a tracked event (C)

Fire it from the relevant inline script with the neutral facade — **never** name a vendor:

```js
window.track?.("event_name", { some_prop: value });
```

Copy the pattern from an existing call site (e.g. `src/layouts/BaseLayout.astro` → `contact_email_clicked`, or `src/components/Prose.astro` → `code_block_copied`). Keep event names `snake_case`. Then **add a row to the catalog below** (event, where fired, properties). To associate the visitor with an id (e.g. after a form submit), call `window.identify?.(id)` — it fans out the same way.

## Tracked events (catalog)

The events this starter fires today. All go through `window.track(...)` and reach every active provider. Property support varies by provider — GTM/PostHog carry full props; some vendors (e.g. Fathom) ignore them.

| Event                         | Where fired                 | Properties                      |
| ----------------------------- | --------------------------- | ------------------------------- |
| `contact_email_clicked`       | `BaseLayout.astro`          | `email`                         |
| `post_viewed`                 | `blog/[...slug].astro`      | `post_slug`, `post_title`       |
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
- **One provider only** — blank its constant(s) (`GTM_CONTAINER_ID = ""` in `gtm.astro`, or both PostHog constants in `posthog.astro`). It then emits nothing regardless of the switch.

## Step 6 — Verify

```bash
npm run format      # class/format order is plugin-enforced
npm run check       # 0 errors
npm run lint
npm run build       # must pass
```

Then confirm the rendered output — a plain `npm run build` stays off (not a production deploy), so force it on with `PUBLIC_ANALYTICS_ENABLED=true` and grep `dist/`:

```bash
PUBLIC_ANALYTICS_ENABLED=true npm run build >/dev/null 2>&1
grep -c "posthog.init\|gtm.js?id=" dist/index.html                    # each active provider present
grep -oc "window.track = (function (prev)" dist/index.html            # one chain per active provider
grep -oc 'window.track?.(' dist/index.html                            # call sites use the facade
```

Also check the **default-off** case (the Lighthouse guarantee): a plain `npm run build` with no override → `grep -c "posthog.init\|gtm.js?id=" dist/index.html` returns `0` regardless of the provider constants. If a provider loads client-side, `/run` the dev server with `PUBLIC_ANALYTICS_ENABLED=true` and confirm the network request + a test event in the vendor dashboard.

## Notes

- Keep **`src/env.d.ts`**, **`AGENTS.md` → Analytics**, and **`SETUP.md` → §5** in sync whenever the provider set changes.
- The chaining wrapper must run **before** the event listeners fire. `<Analytics />` is in `<head>` and listeners are at end of `<body>`, so ordering holds — don't move `<Analytics />` below the body scripts.
- GTM's `<noscript>` iframe is intentionally omitted: it belongs in `<body>`, and no-JS users can't fire our JS events anyway.
