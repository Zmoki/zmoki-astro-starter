import type { Root } from "hast";
import { visit } from "unist-util-visit";

// Open external links in a new tab, and add the data-* attributes prose styles key on.

export function rehypeExternalLinks() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      const href = node.tagName === "a" ? node.properties.href : undefined;
      if (typeof href !== "string") return;
      if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
        node.properties.target = "_blank";
        node.properties["data-external"] = "true";
        node.properties.rel = ["noopener", "noreferrer"];
      }
      if (href.startsWith("/resources/")) node.properties["data-resource"] = "true";
      if (href.startsWith("#")) node.properties["data-anchor"] = "true";
    });
  };
}
