# Broker Integration Rules

## Adding a New Broker
1. Must extend base types in `src/types/broker.ts`
2. Must implement all methods in `BrokerInterface`
3. Auth credentials ONLY from environment variables
4. Never log credentials, tokens, or client IDs

## Credential Management
- Store in `.env.local` (gitignored)
- Format: `KITE_API_KEY`, `KITE_ACCESS_TOKEN`, `DHAN_ACCESS_TOKEN`, `DHAN_CLIENT_ID`
- Access via `process.env.VAR_NAME` server-side only

## Supported Brokers (TurtleStack Lite)
| Broker | ID | Auth Params |
|--------|----|-------------|
| Zerodha | `kite` | api_key, access_token |
| Dhan | `dhan` | access_token, client_id |
| Groww | `groww` | jwt_token |
| AngelOne | `angelone` | api_key, client_id, jwt_token |

## Data Normalization
All broker data must be normalized to common types before storing in Zustand:
- Holdings → `BrokerHolding[]`
- Positions → `Position[]`
- Margins → `MarginData`
