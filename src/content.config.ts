import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    contentModifiedDate: z.coerce.date(),
    // Per-post byline author. Drives the post header credit, the "Written by"
    // bio, the schema.org BlogPosting author, and the OG card credit.
    author: z.object({
      name: z.string(),
      /** The author's site — linked from the byline. */
      url: z.string(),
      /** Short first-person blurb shown in the post's author bio. */
      bio: z.string(),
    }),
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
