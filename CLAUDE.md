# Broker Orch — Claude Instructions

## Project Overview
Broker Orch is a multi-broker trading dashboard connecting Zerodha (Kite) and Dhan accounts via the TurtleStack Lite MCP. It displays consolidated holdings, live intraday positions, and portfolio analytics.

## Architecture
- **Frontend**: Next.js 16 App Router + TypeScript + React 19
- **UI**: Tailwind CSS v4 + shadcn/ui (base-ui/react primitives)
- **State**: Zustand (`src/store/brokerStore.ts`, `src/store/holdingsAnalysisStore.ts`)
- **MCP Bridge**: `scripts/mcp-bridge.mjs` — Express HTTP server on port 3001 that spawns TurtleStack Lite via stdio and exposes REST + JSON-RPC
- **MCP Server**: TurtleStack Lite (stdio-based) spawned as child process by the bridge
- **Next.js API Routes**: `src/app/api/mcp/*` → call bridge at `http://localhost:3001`
- **AI Analysis**: Claude Opus via `@anthropic-ai/sdk` for fundamental health, AI analyst personas, and stock classification
- **Database**: MongoDB Atlas via Mongoose — encrypted API keys, portfolio snapshots, analysis cache
- **Encryption**: AES-256-GCM for API key storage (src/lib/encryption.ts)

## How MCP Works (Critical)
TurtleStack Lite is a **stdio MCP server**, NOT an HTTP server.
The bridge solves this by acting as a translator:
```
Browser → Next.js API route → mcp-client.ts → Bridge :3001 → TurtleStack stdio → Broker APIs
```

## Starting the App
```bash
npm run dev:all          # ← USE THIS (starts bridge + Next.js together)
bash scripts/start-dev.sh  # same thing via shell
```

## Key Directories
- `src/app/` — Next.js pages and API routes
- `src/app/api/analysis/` — Claude Opus AI analysis routes (classify, fundamental-health, ai-analyst)
- `src/components/holdings/` — Hedge fund analysis components (splits, panels, charts)
- `src/components/` — Reusable UI components
- `src/data/` — Static data files (nse-classifications.json)
- `src/lib/` — MCP client, broker utilities, helpers, classifications
- `src/store/` — Zustand state management
- `src/types/` — TypeScript type definitions
- `.claude/` — Claude configuration, skills, rules, commands

## MCP Tools Used
| Tool | Purpose |
|------|---------|
| `authenticate_broker` | Auth Zerodha/Dhan |
| `list_brokers` | Get broker status |
| `get_portfolio` | Holdings per broker |
| `get_consolidated_portfolio` | All holdings merged |
| `get_positions` | Live intraday positions |
| `get_margins` | Account margins |
| `compare_portfolios` | Side-by-side comparison |

## Broker Auth
- **Zerodha (Kite)**: `api_key` + `access_token`
- **Dhan**: `access_token` + `client_id`
- **Groww**: `jwt_token`
Credentials stored in `.env.local` (gitignored), never hardcoded.

## AI Analysis Auth
- **Anthropic API Key**: Configurable via Settings page UI → encrypted with AES-256-GCM → stored in MongoDB Atlas
- Server-side retrieval via `getAnthropicKey()` in `src/lib/api-keys.ts` — client never sees the key after saving
- Falls back to `ANTHROPIC_API_KEY` env var if not in MongoDB

## MongoDB Collections
- `api_keys` — encrypted API keys (Anthropic, broker credentials)
- `portfolio_snapshots` — historical portfolio data saved on each sync
- `analysis_cache` — AI analysis results with TTL (24h for analysis, permanent for classifications)
- `user_config` — key-value user settings

## Env Vars Required
- `MONGODB_URI` — MongoDB Atlas connection string
- `ENCRYPTION_KEY` — 64-char hex string for AES-256-GCM (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `MCP_SERVER_URL` — MCP bridge endpoint (default: http://localhost:3001)

## Code Standards
- See `.claude/rules/code-style.md`
- See `.claude/rules/api-conventions.md`
- See `.claude/rules/broker-integration.md`

## Deployment
- **GitHub**: https://github.com/anshugarg911-bot/broker-orch
- **Vercel**: https://broker-orch.vercel.app
- **Production branch**: `main` (auto-deploys to production)
- **Preview branches**: `master` and all others (preview URLs only)
- **Known limitation**: MCP Bridge (port 3001) requires a persistent process and cannot run on Vercel. Production needs a hosted MCP backend solution.

## Commands
- `/project:dev` — Start development server
- `/project:add-broker` — Add a new broker integration
- `/project:sync` — Sync holdings and positions
- `/project:deploy` — Build and deploy to Vercel

## After Every Improvement
1. Update this `CLAUDE.md` if architecture changes
2. Update relevant skill `SKILL.md` files
3. Update rules if new patterns emerge

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
