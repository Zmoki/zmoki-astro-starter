/**
 * Single source of truth for everything personal to this site.
 *
 * To spin up a new site from this starter, this is the main file you edit.
 * Most strings below surface in metadata, the layout chrome, and the RSS feed.
 * See SETUP.md for the full checklist.
 */
export const site = {
  /** Production URL, no trailing slash. Also set as `site` in astro.config.mjs. */
  domain: "https://starter.zmoki.xyz",

  /** Short label shown in the header logo and footer copyright. */
  name: "Zmoki Astro Starter",

  /** Default meta + OG description, used on any page that doesn't set its own. */
  description:
    "An AI-native Astro starter for personal and project sites — blog, RSS, analytics, structured data, and OG images, ready to adapt with any AI coding agent.",

  /** Top-nav links (between the logo and the CTA button). Anchors or routes. */
  nav: [
    { label: "SEO", href: "/#seo" },
    { label: "Brand", href: "/#brand" },
    { label: "Blog", href: "/blog/" },
    { label: "SEO Checklist", href: "/resources/new-website-seo-checklist/" },
  ],

  /**
   * The site owner / publishing entity. Site-wide identity (per-page), as
   * opposed to a post's byline author, which lives per-post in the blog
   * collection (see src/content.config.ts). Shown in the footer copyright and
   * used as the image-credit creator on post images.
   */
  organization: {
    /** Shown in the footer copyright and as the content-image credit. */
    name: "Zarema Khalilova",
    /** Personal/company site. */
    url: "https://zmoki.xyz",
  },

  contact: {
    /** Shown in the Contact sidebar panel; also the mailto: target. */
    email: "hey@zmoki.xyz",
  },

  social: {
    /** "GitHub" link in the footer. */
    github: "https://github.com/Zmoki/zmoki-astro-starter",
  },

  /** Copyright / content-licensing settings. */
  copyright: {
    /** First year shown in the footer copyright range. */
    year: 2026,
    /** Content-image licensing (schema.org ImageObject emitted for each image). */
    images: {
      /**
       * License URL for content images — the `license` + `acquireLicensePage`
       * on each image's schema.org ImageObject. Point it at your terms /
       * licensing page. Absolute URL.
       */
      license: "https://starter.zmoki.xyz/legal/terms/",
    },
  },

  /** Hosting config — both decoupled and committed (see SETUP.md §6, /images skill). */
  platform: {
    /**
     * Deploy host — selects the redirect/header artifact format:
     *   "cloudflare" | "netlify" → public/_redirects + public/_headers
     *   "vercel"                 → vercel.json · "amplify" → redirects.json + customHeaders.json
     */
    deploy: "cloudflare",
    /**
     * Remote origin for content-image originals (e.g. an R2 bucket on a custom
     * domain). Images on it are optimized at build and served by the deploy host;
     * also the CSP img-src source. A full URL, or "" to keep images in src/images.
     */
    imagesCDNHost: "https://images.zmoki.xyz",
  },
} as const;
