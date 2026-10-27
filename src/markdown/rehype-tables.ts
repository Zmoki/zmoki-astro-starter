import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

// Tables: a `: Caption` paragraph right after a table becomes its <caption> (Pandoc's
// syntax; remark-definition-list needs a term line above the `:`, so they don't clash).
// Every table is wrapped in a focusable scroll box, so a wide one scrolls instead of
// widening the page. Walks every parent, so tables inside MDX JSX blocks are covered.
// Styles: src/styles/global.css.

export function rehypeTables() {
  return (tree: Root) => {
    let captions = 0;
    visit(tree, (node) => {
      if (!("children" in node) || (node.type === "element" && node.properties.dataTableScroll))
        return;
      const children = node.children as Root["children"];
      children.forEach((table, i) => {
        if (table.type !== "element" || table.tagName !== "table") return;
        let next = i + 1;
        while (
          children[next]?.type === "text" &&
          !(children[next] as { value: string }).value.trim()
        )
          next++;
        const paragraph = children[next];
        const first =
          paragraph?.type === "element" && paragraph.tagName === "p"
            ? paragraph.children[0]
            : undefined;
        let captionId: string | undefined;
        if (
          paragraph?.type === "element" &&
          first?.type === "text" &&
          first.value.startsWith(": ")
        ) {
          captionId = `table-caption-${++captions}`;
          first.value = first.value.slice(2);
          table.children.unshift({
            type: "element",
            tagName: "caption",
            properties: { id: captionId },
            // The span stays in view while the table scrolls (global.css).
            children: [
              { type: "element", tagName: "span", properties: {}, children: paragraph.children },
            ],
          });
          children.splice(i + 1, next - i);
        }
        // A focusable region needs a name: the caption, or a generic one.
        children[i] = {
          type: "element",
          tagName: "div",
          properties: {
            dataTableScroll: true,
            tabIndex: 0,
            role: "region",
            ...(captionId ? { ariaLabelledBy: [captionId] } : { ariaLabel: "Table" }),
          },
          children: [table],
        } satisfies Element;
      });
    });
  };
}
