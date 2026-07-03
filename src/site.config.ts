/**
 * Single source of truth for everything personal to this site.
 *
 * To spin up a new site from this starter, this is the main file you edit.
 * Most strings below surface in metadata, the layout chrome, and the RSS feed.
 * See SETUP.md for the full checklist.
 */
export const site = {
  /** Production URL, no trailing slash. Also set as `site` in astro.config.mjs. */
  domain: "https://example.com",

  /** Short label shown in the header logo and footer copyright. */
  name: "My Project X",

  /** Default meta + OG description, used on any page that doesn't set its own. */
  description: "A website for My Project X — posts, projects, and resources",

  /** og:site_name and the RSS feed title. */
  ogSiteName: "My Project X",

  /** RSS feed description. */
  feedDescription: "Posts, projects, and resources from My Project X.",

  /** Top-nav links (between the logo and the CTA button). Anchors or routes. */
  nav: [
    { label: "Features", href: "/#features" },
    { label: "Blog", href: "/blog/" },
  ],

  /** Primary call to action — reused by the nav button and the hero button. */
  cta: {
    label: "Get started",
    href: "/#cta",
  },

  /** Home-page hero — the headline and subhead at the top of the landing page. */
  hero: {
    heading: "Build something people want",
    subhead:
      "A one-line pitch for My Project X — what it does and who it's for. Edit it in src/site.config.ts.",
  },

  /** Closing CTA band at the bottom of the home page. */
  finalCta: {
    heading: "Ready to get started?",
    text: "Swap this for your closing pitch, then point the button wherever you need.",
    button: { label: "Get in touch", href: "mailto:hey@example.com" },
  },

  author: {
    /** Shown in the post author bio. */
    name: "Your Name",
    /** Feed slug the author name links to (an "about me" post). */
    aboutSlug: "1-about-me",
  },

  contact: {
    /** Shown in the Contact sidebar panel; also the mailto: target. */
    email: "hey@example.com",
  },

  social: {
    /** "Source Code" link in the footer. */
    sourceRepo: "https://github.com/your-name/your-repo",
  },

  /** First year shown in the footer copyright range. */
  copyrightStartYear: 2025,

  /** Deploy-time settings (hosting). See SETUP.md §6. */
  deploy: {
    /**
     * Hosting target for the redirects build (`npm run build:redirects`).
     * Selects which artifact the CSVs in src/redirects/ compile to:
     *   "cloudflare" | "netlify" → public/_redirects
     *   "vercel"                 → vercel.json (redirects[] merged in)
     *   "amplify"                → redirects.json (paste into the Amplify console/IaC)
     */
    platform: "cloudflare",
  },
} as const;
