import type { ElementContent, Root } from "hast";
import { visit } from "unist-util-visit";

// Give each <dt> a slug id so glossary terms can be linked to.

// Text of the node and its direct children; deeper markup is ignored.
const textOf = (children: ElementContent[]) =>
  children
    .map((child) => {
      if (child.type === "text") return child.value;
      if (child.type === "element") {
        return child.children
          .map((grandChild) => (grandChild.type === "text" ? grandChild.value : ""))
          .join("");
      }
      return "";
    })
    .join("")
    .trim();

export function rehypeDefinitionListIds() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "dt") return;
      const text = textOf(node.children);
      if (!text) return;
      node.properties.id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();
    });
  };
}
