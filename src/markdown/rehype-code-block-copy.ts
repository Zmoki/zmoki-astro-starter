import type { Element, Root } from "hast";
import { SKIP, visit } from "unist-util-visit";

// Add a Copy button to each code block; Prose.astro wires up the click, which copies
// from the DOM, so formatting is preserved. The button's classes are also listed in
// src/styles/global.css: keep them in sync.

export function rehypeCodeBlockCopy() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "pre" || !parent || index === undefined) return;
      if (!node.children.some((c) => c.type === "element" && c.tagName === "code")) return;
      const copyButton: Element = {
        type: "element",
        tagName: "button",
        properties: {
          type: "button",
          class:
            "absolute top-2 right-2 rounded-lg bg-zmoki-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zmoki-indigo-700 focus:outline-none focus:ring-2 focus:ring-zmoki-indigo-500 focus:ring-offset-2 transition-colors duration-200",
          "data-copy-button": "true",
          "aria-label": "Copy code to clipboard",
        },
        children: [{ type: "text", value: "Copy" }],
      };
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { class: "relative" },
        children: [node, copyButton],
      };
      return SKIP;
    });
  };
}
