# Code Style Rules

## TypeScript
- Always use strict TypeScript — no `any` types
- Define all broker data types in `src/types/`
- Use `interface` for objects, `type` for unions/primitives

## Components
- Functional components only, no class components
- Use explicit prop types via interfaces
- One component per file, named exports preferred
- Files named in PascalCase: `HoldingsTable.tsx`

## Imports
- Use `@/*` alias for all internal imports
- Group: React → Next.js → external → internal → types → styles
- No barrel re-exports unless necessary

## Styling
- Tailwind classes only — no inline styles
- Use `cn()` from `@/lib/utils` for conditional classes
- Follow shadcn/ui patterns for component variants

## Error Handling
- Always wrap MCP calls in try/catch
- Return typed error responses from API routes
- Show user-friendly toast messages for errors

## Naming
- API routes: kebab-case (`/api/mcp/get-portfolio`)
- Zustand actions: camelCase verbs (`fetchHoldings`, `setActiveBroker`)
- Types: PascalCase (`BrokerHolding`, `Position`)
- Constants: SCREAMING_SNAKE_CASE
