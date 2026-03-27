# /project:deploy
Build and deploy Broker Orch to Vercel production.

## Steps
1. Run type check: `npm run type-check`
2. Run linter: `npm run lint`
3. Build: `npm run build`
4. Check build output in `.next/`
5. Report any build errors
6. Deploy: `npx vercel --prod`
7. Verify deployment at https://broker-orch.vercel.app

## Deployment Info
- **Vercel project**: anshugarg911-3392s-projects/broker-orch
- **GitHub repo**: anshugarg911-bot/broker-orch
- **Production branch**: `main` (auto-deploys on push)
- **Preview branch**: `master` and all other branches
- **Production URL**: https://broker-orch.vercel.app

## Pre-Deploy Checklist
- [ ] All env vars set in `.env.local`
- [ ] MCP server URL configured
- [ ] No hardcoded credentials
- [ ] Build passes with zero errors

## Note
The MCP Bridge (port 3001) cannot run on Vercel — it requires a persistent process. API routes calling the bridge will fail in production without a hosted MCP backend.
