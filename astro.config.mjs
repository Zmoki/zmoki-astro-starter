import { defineConfig, fontProviders } from "astro/config";
import { fonts } from "./src/design-tokens.mjs";
import { site } from "./src/site.config.ts";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import remarkDefinitionList from "remark-definition-list";
import { defListHastHandlers } from "remark-definition-list";
import { SKIP, visit } from "unist-util-visit";
import { IMAGE_ORIGIN, isOnImageOrigin } from "./src/lib/image-origin.ts";

// The image origin's hostname, authorized for build-time optimization below.
let imageHostname = "";
if (IMAGE_ORIGIN) {
  try {
    imageHostname = new URL(IMAGE_ORIGIN).hostname;
  } catch {
    throw new Error(
      `site.platform.imagesCDNHost must be a full URL (e.g. "https://images.example.com") or "": got "${IMAGE_ORIGIN}"`,
    );
  }
}

// Treat a raw <img> in content like Markdown `![]()`, so origin images are optimized
// instead of published (the CSP blocks the origin). See the /images skill.
// - .mdx: MDX never swaps literal JSX for a component, and marks it with
//   `_mdxExplicitJsx` before our plugins run. Clearing the flag lets <Content components>
//   map it like `![]()` (to MarkdownImage), with its attributes. Without the map it stays an <img>.
// - .md: each origin or relative <img> in raw HTML becomes `![]()`, keeping only src,
//   alt and title. The HTML around it stays raw.
// An <img> inside a <picture> is left alone: the author chose its sources.
const ENTITIES = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };
const decodeEntities = (text) =>
  text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|quot|apos|lt|gt));/gi, (_, dec, hex, name) =>
    dec
      ? String.fromCodePoint(Number(dec))
      : hex
        ? String.fromCodePoint(parseInt(hex, 16))
        : ENTITIES[name.toLowerCase()],
  );
function remarkImgTags() {
  const attr = (tag, name) => {
    const match = tag.match(
      new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"),
    );
    const value = match && (match[1] ?? match[2] ?? match[3]);
    return value == null ? undefined : decodeEntities(value);
  };
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
        if (node.name === "picture") return SKIP;
        if (node.name === "img") node.data = { ...node.data, _mdxExplicitJsx: false };
        return;
      }
      if (node.type !== "html" || !parent || index === undefined) return;
      if (/<picture\b/i.test(node.value)) return;
      const nodes = [];
      let last = 0;
      for (const match of node.value.matchAll(/<img\b[^>]*>/gi)) {
        const src = attr(match[0], "src");
        if (!src || !(src.startsWith(".") || isOnImageOrigin(src))) continue;
        if (match.index > last)
          nodes.push({ type: "html", value: node.value.slice(last, match.index) });
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
      const replacement =
        parent.type === "root" && onlyImages ? [{ type: "paragraph", children: nodes }] : nodes;
      parent.children.splice(index, 1, ...replacement);
      return [SKIP, index + replacement.length];
    });
  };
}

// Give each <dt> a slug id so glossary terms can be linked to.
function rehypeDefinitionListIds() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "dt") {
        const text = node.children
          .map((child) => {
            if (child.type === "text") return child.value;
            if (child.type === "element" && child.children) {
              return child.children
                .map((grandChild) => (grandChild.type === "text" ? grandChild.value : ""))
                .join("");
            }
            return "";
          })
          .join("")
          .trim();

        if (text) {
          const slug = text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .trim();

          node.properties = {
            ...node.properties,
            id: slug,
          };
        }
      }
    });
  };
}

// Open external links in a new tab, and add the data-* attributes prose styles key on.
function rehypeExternalLinks() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "a" && node.properties?.href) {
        const href = node.properties.href;

        if (typeof href === "string") {
          if (
            href.startsWith("http://") ||
            href.startsWith("https://") ||
            href.startsWith("mailto:")
          ) {
            node.properties = {
              ...node.properties,
              target: "_blank",
              "data-external": "true",
              rel: "noopener noreferrer",
            };
          }
          if (href.startsWith("/resources/")) {
            node.properties = {
              ...node.properties,
              "data-resource": "true",
            };
          }
          if (href.startsWith("#")) {
            node.properties = {
              ...node.properties,
              "data-anchor": "true",
            };
          }
        }
      }
    });
  };
}

// Add a Copy button to each code block; Prose.astro wires up the click.
// Its classes are also listed in src/styles/global.css: keep them in sync.
function rehypeCodeBlockCopy() {
  return (tree) => {
    function transformNode(node) {
      if (node.children) {
        node.children = node.children.map((child) => {
          if (child.type === "element" && child.tagName === "pre") {
            const codeNode = child.children?.find(
              (c) => c.type === "element" && c.tagName === "code",
            );

            if (codeNode) {
              const wrapper = {
                type: "element",
                tagName: "div",
                properties: {
                  class: "relative",
                },
                children: [],
              };

              // The click handler copies from the DOM, so formatting is preserved.
              const copyButton = {
                type: "element",
                tagName: "button",
                properties: {
                  type: "button",
                  class:
                    "absolute top-2 right-2 rounded-lg bg-zmoki-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zmoki-indigo-700 focus:outline-none focus:ring-2 focus:ring-zmoki-indigo-500 focus:ring-offset-2 transition-colors duration-200",
                  "data-copy-button": "true",
                  "aria-label": "Copy code to clipboard",
                },
                children: [
                  {
                    type: "text",
                    value: "Copy",
                  },
                ],
              };

              wrapper.children.push(child);
              wrapper.children.push(copyButton);

              return wrapper;
            }
          }

          return transformNode(child);
        });
      }

      return node;
    }

    transformNode(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  site: site.domain,
  // `constrained` makes optimized images responsive by default. Without an image
  // origin, remote images render unoptimized.
  image: {
    layout: "constrained",
    ...(imageHostname ? { remotePatterns: [{ protocol: "https", hostname: imageHostname }] } : {}),
  },
  // Self-hosted at build. Names and CSS variables come from src/design-tokens.mjs;
  // set the provider, weights and subsets here.
  fonts: [
    {
      provider: fontProviders.google(),
      name: fonts.sans.name,
      cssVariable: fonts.sans.variable,
      weights: ["400 700"],
      styles: ["normal", "italic"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: fonts.mono.name,
      cssVariable: fonts.mono.variable,
      weights: ["400 700"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"],
    },
  ],
  server: {
    port: 4321,
  },
  vite: {
    plugins: [tailwindcss()],
    // Never inline bundled scripts into the HTML: the CSP has no 'unsafe-inline'.
    build: { assetsInlineLimit: 0 },
  },
  markdown: {
    // Astro 7's default Sätteri processor doesn't run remark/rehype plugins.
    // Pass plugins to unified() itself (markdown.*Plugins is deprecated); .mdx uses it too.
    processor: unified({
      remarkPlugins: [remarkDefinitionList, remarkImgTags],
      remarkRehype: { handlers: defListHastHandlers },
      rehypePlugins: [rehypeDefinitionListIds, rehypeExternalLinks, rehypeCodeBlockCopy],
    }),
    shikiConfig: {
      // A dark theme for WCAG AA contrast; `catppuccin-latte` fails on several token colors.
      theme: "catppuccin-mocha",
    },
  },
});
