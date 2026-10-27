import assert from "node:assert/strict";
import { test } from "node:test";
import { rehypeCodeBlockCopy } from "./rehype-code-block-copy.ts";
import { renderMarkdown } from "./test-helpers.ts";

const render = (markdown: string) =>
  renderMarkdown(markdown, { rehypePlugins: [rehypeCodeBlockCopy] });

test("a code block is wrapped with a Copy button", async () => {
  const html = await render("```js\nconst a = 1;\n```");
  assert.match(
    html,
    /^<div class="relative"><pre><code class="language-js">const a = 1;\n<\/code><\/pre><button type="button" class="[^"]+" data-copy-button="true" aria-label="Copy code to clipboard">Copy<\/button><\/div>$/,
  );
});

test("code blocks inside other blocks get a button too, once each", async () => {
  const html = await render("> ```\n> a\n> ```\n\n```\nb\n```");
  assert.equal(html.match(/data-copy-button/g)?.length, 2);
});

test("inline code gets no button", async () => {
  assert.equal(await render("`a`"), "<p><code>a</code></p>");
});
