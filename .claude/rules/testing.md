# Testing Rules — Broker Orch

## Framework
- Use Vitest for unit tests, Playwright for E2E
- Place tests in `__tests__/` directories or alongside source files

## MCP Testing
- Mock the MCP bridge responses, never call real broker APIs in tests
- Test API routes with mock MCP responses for each broker (Kite, Dhan)
- Verify error handling when bridge is unreachable (502 responses)

## Component Testing
- Test data rendering with mock broker data
- Test loading and error states
- Test broker switching behavior in the UI

## What to Test
- API route request validation and error responses
- Zustand store actions and state transitions
- Data normalization from raw broker formats to common types
- Auth flow for each broker type
