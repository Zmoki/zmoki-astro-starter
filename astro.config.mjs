import { defineConfig, fontProviders } from "astro/config";
import { fonts } from "./src/design-tokens.mjs";
import { site } from "./src/site.config.ts";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import remarkDefinitionList from "remark-definition-list";
import { defListHastHandlers } from "remark-definition-list";
import { visit } from "unist-util-visit";

// The image origin's hostname, authorized for build-time optimization below.
const imagesCDNHost = (site.platform.imagesCDNHost || "").trim().replace(/\/+$/, "");
let imageHostname = "";
if (imagesCDNHost) {
  try {
    imageHostname = new URL(imagesCDNHost).hostname;
  } catch {
    throw new Error(
      `site.platform.imagesCDNHost must be a full URL (e.g. "https://images.example.com") or "": got "${imagesCDNHost}"`,
    );
  }
}

// Treat a raw <img> in content like Markdown `![]()`, so origin images are optimized
// instead of published (the CSP blocks the origin). In .mdx it becomes <MarkdownImage>,
// keeping its attributes. In .md an origin or relative <img> becomes `![]()`, which drops
// attributes other than src, alt and title. See the /images skill.
function remarkImgTags() {
  const attr = (tag, name) =>
    tag
      .match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"))
      ?.slice(1)
      .find((v) => v !== undefined);
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (
        (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
        node.name === "img"
      ) {
        node.name = "MarkdownImage";
        return;
      }
      if (node.type !== "html" || !parent || index === undefined) return;
      const tag = node.value.trim();
      if (!/^<img\b[^>]*>$/i.test(tag)) return;
      const src = attr(tag, "src")?.replaceAll("&amp;", "&");
      if (!src || !(src.startsWith(".") || (imagesCDNHost && src.startsWith(`${imagesCDNHost}/`))))
        return;
      const image = {
        type: "image",
        url: src,
        alt: attr(tag, "alt") ?? "",
        title: attr(tag, "title") ?? null,
      };
      parent.children[index] =
        parent.type === "root" ? { type: "paragraph", children: [image] } : image;
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
