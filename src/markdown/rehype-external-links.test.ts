import assert from "node:assert/strict";
import { test } from "node:test";
import { rehypeExternalLinks } from "./rehype-external-links.ts";
import { renderMarkdown } from "./test-helpers.ts";

const render = (markdown: string) =>
  renderMarkdown(markdown, { rehypePlugins: [rehypeExternalLinks] });

test("http, https and mailto links open in a new tab and are marked external", async () => {
  for (const href of ["http://a.test/", "https://a.test/", "mailto:a@a.test"]) {
    assert.equal(
      await render(`[x](${href})`),
      `<p><a href="${href}" target="_blank" data-external="true" rel="noopener noreferrer">x</a></p>`,
    );
  }
});

test("resource and anchor links get their data attribute", async () => {
  assert.equal(
    await render("[x](/resources/a/)"),
    '<p><a href="/resources/a/" data-resource="true">x</a></p>',
  );
  assert.equal(await render("[x](#a)"), '<p><a href="#a" data-anchor="true">x</a></p>');
});

test("other internal links are unchanged", async () => {
  assert.equal(await render("[x](/blog/)"), '<p><a href="/blog/">x</a></p>');
});
