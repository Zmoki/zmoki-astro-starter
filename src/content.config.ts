import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z
    .object({
      order: z.number(),
      title: z.string(),
      description: z.string(),
      publishDate: z.coerce.date(),
      contentModifiedDate: z.coerce.date(),
      // Optional cover image — a real, non-text photograph (NOT the branded OG
      // card). Rendered as the post's hero (LCP) and used as the schema.org
      // BlogPosting.image + the image-sitemap entry, which is what Google Discover
      // reads to pick a page's primary image. For Discover, use a well-cropped
      // landscape ≥1200px wide at 16:9. Use a **full URL** (e.g.
      // "https://images.example.com/x.jpg"): a bare key ("x.jpg") only resolves
      // when `site.imageOrigin` is set, and would fail a build without it. Set
      // `coverAlt` too (enforced below). Optimized at build (see src/image.config.ts).
      // Posts without a cover fall back to the OG card for schema.image.
      cover: z.string().optional(),
      /** Alt text for `cover` — describes the hero/primary image for a11y + SEO. */
      coverAlt: z.string().optional(),
      // Optional canonical URL. Set this when the post republishes content whose
      // canonical source lives elsewhere (e.g. cross-posted from another site) so
      // search engines credit the original. Drives <link rel="canonical"> and the
      // schema.org BlogPosting `mainEntityOfPage`. Omit for original content.
      canonical: z.url().optional(),
      // Per-post byline author. Drives the post header credit, the "Written by"
      // bio, the schema.org BlogPosting author, and the OG card credit.
      author: z.object({
        name: z.string(),
        /** The author's site — linked from the byline. */
        url: z.string(),
        /** Short first-person blurb shown in the post's author bio. */
        bio: z.string(),
      }),
    })
    // A cover is the post's LCP + Discover primary image, so it must not be
    // decorative: require descriptive alt text whenever a cover is set.
    .refine((data) => !data.cover || (data.coverAlt?.trim().length ?? 0) > 0, {
      message: "coverAlt is required (non-empty) when cover is set.",
      path: ["coverAlt"],
    }),
});

const resources = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/resources" }),
  schema: z.object({
    type: z.enum(["page", "link"]),
    name: z.string(),
    title: z.string(),
    description: z.string(),
    url: z.string().optional(),
    publishDate: z.coerce.date(),
    contentModifiedDate: z.coerce.date(),
    order: z.number(),
    form: z
      .object({
        // Provider-neutral form id, rendered by the site-wide form provider
        // (built-in: Brevo → the sibforms serve id). See src/components/Form.astro.
        formId: z.string(),
        buttonText: z.string(),
        title: z.string(),
        description: z.string(),
      })
      .optional(),
    platform: z
      .object({
        name: z.string(),
        title: z.string(),
        description: z.string(),
      })
      .optional(),
    // The gated deliverable, as a public URL — host the file externally (R2, S3,
    // a CDN/bucket, Brevo's own hosting…) rather than committing binaries to the
    // repo. Surfaced as a direct download on the thank-you page so delivery does
    // not depend solely on the Brevo email. Note: a public URL is reachable by
    // anyone who has it — this is a lead-magnet gate, not access control.
    asset: z
      .object({
        url: z.string(),
        label: z.string().optional(),
      })
      .optional(),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    contentModifiedDate: z.coerce.date(),
  }),
});

export const collections = {
  blog,
  resources,
  legal,
};
