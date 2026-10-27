import assert from "node:assert/strict";
import { test } from "node:test";
import type { Root } from "mdast";
import { remarkImgTags } from "./remark-img-tags.ts";
import { markdownTree } from "./test-helpers.ts";

const origin = "https://img.test";
const plugin: [typeof remarkImgTags, { origin: string }] = [remarkImgTags, { origin }];
const images = (tree: Root) => JSON.stringify(tree).match(/"type":"image"/g)?.length ?? 0;

test("a lone origin <img> becomes an image in a paragraph, keeping src, alt and title", async () => {
  const tree = await markdownTree(`<img src="${origin}/a.jpg" alt="A" title="T" width="300">`, [
    plugin,
  ]);
  assert.deepEqual(tree.children[0], {
    type: "paragraph",
    children: [{ type: "image", url: `${origin}/a.jpg`, alt: "A", title: "T" }],
  });
});

test("consecutive, unquoted and single-quoted <img> tags are all converted", async () => {
  const tree = await markdownTree(
    `<img src="${origin}/a.jpg" alt="a">\n<img src=${origin}/b.jpg alt=b>\n<img src='${origin}/c.jpg'>`,
    [plugin],
  );
  assert.equal(images(tree), 3);
});

test("an <img> inside other raw HTML is converted and the HTML around it kept", async () => {
  const tree = await markdownTree(`<p align="center"><img src="${origin}/a.jpg" alt="a"></p>`, [
    plugin,
  ]);
  const values = tree.children.map((n) => (n.type === "html" ? n.value : n.type));
  assert.deepEqual(values, ['<p align="center">', "image", "</p>"]);
});

test("entities in src, alt and title are decoded once", async () => {
  const tree = await markdownTree(
    `<img src="${origin}/a.jpg?w=1&amp;h=2" alt="Tom &amp; Jerry &#39;x&#39;">`,
    [plugin],
  );
  const image = (tree.children[0] as { children: { url: string; alt: string }[] }).children[0];
  assert.equal(image.url, `${origin}/a.jpg?w=1&h=2`);
  assert.equal(image.alt, "Tom & Jerry 'x'");
});

test("a relative <img> is converted; one off the origin is left as raw HTML", async () => {
  const tree = await markdownTree(`<img src="./a.jpg">\n\n<img src="https://other.test/b.jpg">`, [
    plugin,
  ]);
  assert.equal(tree.children[0].type, "paragraph");
  assert.equal(tree.children[1].type, "html");
});

test("an <img> in a <picture> is left alone, as a block or inline", async () => {
  const block = await markdownTree(`<picture>\n<img src="${origin}/a.jpg">\n</picture>`, [plugin]);
  const inline = await markdownTree(`<picture><img src="${origin}/a.jpg"></picture>`, [plugin]);
  assert.equal(images(block), 0);
  assert.equal(images(inline), 0);
});

test("an inline <img> after a closed <picture> is still converted", async () => {
  const tree = await markdownTree(
    `<picture><img src="${origin}/a.jpg"></picture> <img src="${origin}/b.jpg">`,
    [plugin],
  );
  assert.equal(images(tree), 1);
});

test("in MDX, a literal <img> is unmarked as explicit JSX, except inside a <picture>", () => {
  const img = () => ({ type: "mdxJsxFlowElement", name: "img", data: { _mdxExplicitJsx: true } });
  const tree = {
    type: "root",
    children: [img(), { type: "mdxJsxFlowElement", name: "picture", children: [img()] }],
  } as unknown as Root;
  remarkImgTags({ origin })(tree);
  const [standalone, picture] = tree.children as unknown as {
    data?: { _mdxExplicitJsx: boolean };
    children?: { data: { _mdxExplicitJsx: boolean } }[];
  }[];
  assert.equal(standalone.data?._mdxExplicitJsx, false);
  assert.equal(picture.children?.[0].data._mdxExplicitJsx, true);
});
