# Deploy Skill — Broker Orch

Deploy broker-orch to Vercel production.

## Triggers
- When user requests deployment
- After merging to main branch

## Steps
1. Run `npm run build` to verify production build succeeds
2. Run tests if available
3. Check for uncommitted changes via `git status`
4. Deploy with `npx vercel --prod`
5. Verify deployment is live by checking the production URL
6. Report the deployment URL and build status
