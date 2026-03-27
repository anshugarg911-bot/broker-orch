# /project:sync
Manually trigger a full sync of holdings and positions across all authenticated brokers.

## Steps
1. Call `GET /api/mcp/portfolio/consolidated` to refresh holdings
2. Call `GET /api/mcp/positions` to refresh positions
3. Update Zustand store with fresh data
4. Show toast notification with sync summary

## Expected Output
- Total holdings count across all brokers
- Total positions count
- Last synced timestamp
