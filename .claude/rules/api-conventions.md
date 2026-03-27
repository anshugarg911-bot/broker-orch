# API Conventions

## MCP Bridge Routes
All MCP calls go through `/api/mcp/*` routes — never call MCP directly from the client.

### Route Structure
```
/api/mcp/brokers          GET  — list brokers + auth status
/api/mcp/authenticate     POST — authenticate a broker
/api/mcp/portfolio        GET  — holdings for specific broker
/api/mcp/portfolio/consolidated  GET — all brokers combined
/api/mcp/positions        GET  — positions (broker param optional)
/api/mcp/margins          GET  — margin data
```

## Request/Response Format
```typescript
// Standard API response wrapper
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}
```

## MCP Client Usage
```typescript
import { mcpClient } from '@/lib/mcp-client'
const result = await mcpClient.callTool('get_portfolio', { broker: 'kite' })
```

## Error Handling
- MCP errors → 502 Bad Gateway
- Auth failures → 401 Unauthorized
- Not found → 404
- Validation → 400 with field details
