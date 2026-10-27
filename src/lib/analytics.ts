// Client helpers for analytics events, for bundled <script>s. Events and their
// props: src/ANALYTICS.md.

type Props = Record<string, unknown>;

/** Where a click happened: the closest section's `data-band`, else "body". */
export const bandOf = (el: Element): string =>
  el.closest<HTMLElement>("[data-band]")?.dataset.band ?? "body";

/** Fires `event` once, the first time at least half of `el` is on screen. */
export function trackWhenVisible(el: Element, event: string, props?: Props): void {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      window.track?.(event, props);
    },
    { threshold: 0.5 },
  );
  observer.observe(el);
}
