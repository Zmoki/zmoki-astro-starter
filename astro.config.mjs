import { defineConfig, fontProviders } from "astro/config";
import { loadEnv } from "vite";
import { fonts } from "./src/design-tokens.mjs";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import remarkDefinitionList from "remark-definition-list";
import { defListHastHandlers } from "remark-definition-list";
import { visit } from "unist-util-visit";

// Image-CDN base host (decoupled from the deploy host), read via Vite's loadEnv.
// Used to authorize the CDN domain for Astro's built-in image optimization so
// that plain Markdown images (`![alt](https://<cdn-base>/key.jpg)`) get
// downloaded + optimized + made responsive at build. Deliberate images (the post
// cover, <Image>/<ContentImage>) instead go through the CDN's own transform URLs
// at runtime — see src/image.config.ts. Unset ⇒ no remote domain is authorized.
const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "PUBLIC_");
const imageCdnBase = (env.PUBLIC_IMAGE_CDN_HOST || "").replace(/\/+$/, "");
const imageCdnHost = imageCdnBase ? new URL(imageCdnBase).hostname : "";

// Rehype plugin to add IDs to definition list terms
function rehypeDefinitionListIds() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "dt") {
        // Generate slug from term text
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

          // Add ID to the definition term
          node.properties = {
            ...node.properties,
            id: slug,
          };
        }
      }
    });
  };
}

// Rehype plugin to add target="_blank" to external links
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
              rel: "noopener noreferrer", // Security best practice for external links
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

// Rehype plugin to add copy button to code blocks
function rehypeCodeBlockCopy() {
  return (tree) => {
    // Recursive function to transform the tree
    function transformNode(node) {
      // Transform children first
      if (node.children) {
        node.children = node.children.map((child) => {
          // Check if this child is a <pre> element with a <code> child
          if (child.type === "element" && child.tagName === "pre") {
            const codeNode = child.children?.find(
              (c) => c.type === "element" && c.tagName === "code",
            );

            if (codeNode) {
              // Create wrapper div
              const wrapper = {
                type: "element",
                tagName: "div",
                properties: {
                  class: "relative",
                },
                children: [],
              };

              // Create copy button
              // Code will be extracted from DOM at runtime to preserve all formatting
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

              // Add <pre> and button to wrapper
              wrapper.children.push(child);
              wrapper.children.push(copyButton);

              return wrapper;
            }
          }

          // Recursively transform other nodes
          return transformNode(child);
        });
      }

      return node;
    }

    // Transform the tree
    transformNode(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  site: "https://starter.zmoki.xyz",
  // Image optimization. `layout: "constrained"` makes every optimized image
  // (astro:assets <Image> and Markdown `![]()`) responsive with a srcset and
  // zero-CLS sizing by default. `remotePatterns` authorizes the configured image
  // CDN's own domain so plain Markdown images hosted there are downloaded +
  // optimized + made responsive at build (deliberate images — the cover,
  // <Image>/<ContentImage> — instead use the CDN's runtime transform URLs; see
  // src/image.config.ts). No CDN configured ⇒ no remote domain authorized.
  image: {
    layout: "constrained",
    ...(imageCdnHost ? { remotePatterns: [{ protocol: "https", hostname: imageCdnHost }] } : {}),
  },
  // Self-hosted fonts via Astro's Fonts API: downloaded + subsetted at build,
  // served same-origin from /_astro/fonts, with automatic optimized fallback
  // metrics (zero CLS) and preload links. The site is all-sans — a body/heading
  // sans (weights 400–700 incl. italic) and a monospace for code. The family
  // names + CSS variables are the single source in src/design-tokens.mjs; only
  // the provider / weights / styles / subsets are set here.
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
  },
  markdown: {
    // Astro 7 defaults to the Sätteri processor; opt back into the unified
    // (remark/rehype) pipeline so the custom plugins below keep working.
    processor: unified(),
    shikiConfig: {
      // Dark theme: light tokens on a dark background clear WCAG AA (the light
      // `catppuccin-latte` failed contrast on several token colors).
      theme: "catppuccin-mocha",
    },
    remarkPlugins: [remarkDefinitionList],
    remarkRehype: { handlers: defListHastHandlers },
    rehypePlugins: [rehypeDefinitionListIds, rehypeExternalLinks, rehypeCodeBlockCopy],
  },
});
