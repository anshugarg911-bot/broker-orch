# Skill: sync-holdings

## Trigger
Auto-invoke when:
- User says "refresh holdings" or "sync holdings"
- Dashboard mounts for the first time
- User navigates to /holdings page

## What This Skill Does
Fetches consolidated holdings from all authenticated brokers via TurtleStack Lite MCP and updates the Zustand store.

## Steps
1. Call `GET /api/mcp/brokers` to get list of authenticated brokers
2. For each authenticated broker, call `GET /api/mcp/portfolio?broker=<id>`
3. Also call `GET /api/mcp/portfolio/consolidated` for merged view
4. Normalize all responses to `BrokerHolding[]` type
5. Update `brokerStore.setHoldings(data)`
6. Update `lastSyncedAt` timestamp
7. Show success toast with count of holdings synced

## Error Recovery
- If one broker fails, continue with others
- Log failed brokers to store (`failedBrokers[]`)
- Show warning badge on failed broker's card

## Files Involved
- `src/lib/mcp-client.ts`
- `src/store/brokerStore.ts`
- `src/app/api/mcp/portfolio/route.ts`
- `src/components/HoldingsTable.tsx`
