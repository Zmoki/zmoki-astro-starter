import assert from "node:assert/strict";
import { test } from "node:test";
import remarkDefinitionList, { defListHastHandlers } from "remark-definition-list";
import { rehypeDefinitionListIds } from "./rehype-definition-list-ids.ts";
import { renderMarkdown } from "./test-helpers.ts";

const render = (markdown: string) =>
  renderMarkdown(markdown, {
    remarkPlugins: [remarkDefinitionList],
    remarkRehype: { handlers: defListHastHandlers },
    rehypePlugins: [rehypeDefinitionListIds],
  });

test("each <dt> gets a slug of its text as its id", async () => {
  assert.match(
    await render("Design Token\n: A named value."),
    /<dt id="design-token">Design Token<\/dt>/,
  );
});

test("markup inside the term counts; punctuation is dropped", async () => {
  assert.match(
    await render("**Core** Web Vitals (CWV)\n: Metrics."),
    /<dt id="core-web-vitals-cwv">/,
  );
});
