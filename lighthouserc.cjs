module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: [
        "http://localhost:4321/",
        "http://localhost:4321/blog/",
        "http://localhost:4321/blog/2-example-post/",
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: {
      // Uploads each report to Google-hosted temporary public storage and
      // prints a public URL (kept ~a few days). The PR comment links to it.
      // See SETUP.md → "Lighthouse report hosting" for other options.
      target: "temporary-public-storage",
    },
  },
};
