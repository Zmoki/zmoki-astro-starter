import { defineConfig, fontProviders } from "astro/config";
import { fonts } from "./src/design-tokens.mjs";
import { site } from "./src/site.config.ts";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import { IMAGE_ORIGIN } from "./src/lib/image-origin.ts";
import { markdownPipeline } from "./src/markdown/index.ts";

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
    // The plugins and their order: src/markdown/.
    processor: unified(markdownPipeline),
    shikiConfig: {
      // A dark theme for WCAG AA contrast; `catppuccin-latte` fails on several token colors.
      theme: "catppuccin-mocha",
    },
  },
});
