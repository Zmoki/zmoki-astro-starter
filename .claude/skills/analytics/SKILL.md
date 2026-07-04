---
description: Add, enable, or swap analytics providers, or add a tracked event. Use when the user wants to turn on PostHog or Google Tag Manager, plug in another analytics tool (Plausible, Fathom, GA4, Umami, …), disable analytics, or track a new event.
---

# Analytics

Add/enable/swap analytics providers and tracked events. The system is **provider-agnostic and supports multiple providers at once**.

## The system

Call sites never name a vendor. They fire events through a global facade — `window.track(event, props)`, always called optionally (`window.track?.(...)`) so an unconfigured site is a silent no-op. Each **active provider chains onto `window.track`** (wrapping the previous one), so one call fans out to every provider.

- **`src/components/analytics/*.astro`** — one component per provider. Each renders its loader snippet **and** defines/extends `window.track`.
- **`src/components/Analytics.astro`** — the **dispatcher**. Computes each provider's enable flag from env vars and renders it, all under one global kill switch `PUBLIC_ANALYTICS_ENABLED !== "false"`. A provider that isn't configured emits **nothing** — no 404ing script, no Lighthouse Best-Practices hit.
- Tracked events fire from inline scripts across layouts, pages, and components — see the **Tracked events (catalog)** section below for the full list and where each lives.

Built-in providers: **PostHog** (`PUBLIC_POSTHOG_PROJECT_TOKEN` + `PUBLIC_POSTHOG_HOST`) and **Google Tag Manager** (`PUBLIC_GTM_CONTAINER_ID`).

Env vars are declared in **`src/env.d.ts`** (source of truth) and mirrored empty in **`.env.example`**. The full picture is in `AGENTS.md` → **Analytics**.

## Step 1 — Figure out the task

Ask (`AskUserQuestion`) only if unclear. The four jobs:

- **A. Enable a built-in provider** (PostHog / GTM) → just env vars, no code. Step 2.
- **B. Add a new provider** (Plausible, Fathom, GA4, Umami, …) → the recipe. Step 3.
- **C. Add a tracked event** → Step 4.
- **D. Disable analytics** → Step 5.

## Step 2 — Enable a built-in provider (A)

No code changes. Tell the user to set the env vars (in `.env` for dev, in the host/CI for prod):

- **PostHog** — `PUBLIC_POSTHOG_PROJECT_TOKEN` and `PUBLIC_POSTHOG_HOST` (both required, or PostHog stays off).
- **GTM** — `PUBLIC_GTM_CONTAINER_ID` (e.g. `GTM-XXXXXXX`). Wire the actual tags (GA4, Ads, …) inside the GTM UI; match tracked events with a **Custom Event** trigger on the event name.

Both can be on at once. `PUBLIC_ANALYTICS_ENABLED=false` turns everything off regardless.

## Step 3 — Add a new provider (B)

Four steps. Let `<p>` be the provider slug (e.g. `plausible`).

1. **Component** — create `src/components/analytics/<p>.astro`: frontmatter reads the provider's config from `import.meta.env` for `define:vars`; the body is a single top-level `<script is:inline>` (keep it top-level — a script wrapped in a `{ }` expression breaks Prettier's Astro parser) that (a) loads the vendor library and (b) **chains** onto `window.track`:

   ```astro
   ---
   const domain = import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN;
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

2. **Dispatcher** — in `src/components/Analytics.astro`, import the component, add an enable flag from its env var(s), and render it:

   ```js
   import Plausible from "@/components/analytics/plausible.astro";
   const plausibleEnabled = !!import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN;
   ```

   ```astro
   {analyticsEnabled && plausibleEnabled && <Plausible />}
   ```

3. **Env vars** — declare each new `PUBLIC_*` var in **`src/env.d.ts`** first, then add it (empty, with a comment) to **`.env.example`**. If the vendor exposes a new global, add it to the `Window` interface in `src/env.d.ts` (like `posthog` / `dataLayer`).

4. **CSP** — allowlist the vendor's script/connect (and any pixel `img-src`) hosts in **`public/_headers`** (`Content-Security-Policy`). Without this the browser blocks the script in production. GTM already ships allowlisted; a new provider needs its own host added.

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
| `resource_link_clicked`       | `ResourceLink.astro`        | `resource_slug`, `is_external`  |
| `resource_gate_viewed`        | `BrevoForm.astro`           | `resource_slug`, `form_id`      |
| `resource_gate_submitted`     | `BrevoForm.astro`           | `form_id`, `resource_slug`      |
| `resource_download_confirmed` | `thank-you/[...slug].astro` | `resource_name`, `resource_url` |
| `resource_downloaded`         | `thank-you/[...slug].astro` | `resource_name`, `asset_url`    |

`resource_gate_submitted` is preceded by an `identify(email)` call. (Every resource-funnel event shares the `resource_` prefix.)

**Lead-magnet gate funnel:** `resource_gate_viewed` → `resource_gate_submitted` → `resource_download_confirmed` (reached the thank-you page) → `resource_downloaded` (clicked the direct download).

## Step 5 — Disable analytics (D)

- **All providers** — set `PUBLIC_ANALYTICS_ENABLED=false`.
- **One provider** — clear its env var(s) (`PUBLIC_GTM_CONTAINER_ID=`, or both PostHog vars). It then emits nothing.

## Step 6 — Verify

```bash
npm run format      # class/format order is plugin-enforced
npm run check       # 0 errors
npm run lint
npm run build       # must pass
```

Then confirm the rendered output — build with the env vars set and grep `dist/`:

```bash
PUBLIC_POSTHOG_PROJECT_TOKEN=x PUBLIC_POSTHOG_HOST=https://h PUBLIC_GTM_CONTAINER_ID=GTM-T npm run build >/dev/null 2>&1
grep -c "posthog.init\|gtm.js?id=" dist/index.html                    # each active provider present
grep -oc "window.track = (function (prev)" dist/index.html            # one chain per active provider
grep -oc 'window.track?.(' dist/index.html                            # call sites use the facade
```

Also check the **unconfigured** case emits nothing (the Lighthouse guarantee): `npm run build` with no analytics env vars → `grep -c "posthog.init\|gtm.js?id=" dist/index.html` returns `0`. If a provider loads client-side, `/run` the dev server and confirm the network request + a test event in the vendor dashboard.

## Notes

- Keep **`src/env.d.ts`**, **`.env.example`**, **`AGENTS.md` → Analytics**, and **`SETUP.md` → §5** in sync whenever the provider set or env vars change.
- The chaining wrapper must run **before** the event listeners fire. `<Analytics />` is in `<head>` and listeners are at end of `<body>`, so ordering holds — don't move `<Analytics />` below the body scripts.
- GTM's `<noscript>` iframe is intentionally omitted: it belongs in `<body>`, and no-JS users can't fire our JS events anyway.
