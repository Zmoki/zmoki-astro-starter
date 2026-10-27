import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import type { AstroMarkdownOptions } from "@astrojs/markdown-remark";
import type { Root } from "mdast";

// Shared by the *.test.ts files here: render Markdown through Astro's own processor,
// with only the plugins under test.

type Plugins = Pick<AstroMarkdownOptions, "remarkPlugins" | "rehypePlugins" | "remarkRehype">;

export async function renderMarkdown(markdown: string, plugins: Plugins = {}): Promise<string> {
  const processor = await createMarkdownProcessor({ ...plugins, syntaxHighlight: false });
  return (await processor.render(markdown)).code;
}

/** The mdast tree after the given remark plugins, before HTML. */
export async function markdownTree(
  markdown: string,
  remarkPlugins: NonNullable<Plugins["remarkPlugins"]>,
): Promise<Root> {
  let tree: Root | undefined;
  const capture = () => (root: Root) => {
    tree = structuredClone(root);
  };
  await renderMarkdown(markdown, { remarkPlugins: [...remarkPlugins, capture] });
  return tree!;
}
