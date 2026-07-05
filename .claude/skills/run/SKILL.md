---
description: Launch the Astro dev server and verify it is working
---

# Run

Astro dev server. No build step needed for local verification.

## Prerequisites

No `.env` file is required — see `src/env.d.ts`.

### Worktree setup

If running inside a git worktree (i.e. `$PWD` is not the primary repo), install dependencies first — `node_modules` is not shared across worktrees:

```bash
npm install
```

## Run

Analytics and captcha are off under `astro dev` automatically (they only activate on the host's real production build of `main` — see `src/lib/deploy.ts`), so dev traffic never reaches PostHog. To force one on for testing, prefix the start command with `PUBLIC_ANALYTICS_ENABLED=true` or `PUBLIC_CAPTCHA_ENABLED=true`.

Derive a stable port from the working directory so multiple worktrees can run simultaneously without conflict:

```bash
PORT=$(( 4300 + $(echo "$PWD" | cksum | cut -d' ' -f1) % 100 ))
```

Start the dev server in the background:

```bash
npm run dev -- --port $PORT &> /tmp/astro-dev.log &
ZMOKI_PID=$!
```

Wait for it to be ready and verify via the health endpoint:

```bash
for i in {1..20}; do
  curl -sf http://localhost:$PORT/-/astro/health > /dev/null && break
  sleep 1
done
curl -s http://localhost:$PORT/-/astro/health
# → ok
# → <short commit hash>
```

**Do not open a browser or take a screenshot.**

Once healthy, report to the user in plain text: `Server running at http://localhost:$PORT`

Logs are at `/tmp/astro-dev.log`. Stop with:

```bash
kill $ZMOKI_PID
# or, if the PID is lost — kills only what's on this port:
lsof -ti :$PORT | xargs kill
```

## Key routes to check

| Route                                   | What it tests                             |
| --------------------------------------- | ----------------------------------------- |
| `http://localhost:$PORT/-/astro/health` | Health check — returns "ok" + commit hash |
| `http://localhost:$PORT/`               | Home — landing page                       |
| `http://localhost:$PORT/blog/`          | Blog list                                 |
| `http://localhost:$PORT/blog/<slug>/`   | Individual post (PostLayout)              |
| `http://localhost:$PORT/rss.xml`        | RSS feed                                  |
| `http://localhost:$PORT/-/astro/brand/` | Brand / design-system reference           |
