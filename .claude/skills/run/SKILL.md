---
description: Launch the Astro dev server and verify it is working
---

# Run

Start the Astro dev server. No build or `.env` file is needed (see `src/env.d.ts`).

In a git worktree, run `npm install` first: `node_modules` isn't shared across worktrees.

## Start

Analytics and captcha are off by default. **Before starting, ask the user** whether to enable either for this session (multi-select):

- **Analytics**: sets `PUBLIC_ANALYTICS_ENABLED=true`. Real events go to the configured providers.
- **Captcha**: sets `PUBLIC_CAPTCHA_ENABLED=true`. Turnstile's domain check may reject localhost.

Start on a stable per-worktree port, with the chosen variables (none by default):

```bash
PORT=$(( 4300 + $(echo "$PWD" | cksum | cut -d' ' -f1) % 100 ))

npm run dev -- --port $PORT
# or, with what the user enabled:
PUBLIC_ANALYTICS_ENABLED=true PUBLIC_CAPTCHA_ENABLED=true npm run dev -- --port $PORT
```

From an agent or other non-interactive shell, Astro starts the server in the background and returns. **Read the URL it prints**: if the port is taken it picks another one. Use that URL below.

Check the health endpoint:

```bash
curl -s <url>/-/astro/health
# → an HTML page containing "ok" and the short commit hash
```

**Don't open a browser or take a screenshot.** Once healthy, tell the user: `Server running at <url>`

Manage it with:

```bash
npx astro dev status   # is it running?
npx astro dev logs     # view logs (--follow to stream)
npx astro dev stop     # stop it
```

Never free a port by killing whatever listens on it.

## Key routes

| Route                  | What it tests                   |
| ---------------------- | ------------------------------- |
| `<url>/-/astro/health` | Health: "ok" + commit hash      |
| `<url>/`               | Landing page                    |
| `<url>/blog/`          | Blog list                       |
| `<url>/blog/<slug>/`   | A post (PostLayout)             |
| `<url>/rss.xml`        | RSS feed                        |
| `<url>/-/astro/brand/` | Brand / design-system reference |
