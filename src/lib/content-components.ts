import MarkdownImage from "@/components/MarkdownImage.astro";

// Components every content route passes to <Content components={…} />.
// `img` is what Markdown `![]()` becomes in .mdx, and `MarkdownImage` is what a raw
// <img> becomes (remarkImgTags in astro.config.mjs). MDX would render an origin URL as
// a plain <img>; MarkdownImage optimizes it. (Astro optimizes .md images itself.)
// See the /images skill.
export const contentComponents = { img: MarkdownImage, MarkdownImage };
