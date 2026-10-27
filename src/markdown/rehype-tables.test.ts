import assert from "node:assert/strict";
import { test } from "node:test";
import type { Root } from "hast";
import remarkDefinitionList, { defListHastHandlers } from "remark-definition-list";
import { rehypeTables } from "./rehype-tables.ts";
import { renderMarkdown } from "./test-helpers.ts";

const table = "| A | B |\n| - | - |\n| 1 | 2 |";
// In .md, rehype-raw leaves whitespace between the box and the table; it doesn't render.
const render = async (markdown: string) =>
  (await renderMarkdown(markdown, { rehypePlugins: [rehypeTables] })).replace(/>\s+</g, "><");

test("a `: Caption` paragraph after a table becomes its caption, with inline markup", async () => {
  const html = await render(`${table}\n\n: Caption with **bold**`);
  assert.match(
    html,
    /^<div data-table-scroll(?:="")? tabindex="0" role="region" aria-labelledby="table-caption-1"><table><caption id="table-caption-1"><span>Caption with <strong>bold<\/strong><\/span><\/caption>/,
  );
  assert.doesNotMatch(html, /<p>/);
});

test("a table without a caption is still wrapped and gets a generic name", async () => {
  const html = await render(table);
  assert.match(
    html,
    /^<div data-table-scroll(?:="")? tabindex="0" role="region" aria-label="Table"><table>/,
  );
});

test("each caption gets its own id", async () => {
  const html = await render(`${table}\n\n: One\n\n${table}\n\n: Two`);
  assert.match(html, /id="table-caption-1"><span>One/);
  assert.match(html, /id="table-caption-2"><span>Two/);
});

test("a definition list's `:` line stays a definition", async () => {
  const html = await renderMarkdown(`${table}\n\nTerm\n: Definition`, {
    remarkPlugins: [remarkDefinitionList],
    remarkRehype: { handlers: defListHastHandlers },
    rehypePlugins: [rehypeTables],
  });
  assert.match(html, /<dt>Term<\/dt>/);
  assert.match(html, /aria-label="Table"/);
});

test("a table inside an MDX JSX block is wrapped and captioned too", () => {
  const tree = {
    type: "root",
    children: [
      {
        type: "mdxJsxFlowElement",
        name: "div",
        attributes: [],
        children: [
          { type: "element", tagName: "table", properties: {}, children: [] },
          {
            type: "element",
            tagName: "p",
            properties: {},
            children: [{ type: "text", value: ": In JSX" }],
          },
        ],
      },
    ],
  } as unknown as Root;
  rehypeTables()(tree);
  const block = tree.children[0] as unknown as {
    children: { properties: object; children: unknown[] }[];
  };
  assert.equal(block.children.length, 1);
  assert.deepEqual(block.children[0].properties, {
    dataTableScroll: true,
    tabIndex: 0,
    role: "region",
    ariaLabelledBy: ["table-caption-1"],
  });
});
