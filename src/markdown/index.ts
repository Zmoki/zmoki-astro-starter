import remarkDefinitionList, { defListHastHandlers } from "remark-definition-list";
import { remarkImgTags } from "./remark-img-tags.ts";
import { rehypeCodeBlockCopy } from "./rehype-code-block-copy.ts";
import { rehypeDefinitionListIds } from "./rehype-definition-list-ids.ts";
import { rehypeExternalLinks } from "./rehype-external-links.ts";
import { rehypeTables } from "./rehype-tables.ts";

// The Markdown pipeline for .md and .mdx, passed to unified() in astro.config.mjs.
// Order matters: Astro collects images after our remark plugins, so remarkImgTags's
// images get optimized; rehypeTables and rehypeCodeBlockCopy each wrap their element,
// and neither looks inside the other's wrapper. Tests: `npm test`.
export const markdownPipeline = {
  remarkPlugins: [remarkDefinitionList, remarkImgTags],
  remarkRehype: { handlers: defListHastHandlers },
  rehypePlugins: [rehypeDefinitionListIds, rehypeTables, rehypeExternalLinks, rehypeCodeBlockCopy],
};
