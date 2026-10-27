import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";

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
    // The post's author, by id in src/content/people/: the byline, author bio,
    // schema.org author and OG card. A typo fails the build.
    author: reference("people"),
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

// One record per person, referenced by id from other entries (a post's `author`),
// so a name, role or bio is written once. See src/lib/people.ts.
const people = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/people" }),
  schema: z.object({
    name: z.string(),
    /** Their title alone, e.g. "Founder". */
    role: z.string(),
    company: z.string().optional(),
    /** Their own site. */
    url: z.url().optional(),
    /** A short first-person blurb: the author box under posts and the profile page. */
    bio: z.string().optional(),
    /** A photo: a full URL on the image origin or another host. */
    image: z.object({ src: z.string(), alt: z.string().min(1) }).optional(),
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
};
