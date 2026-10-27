import { defineCollection, reference, z } from "astro:content";
import { file, glob } from "astro/loaders";
import { isOnImageOrigin } from "./lib/image-origin.ts";

// Per-entry <meta name="robots"> directives, e.g. ["noindex"]. noindex also
// drops the page from the sitemap.
const robots = z.array(z.string()).optional();

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    contentModifiedDate: z.coerce.date(),
    // A real photo, not the OG card: the post's hero and the primary image Google
    // Discover reads. Landscape, 16:9, at least 1200px wide, as a full URL.
    // `alt` is required so the primary image is never decorative. See the /images skill.
    cover: z
      .object({
        image: z.string(),
        alt: z.string().min(1),
      })
      .optional(),
    // Set on cross-posted content so search engines credit the original.
    canonical: z.url().optional(),
    // The post's author, by id in src/content/people.yaml: the byline, author bio,
    // schema.org author and OG card. A typo fails the build.
    author: reference("people"),
    // A category id from src/content/blog-categories.yaml: the post card's badge and
    // its archive at /blog/category/{id}/.
    category: reference("blogCategories").optional(),
    // Pins the post to the blog index's hero. If several posts set it, the newest wins.
    featured: z.boolean().default(false),
    robots,
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
        // Id for the site's form provider (Brevo: the sibforms serve id). See src/components/Form.astro.
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
    // The gated file, as a public URL hosted outside the repo. The thank-you page
    // links it too, so delivery doesn't rely on the email alone. Anyone with the
    // URL can download it: this is a lead-magnet gate, not access control.
    asset: z
      .object({
        url: z.string(),
        label: z.string().optional(),
      })
      .optional(),
    robots,
  }),
});

// One record per person, keyed by id in one file and referenced from other entries
// (a post's `author`), so a name, role or bio is written once. A map, not a list:
// a repeated key is a YAML error, where a repeated list id only warns. See src/lib/people.ts.
const people = defineCollection({
  loader: file("src/content/people.yaml"),
  schema: z.object({
    name: z.string(),
    /** Their title alone, e.g. "Founder". */
    role: z.string(),
    company: z.string().optional(),
    /** Their own site. */
    url: z.url().optional(),
    /** A short first-person blurb: the author box under posts and the profile page. */
    bio: z.string().optional(),
    /** A photo, as a full URL on the image origin: the CSP blocks images from other hosts. */
    image: z
      .object({
        src: z.string().refine((src) => isOnImageOrigin(src), {
          message: "must be a full URL on the image origin (site.platform.imagesCDNHost)",
        }),
        alt: z.string().min(1),
      })
      .optional(),
    /** Profiles elsewhere (GitHub, LinkedIn, …), shown on the profile page and as sameAs. */
    socials: z.array(z.object({ label: z.string(), url: z.url() })).optional(),
    /** Turns on /people/{id}/ (with its sitemap entry and OG card). */
    profile: z
      .object({
        description: z.string(),
        publishDate: z.coerce.date(),
        contentModifiedDate: z.coerce.date(),
        robots,
      })
      .optional(),
  }),
});

// A taxonomy: one keyed yaml file, referenced from posts, so a category has a label,
// a description and an archive page, and a misspelled id fails the build. Structural
// switches (a resource's `type`) stay Zod enums.
const blogCategories = defineCollection({
  loader: file("src/content/blog-categories.yaml"),
  schema: z.object({
    label: z.string(),
    /** The archive page's description (meta, OG card, intro). */
    description: z.string(),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    contentModifiedDate: z.coerce.date(),
    robots,
  }),
});

export const collections = {
  blog,
  resources,
  legal,
  people,
  blogCategories,
};
