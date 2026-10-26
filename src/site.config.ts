/**
 * Everything personal to this site: the main file to edit when starting a new
 * site from this starter. See SETUP.md for the full checklist.
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

  /** The site owner. A post's author is set separately, in its frontmatter. */
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
    images: {
      /** Absolute URL of your terms or licensing page, used in each image's schema.org ImageObject. */
      license: "https://starter.zmoki.xyz/legal/terms/",
    },
  },

  /** Hosting (see SETUP.md → "Deploy"). */
  platform: {
    /**
     * Deploy host. Picks the format of the generated redirect and header files:
     *   "cloudflare" | "netlify" → public/_redirects + public/_headers
     *   "vercel"                 → vercel.json
     *   "amplify"                → redirects.json + customHeaders.json
     */
    deploy: "cloudflare",
    /**
     * Where content-image originals live (e.g. an R2 bucket on a custom domain);
     * they're optimized at build. A full URL, or "" to keep images in src/images.
     * See the /images skill.
     */
    imagesCDNHost: "https://images.zmoki.xyz",
  },
} as const;
