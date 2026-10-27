import rss from "@astrojs/rss";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";
import { site } from "@/site.config";
import { getPostsNewestFirst } from "@/lib/page-collections";
import { isOnImageOrigin, publishedImageUrl } from "@/lib/images";
import { meta as blogIndexMeta } from "@/pages/blog/index.astro";

// HTML must stay enabled for the placeholders convertMdxComponentsToHtml emits.
const parser = new MarkdownIt({
  html: true, // Enable HTML tags in source
  linkify: true, // Automatically convert URLs to links
  breaks: true, // Convert '\n' in paragraphs into <br>
});
// Also link scheme-less URLs such as www.example.com (off by default since linkify-it 6).
parser.linkify.set({ fuzzyLink: true });

/** Strips single-line MDX import statements. */
function stripImports(content: string): string {
  return content.replace(/^import\s+.*?from\s+["'][^"']+["'];?\s*$/gm, "").trim();
}

function convertRelativeUrlsToAbsolute(html: string, siteUrl: string): string {
  html = html.replace(/href=["'](\/[^"']+)["']/g, (match, path) => {
    return `href="${siteUrl}${path}"`;
  });

  html = html.replace(/src=["'](\/[^"']+)["']/g, (match, path) => {
    return `src="${siteUrl}${path}"`;
  });

  return html;
}

// An <img>'s src, quoted either way or unquoted.
const IMG_SRC = /(<img\b[^>]*?\ssrc\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;

/** Points images on the origin at their published renditions. */
async function publishOriginImages(html: string): Promise<string> {
  // markdown-it escapes & in attributes.
  const urlOf = (m: (string | undefined)[]) =>
    (m[2] ?? m[3] ?? m[4] ?? "").replaceAll("&amp;", "&");
  const published = new Map<string, string>();
  for (const match of html.matchAll(IMG_SRC)) {
    const url = urlOf(match);
    if (isOnImageOrigin(url) && !published.has(url))
      published.set(url, await publishedImageUrl(url));
  }
  return html.replace(IMG_SRC, (tag, before: string, ...groups: (string | undefined)[]) => {
    const url = published.get(urlOf([tag, before, ...groups]));
    return url ? `${before}"${url}"` : tag;
  });
}

/**
 * Replaces <Image> components with an "[Image: alt]" placeholder.
 * Regex-based, so it only handles the components this starter ships in posts.
 */
function convertMdxComponentsToHtml(content: string): string {
  let processed = content;

  // Figures first, as a unit, so their captions are dropped too.
  processed = processed.replace(
    /<figure[^>]*>[\s\S]*?<Image\s+([^>]+)\s*\/?>[\s\S]*?<figcaption[^>]*>([\s\S]*?)<\/figcaption>[\s\S]*?<\/figure>/g,
    (match, imageAttrs) => {
      const altMatch = imageAttrs.match(/alt=["']([^"']+)["']/);
      const alt = altMatch ? altMatch[1] : "Image";

      return `<p><em>[Image: ${alt}]</em></p>`;
    },
  );

  // Then standalone images.
  processed = processed.replace(/<Image\s+([^>]+)\s*\/?>/g, (match, attrs) => {
    const altMatch = attrs.match(/alt=["']([^"']+)["']/);
    const alt = altMatch ? altMatch[1] : "Image";

    return `<p><em>[Image: ${alt}]</em></p>`;
  });

  return processed;
}

export async function GET(context: { site: URL | undefined }) {
  // `context.site` is a URL, whose string form ends in "/". Paths below start with "/".
  const siteUrl = String(context.site ?? site.domain).replace(/\/$/, "");

  const sortedPosts = await getPostsNewestFirst();

  const items = await Promise.all(
    sortedPosts.map(async (post) => {
      // Content Layer types `body` as optional.
      let processedContent = stripImports(post.body ?? "");
      processedContent = convertMdxComponentsToHtml(processedContent);
      let contentHtml = parser.render(processedContent);
      contentHtml = convertRelativeUrlsToAbsolute(contentHtml, siteUrl);
      contentHtml = await publishOriginImages(contentHtml);

      // The post's OG card is its feed image.
      const ogImageUrl = `${siteUrl}/og/blog/${post.id}.png`;

      // Drop leftover captions and the empty figures they leave.
      contentHtml = contentHtml.replace(/<figcaption[^>]*>[\s\S]*?<\/figcaption>/gi, "");
      contentHtml = contentHtml.replace(/<figure[^>]*>\s*<\/figure>/gi, "");

      // `video`/`source` stay allowed for raw <video> embeds in MDX.
      const sanitizedContent = sanitizeHtml(contentHtml, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "img",
          "video",
          "source",
          "figure",
          "figcaption",
        ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          video: ["src", "width", "height"],
          source: ["src", "type"],
          img: ["src", "alt", "width", "height", "loading", "class"],
        },
      });

      const customData = `<media:content
        type="image/png"
        medium="image"
        url="${ogImageUrl}" />`;

      return {
        title: post.data.title,
        description: post.data.description,
        link: `/blog/${post.id}/`,
        pubDate: post.data.publishDate,
        content: sanitizedContent,
        customData: customData,
      };
    }),
  );

  return rss({
    title: site.name,
    // The feed is the blog, so it reuses the blog index description.
    description: blogIndexMeta.description,
    site: siteUrl,
    xmlns: {
      media: "http://search.yahoo.com/mrss/",
      atom: "http://www.w3.org/2005/Atom",
    },
    // Self link, which feed validators expect.
    customData: `<atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />`,
    items: items,
  });
}
