# Analytics events

Every event the site fires, through `window.track?.(event, props)`. Change this file in the same commit as any event. How tracking works and how to add an event: the `/analytics` skill.

With analytics off (dev, PRs, previews), the console provider logs each call as `[analytics] track …`.

## Site-wide

Delegated from the document in `src/lib/site-events.ts`, so links and buttons in content count too. `location` is the closest ancestor's `data-band` (`header`, `footer`, `content`, or a home section such as `hero`), else `body`.

| Event                   | Fires when                                                                       | Props                                     |
| ----------------------- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| `cta_clicked`           | a link to one of `site.asks` (`src/site.config.ts`) is clicked, wherever it sits | `cta` (the ask's key), `href`, `location` |
| `contact_email_clicked` | a `mailto:` link is clicked                                                      | `email`, `location`                       |
| `code_block_copied`     | a code block's Copy button is clicked                                            | `snippet_length`, `location`              |

## Posts

Fired in `src/layouts/PostLayout.astro`.

| Event                     | Fires when                           | Props                           |
| ------------------------- | ------------------------------------ | ------------------------------- |
| `post_viewed`             | a post loads                         | `post_slug`, `post_title`       |
| `post_navigation_clicked` | the previous or next link is clicked | `direction`, `destination_slug` |

## Resources (the lead-magnet funnel)

`resource_gate_viewed` → `resource_gate_submitted` → `resource_download_confirmed` → `resource_downloaded`.

| Event                         | Fires when                                                    | Props                           | Fired in                              |
| ----------------------------- | ------------------------------------------------------------- | ------------------------------- | ------------------------------------- |
| `resource_gate_viewed`        | half of the gate form is on screen, once (`trackWhenVisible`) | `resource_slug`, `form_id`      | `src/components/forms/brevo.astro`    |
| `resource_gate_submitted`     | the form is submitted, right after `identify(email)`          | `form_id`, `resource_slug`      | `src/components/forms/brevo.astro`    |
| `resource_download_confirmed` | the thank-you page loads                                      | `resource_name`, `resource_url` | `src/pages/thank-you/[...slug].astro` |
| `resource_downloaded`         | the direct download link on the thank-you page is clicked     | `resource_name`, `asset_url`    | `src/pages/thank-you/[...slug].astro` |
