# MyMind — Claude Instructions

## Architecture

- **Server**: Node/Express at `server/`, SQLite via better-sqlite3
- **Client**: React (Vite) at `client/src/`
- **Agent**: `server/agent/orchestrator.js` routes to `taskWorker.js` / `kbWorker.js`
- **LLM**: `server/llm/router.js` → real (`claudeAPI.js`) or dummy (`dummyLLM.js`) based on `USE_DUMMY`
- **DB schema**: `server/db/schema.js` — always check field names here before writing UI or query code

## DB Field Reference (critical — mismatches cause silent bugs)

### `knowledge_items` table
- `cluster` — string name (e.g. "App Packages"), NOT `cluster_id`
- `tags` — JSON array stored as string, parsed by `parseKB()`
- `key_points` — JSON array stored as string

### `clusters` table
- `id` — UUID
- `name` — display name, matches `knowledge_items.cluster`

When filtering KB items by cluster, compare `item.cluster === clusterName` (not `item.cluster_id`).

## Known Gotchas

### Page routing (App.jsx ↔ TopNav.jsx)
TopNav emits `'kb'` (not `'knowledge'`) via `onPageChange`. App.jsx must check `activePage === 'kb'`.
Verify both sides match whenever adding a new page.

### kbWorker.handle() — use `body`, not `raw`
After stripping the `/kb ` prefix, the URL/type checks must run on `body`, not `raw`.
`raw` still contains the prefix and will never match `^https?://`.

### Promise.all for independent API calls
If unrelated API calls are batched with `Promise.all`, one failure silently blocks all data.
Fetch critical data (items) separately from secondary data (clusters/counts).

### LLM mode
`USE_DUMMY !== 'false'` — dummy is ON by default. Must explicitly set `USE_DUMMY=false` in env to use real API.
Always add `console.error` logging in async external API calls so errors surface in Railway deploy logs.

## Railway Deployment

- Volume mount: `/data/mymind.db` — set `DB_PATH=/data/mymind.db`
- Required env vars: `PORT`, `NODE_ENV=production`, `USE_DUMMY`, `ANTHROPIC_API_KEY`
- Health check: `GET /api/health` — shows `use_dummy`, `has_api_key`, `db_path`
- Client is built into `client/dist/` and served by Express in production
- After changing env vars, Railway auto-redeploys — wait ~2 min for new deploy to go live

## Before Pushing

1. Run `npm run build` in `client/` and confirm no errors
2. Verify the KB tab loads items (not blank) in local dev
3. Verify the Tasks tab still works after any routing changes
