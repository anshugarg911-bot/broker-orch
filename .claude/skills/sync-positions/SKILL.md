# Skill: sync-positions

## Trigger
Auto-invoke when:
- User says "refresh positions" or "sync positions"
- User navigates to /positions page
- Every 30 seconds during market hours (9:15 AM - 3:30 PM IST)

## What This Skill Does
Fetches live intraday positions from all authenticated brokers and updates the Zustand store.

## Steps
1. Check if market is currently open (IST timezone)
2. Call `GET /api/mcp/positions` for each authenticated broker
3. Normalize to `Position[]` type
4. Calculate unrealized P&L for each position
5. Update `brokerStore.setPositions(data)`
6. Highlight positions with >2% move in either direction

## Market Hours (IST)
- Pre-market: 9:00 AM - 9:15 AM
- Market open: 9:15 AM - 3:30 PM
- After-hours: 3:30 PM onwards (positions won't update)

## Files Involved
- `src/lib/mcp-client.ts`
- `src/store/brokerStore.ts`
- `src/app/api/mcp/positions/route.ts`
- `src/components/PositionsTable.tsx`
