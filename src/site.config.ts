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
  description: "A website for Zmoki Astro Starter — posts, projects, and resources",

  /** og:site_name and the RSS feed title. */
  ogSiteName: "Zmoki Astro Starter",

  /** RSS feed description. */
  feedDescription: "Posts and guides about building your site with the Zmoki Astro Starter.",

  /** Top-nav links (between the logo and the CTA button). Anchors or routes. */
  nav: [
    { label: "Features", href: "/#features" },
    { label: "Brand", href: "/#brand" },
    { label: "Blog", href: "/blog/" },
    { label: "SEO Checklist", href: "/resources/new-website-seo-checklist/" },
  ],

  /** Primary call to action — reused by the nav button and the hero button. */
  cta: {
    label: "Get started",
    href: "https://github.com/Zmoki/zmoki-website-starter",
  },

  /** Home-page hero — the headline and subhead at the top of the landing page. */
  hero: {
    heading: "A website starter your AI can make its own.",
    subhead:
      "An Astro starter for personal and project sites — landing page, blog, RSS, analytics, and email forms already wired. It ships with AGENTS.md, so Claude Code, Codex, Cursor, or any AI coding agent understands the codebase and rebrands it for you.",
  },

  /** Closing CTA band at the bottom of the home page. */
  finalCta: {
    heading: "Ready to get started?",
    text: "Grab the template, tell your AI agent what you want, and deploy.",
    button: {
      label: "Use this template",
      href: "https://github.com/Zmoki/zmoki-website-starter",
    },
  },

  author: {
    /** Shown in the post author bio and the footer copyright. */
    name: "Zarema Khalilova",
    /** Personal website — linked from the footer copyright. */
    url: "https://zmoki.xyz",
    /** Feed slug the author name links to (an "about me" post). */
    aboutSlug: "1-set-up-your-site",
  },

  contact: {
    /** Shown in the Contact sidebar panel; also the mailto: target. */
    email: "hey@zmoki.xyz",
  },

  social: {
    /** "GitHub" link in the footer. */
    sourceRepo: "https://github.com/Zmoki/zmoki-website-starter",
  },

  /** First year shown in the footer copyright range. */
  copyrightStartYear: 2026,

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
