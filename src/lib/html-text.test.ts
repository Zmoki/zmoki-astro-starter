import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeEntities, htmlToText } from "./html-text.ts";

test("decodeEntities decodes numeric and the five XML entities once", () => {
  assert.equal(
    decodeEntities("Tom &amp; Jerry &#39;x&#39; &#x2014; &lt;b&gt;"),
    "Tom & Jerry 'x' — <b>",
  );
  assert.equal(decodeEntities("&amp;amp;"), "&amp;");
});

test("htmlToText drops tags, decodes entities and collapses whitespace", () => {
  assert.equal(htmlToText("Astro &amp; <em>SEO</em><br>guide"), "Astro & SEO guide");
  assert.equal(htmlToText("Plain title"), "Plain title");
});
