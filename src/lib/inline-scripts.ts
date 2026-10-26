// The only inline scripts the site ships: snippets that must run before a
// bundled (deferred) script could. headers.config.ts hashes these same strings
// into the CSP `script-src`, so after changing one run `npm run build:headers`.
// See "Scripts & the CSP" in AGENTS.md.
//
// Plain-node scripts load this via headers.config.ts: relative `.ts` imports
// only, no `@/` alias, no `astro:*` modules.

import { GTM_CONTAINER_ID } from "../components/analytics/gtm-config.ts";

// GTM loader plus the track/identify facade (see gtm.astro). It goes high in
// <head> so the container starts loading at once. Empty when GTM is unconfigured.
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
