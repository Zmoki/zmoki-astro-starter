import rss from "@astrojs/rss";
import { getCollection, type CollectionEntry } from "astro:content";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";
import { site } from "@/site.config";

// Configure markdown-it to allow HTML (needed for our converted components)
const parser = new MarkdownIt({
  html: true, // Enable HTML tags in source
  linkify: true, // Automatically convert URLs to links
  breaks: true, // Convert '\n' in paragraphs into <br>
});

/**
 * Strips import statements from MDX content
 */
function stripImports(content: string): string {
  // Remove import statements (single line imports)
  let processed = content.replace(/^import\s+.*?from\s+["'][^"']+["'];?\s*$/gm, "");

  // Also handle multi-line imports if any
  processed = processed.replace(/^import\s+.*?from\s+["'][^"']+["'];?\s*$/gm, "");

  return processed.trim();
}

/**
 * Converts relative URLs to absolute URLs in HTML content
 */
function convertRelativeUrlsToAbsolute(html: string, siteUrl: string): string {
  // Convert relative URLs in href attributes
  html = html.replace(/href=["'](\/[^"']+)["']/g, (match, path) => {
    return `href="${siteUrl}${path}"`;
  });

  // Convert relative URLs in src attributes
  html = html.replace(/src=["'](\/[^"']+)["']/g, (match, path) => {
    return `src="${siteUrl}${path}"`;
  });

  return html;
}

/**
 * Converts MDX components to HTML for RSS feed
 * Handles <Image> and <Video> components using regex parsing
 */
function convertMdxComponentsToHtml(content: string, _siteUrl: string, _postSlug: string): string {
  let processed = content;

  // First, handle <figure> tags with Image components - process them as a unit
  // This needs to happen before individual Image processing
  // Remove captions since images aren't displayed in RSS, only alt text
  processed = processed.replace(
    /<figure[^>]*>[\s\S]*?<Image\s+([^>]+)\s*\/?>[\s\S]*?<figcaption[^>]*>([\s\S]*?)<\/figcaption>[\s\S]*?<\/figure>/g,
    (match, imageAttrs) => {
      const altMatch = imageAttrs.match(/alt=["']([^"']+)["']/);
      const alt = altMatch ? altMatch[1] : "Image";

      // Just show the image placeholder, no caption (since images aren't displayed in RSS)
      return `<p><em>[Image: ${alt}]</em></p>`;
    },
  );

  // Convert standalone <Image> components (not in figures) to placeholders
  processed = processed.replace(/<Image\s+([^>]+)\s*\/?>/g, (match, attrs) => {
    const altMatch = attrs.match(/alt=["']([^"']+)["']/);
    const alt = altMatch ? altMatch[1] : "Image";

    // Create a placeholder for the image
    return `<p><em>[Image: ${alt}]</em></p>`;
  });

  // Convert <Video> components to <video> tags
  // Note: RSS validators prefer simpler video tags without controls/poster
  // Matches: <Video src="..." poster="..." width="..." height="..." />
  processed = processed.replace(/<Video\s+([^>]+)\s*\/?>/g, (match, attrs) => {
    // Extract attributes
    const srcMatch = attrs.match(/src=["']([^"']+)["']/);
    const widthMatch = attrs.match(/width=["']?(\d+)["']?/);
    const heightMatch = attrs.match(/height=["']?(\d+)["']?/);

    const src = srcMatch ? srcMatch[1] : "";
    const width = widthMatch ? widthMatch[1] : "";
    const height = heightMatch ? heightMatch[1] : "";

    if (!src) return "";

    // Build video tag - simplified for RSS compatibility
    // Remove controls and poster attributes as validators prefer simpler tags
    let videoTag = `<video`;
    if (width) videoTag += ` width="${width}"`;
    if (height) videoTag += ` height="${height}"`;
    videoTag += `><source src="${src}" type="video/mp4" />Your browser does not support the video tag.</video>`;

    return videoTag;
  });

  return processed;
}

export async function GET(context: { site: string | undefined }) {
  // Ensure siteUrl is always a string
  const siteUrl = String(context.site || site.domain);

  // Get all posts from the feed collection
  const allPosts: CollectionEntry<"blog">[] = await getCollection("blog");

  // Sort posts by publishDate (newest first, matching the site's ordering)
  const sortedPosts = allPosts.sort(
    (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime(),
  );

  // Render and sanitize each post's content
  const items = await Promise.all(
    sortedPosts.map(async (post: CollectionEntry<"blog">) => {
      // First, strip import statements
      let processedContent = stripImports(post.body);

      // Then convert MDX components to HTML
      processedContent = convertMdxComponentsToHtml(processedContent, siteUrl, post.slug);

      // Then render the Markdown to HTML using markdown-it
      let contentHtml = parser.render(processedContent);

      // Convert relative URLs to absolute URLs for RSS compatibility
      contentHtml = convertRelativeUrlsToAbsolute(contentHtml, siteUrl);

      // Use the OG image for this post (already generated for each post)
      // This follows the pattern from https://webreaper.dev/posts/astro-rss-feed-blog-post-images/
      // Ensure no double slashes in URL
      const ogImagePath = `og-images/blog/${post.slug}/wide.jpg`;
      const baseUrl = String(siteUrl).replace(/\/$/, "");
      const ogImageUrl = `${baseUrl}/${ogImagePath}`;

      // Remove any remaining figcaption tags (captions are redundant since images aren't displayed)
      contentHtml = contentHtml.replace(/<figcaption[^>]*>[\s\S]*?<\/figcaption>/gi, "");
      // Also remove empty figure tags
      contentHtml = contentHtml.replace(/<figure[^>]*>\s*<\/figure>/gi, "");

      // Sanitize the HTML to ensure safe RSS output
      // Allow video tags and their attributes (simplified for RSS compatibility)
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
          video: [
            "width",
            "height",
            // Removed controls and poster for RSS validator compatibility
          ],
          source: ["src", "type"],
          img: ["src", "alt", "width", "height", "loading", "class"],
        },
      });

      // Build customData for media namespace (RSS image support)
      // Following the pattern from https://webreaper.dev/posts/astro-rss-feed-blog-post-images/
      const imageType = ogImageUrl.endsWith(".jpg") ? "jpeg" : "png";
      const customData = `<media:content
        type="image/${imageType}"
        medium="image"
        url="${ogImageUrl}" />`;

      return {
        title: post.data.title,
        description: post.data.description,
        link: `/blog/${post.slug}/`,
        pubDate: post.data.publishDate,
        content: sanitizedContent,
        customData: customData,
      };
    }),
  );

  return rss({
    title: site.ogSiteName,
    description: site.feedDescription,
    site: siteUrl,
    // Add media and atom namespaces for better RSS compatibility
    xmlns: {
      media: "http://search.yahoo.com/mrss/",
      atom: "http://www.w3.org/2005/Atom",
    },
    // Add atom:link for better interoperability
    customData: `<atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />`,
    items: items,
  });
}
