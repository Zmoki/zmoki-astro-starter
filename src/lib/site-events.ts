import { bandOf } from "@/lib/analytics";

// Site-wide click events, delegated from the document so links in content count too.
// BaseLayout imports this once per page. Events and props: src/ANALYTICS.md.

// Standing asks (site.asks), by origin + path, so absolute and relative links both
// match. BaseLayout puts them on <body>: importing site.config here would bundle all
// of it into client JS, the image origin included.
const asks = new Map(
  Object.entries(JSON.parse(document.body.dataset.asks ?? "{}") as Record<string, string>).map(
    ([cta, href]) => {
      const url = new URL(href, location.origin);
      return [url.origin + url.pathname, cta];
    },
  ),
);

document.addEventListener("click", (event) => {
  const target = event.target as Element | null;
  if (!target) return;

  const copy = target.closest<HTMLButtonElement>("[data-copy-button]");
  if (copy) {
    const code = copy.parentElement?.querySelector("pre code")?.textContent ?? "";
    window.track?.("code_block_copied", { snippet_length: code.length, location: bandOf(copy) });
    return;
  }

  const link = target.closest<HTMLAnchorElement>("a[href]");
  if (!link) return;
  const href = link.getAttribute("href") ?? "";
  if (href.startsWith("mailto:")) {
    window.track?.("contact_email_clicked", {
      email: href.replace("mailto:", ""),
      location: bandOf(link),
    });
    return;
  }
  const url = new URL(link.href);
  const cta = asks.get(url.origin + url.pathname);
  if (cta) window.track?.("cta_clicked", { cta, href, location: bandOf(link) });
});
