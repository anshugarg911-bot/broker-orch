# Skill: broker-auth

## Trigger
Auto-invoke when:
- User says "connect broker" or "authenticate"
- A broker shows as "disconnected" in the UI
- API returns 401 for a broker

## What This Skill Does
Handles the full authentication flow for Zerodha (Kite) and Dhan brokers through TurtleStack Lite MCP.

## Zerodha Auth Flow
1. User provides `api_key` and `access_token`
2. POST to `/api/mcp/authenticate` with `{ broker: 'kite', api_key, access_token }`
3. MCP calls `authenticate_broker` tool
4. On success: update store `setBrokerStatus('kite', 'connected')`
5. Trigger `sync-holdings` skill

## Dhan Auth Flow
1. User provides `access_token` and `client_id`
2. POST to `/api/mcp/authenticate` with `{ broker: 'dhan', access_token, client_id }`
3. MCP calls `authenticate_broker` tool
4. On success: update store `setBrokerStatus('dhan', 'connected')`
5. Trigger `sync-holdings` skill

## Token Refresh
- Zerodha tokens expire daily — prompt user to re-authenticate each morning
- Dhan tokens are longer-lived but should be refreshed weekly

## Files Involved
- `src/app/api/mcp/authenticate/route.ts`
- `src/store/brokerStore.ts`
- `src/components/BrokerCard.tsx`
- `src/components/AuthDialog.tsx`
