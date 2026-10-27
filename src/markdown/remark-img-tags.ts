import type { Html, Image, Nodes, Paragraph, PhrasingContent, Root } from "mdast";
import { SKIP, visit } from "unist-util-visit";
import { IMAGE_ORIGIN, isOnImageOrigin } from "../lib/image-origin.ts";

// Treat a raw <img> in content like Markdown `![]()`, so origin images are optimized
// instead of published (the CSP blocks the origin). See the /images skill.
// - .mdx: MDX never swaps literal JSX for a component, and marks it with
//   `_mdxExplicitJsx` before our plugins run. Clearing the flag lets <Content components>
//   map it like `![]()` (to MarkdownImage), with its attributes. Without the map it stays an <img>.
// - .md: each origin or relative <img> in raw HTML becomes `![]()`, keeping only src,
//   alt and title. The HTML around it stays raw.
// An <img> inside a <picture> is left alone: the author chose its sources.

export interface Options {
  /** The image origin. Defaults to site.platform.imagesCDNHost. */
  origin?: string;
}

// The MDX JSX nodes we touch, typed here so this file doesn't depend on mdast-util-mdx-jsx.
interface MdxJsxElement {
  type: "mdxJsxFlowElement" | "mdxJsxTextElement";
  name: string | null;
  data?: Record<string, unknown>;
}

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };

const decodeEntities = (text: string) =>
  text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|quot|apos|lt|gt));/gi, (_, dec, hex, name) =>
    dec
      ? String.fromCodePoint(Number(dec))
      : hex
        ? String.fromCodePoint(parseInt(hex, 16))
        : ENTITIES[name.toLowerCase()],
  );

function attr(tag: string, name: string): string | undefined {
  const match = tag.match(
    new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"),
  );
  const value = match && (match[1] ?? match[2] ?? match[3]);
  return value == null ? undefined : decodeEntities(value);
}

// Inline raw HTML is split into one node per tag, so a <picture> opened by an earlier
// sibling still contains this node.
function insidePicture(siblings: Nodes[], index: number): boolean {
  const before = siblings
    .slice(0, index)
    .map((n) => (n.type === "html" ? n.value : ""))
    .join("");
  return before.lastIndexOf("<picture") > before.lastIndexOf("</picture");
}

export function remarkImgTags({ origin = IMAGE_ORIGIN }: Options = {}) {
  return (tree: Root) => {
    visit(tree, (node: Nodes, index, parent) => {
      const jsx = node as unknown as MdxJsxElement;
      if (jsx.type === "mdxJsxFlowElement" || jsx.type === "mdxJsxTextElement") {
        if (jsx.name === "picture") return SKIP;
        if (jsx.name === "img") jsx.data = { ...jsx.data, _mdxExplicitJsx: false };
        return;
      }
      if (node.type !== "html" || !parent || index === undefined) return;
      if (/<picture\b/i.test(node.value) || insidePicture(parent.children as Nodes[], index))
        return;
      const nodes: (Html | Image)[] = [];
      let last = 0;
      for (const match of node.value.matchAll(/<img\b[^>]*>/gi)) {
        const src = attr(match[0], "src");
        if (!src || !(src.startsWith(".") || isOnImageOrigin(src, origin))) continue;
        if (match.index > last) {
          nodes.push({ type: "html", value: node.value.slice(last, match.index) });
        }
        nodes.push({
          type: "image",
          url: src,
          alt: attr(match[0], "alt") ?? "",
          title: attr(match[0], "title") ?? null,
        });
        last = match.index + match[0].length;
      }
      if (!nodes.length) return;
      if (last < node.value.length) nodes.push({ type: "html", value: node.value.slice(last) });
      // Only images: a paragraph, like `![]()` on its own line.
      const onlyImages = nodes.every((n) => n.type === "image" || !n.value.trim());
      const replacement: Nodes[] =
        parent.type === "root" && onlyImages
          ? [{ type: "paragraph", children: nodes as PhrasingContent[] } satisfies Paragraph]
          : nodes;
      (parent.children as Nodes[]).splice(index, 1, ...replacement);
      return [SKIP, index + replacement.length];
    });
  };
}
