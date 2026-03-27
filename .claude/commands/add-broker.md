# /project:add-broker
Add a new broker integration to Broker Orch.

## Steps
1. Ask the user: which broker? (kite/dhan/groww/angelone)
2. Check TurtleStack Lite supports it: review `BaseBroker.js` interface
3. Create `src/lib/brokers/<broker-name>.ts` with typed methods
4. Add broker to Zustand store (`src/store/brokerStore.ts`)
5. Create API route `src/app/api/mcp/<broker-name>/route.ts`
6. Add broker card to `src/components/BrokerCard.tsx`
7. Update `CLAUDE.md` with new broker details
8. Update `.claude/skills/broker-auth/SKILL.md`

## Auth Parameters by Broker
- kite: api_key + access_token
- dhan: access_token + client_id
- groww: jwt_token
- angelone: api_key + client_id + jwt_token
