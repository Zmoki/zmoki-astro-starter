// The only inline scripts the site ships: snippets that must run before first
// paint or as early as possible, so they can't wait for a bundled (deferred)
// module script. Everything else is a bundled `<script>` served from /_astro,
// which the CSP's 'self' already covers.
//
// Each snippet is an exported string. The component renders it with
// `<script is:inline set:html={…} />`, and src/headers/headers.config.ts hashes
// the same strings into `script-src` ('sha256-…'), so markup and policy can't
// drift. Change a snippet → `npm run build:headers` → commit the artifact
// (CI's `check:headers` fails otherwise).
//
// This module is imported by plain-node scripts too (via headers.config.ts), so
// it uses relative `.ts` imports only — no `@/` alias, no `astro:*` modules.

import { GTM_CONTAINER_ID } from "../components/analytics/gtm-config.ts";

// Google Tag Manager loader + the track/identify facade (see gtm.astro). GTM
// asks for its snippet high in <head> so the container starts loading at once;
// the facade then maps every track() call to a dataLayer push. Empty when GTM
// is unconfigured.
export const gtmLoader = GTM_CONTAINER_ID
  ? `(function (w, d, s, l, i) {
  w[l] = w[l] || [];
  w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  var f = d.getElementsByTagName(s)[0],
    j = d.createElement(s),
    dl = l != "dataLayer" ? "&l=" + l : "";
  j.async = true;
  j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
  f.parentNode.insertBefore(j, f);
})(window, document, "script", "dataLayer", ${JSON.stringify(GTM_CONTAINER_ID)});
window.track = (function (prev) {
  return function (event, props) {
    if (prev) prev(event, props);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, props || {}));
  };
})(window.track);
window.identify = (function (prev) {
  return function (id, props) {
    if (prev) prev(id, props);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: "identify", user_id: id }, props || {}));
  };
})(window.identify);`
  : "";

/** Every non-empty snippet — the list headers.config.ts hashes into the CSP. */
export const inlineScripts: string[] = [gtmLoader].filter(Boolean);
