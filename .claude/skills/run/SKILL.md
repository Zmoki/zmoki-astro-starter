---
description: Launch the Astro dev server and verify it is working
---

# Run

Astro dev server. No build step needed for local verification.

## Prerequisites

`.env` file must exist at the project root. See `src/env.d.ts` for all variables; `.env.example` has the full list with empty values.

### Worktree setup

If running inside a git worktree (i.e. `$PWD` is not the primary repo), two extra steps are needed before starting:

1. **Copy `.env` from the primary repo** — worktrees don't share the root `.env`:

   ```bash
   PRIMARY=$(git rev-parse --path-format=absolute --git-common-dir | sed 's|/.git||')
   cp "$PRIMARY/.env" .env
   ```

2. **Install dependencies** — `node_modules` is not shared across worktrees:
   ```bash
   npm install
   ```

## Run

**Before starting, use the `AskUserQuestion` tool to ask:**

```
question: "Do you want analytics enabled for this session?"
header: "Analytics"
options:
  - label: "Disabled"
    description: "Set PUBLIC_ANALYTICS_ENABLED=false — keeps dev traffic out of PostHog"
  - label: "Enabled"
    description: "Real events will be sent to PostHog"
```

Use the answer to pick the correct start command below.

Derive a stable port from the working directory so multiple worktrees can run simultaneously without conflict:

```bash
PORT=$(( 4300 + $(echo "$PWD" | cksum | cut -d' ' -f1) % 100 ))
```

Start the dev server in the background:

```bash
# analytics enabled (default):
npm run dev -- --port $PORT &> /tmp/astro-dev.log &
ZMOKI_PID=$!

# analytics disabled:
PUBLIC_ANALYTICS_ENABLED=false npm run dev -- --port $PORT &> /tmp/astro-dev.log &
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
