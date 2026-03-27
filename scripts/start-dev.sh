#!/bin/bash
# ─────────────────────────────────────────────────────────
# Broker Orch — Development Startup
# Starts MCP Bridge (TurtleStack Lite) + Next.js together
# ─────────────────────────────────────────────────────────

set -e

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        🎯  Broker Orch  Dev            ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. Current: $(node -v)"
  exit 1
fi

# Check turtlestack-lite exists
TURTLESTACK_PATH="/Users/rgx/Desktop/developer/turtlestack-lite"
if [ ! -d "$TURTLESTACK_PATH" ]; then
  echo "⚠️  TurtleStack Lite not found. Cloning..."
  git clone https://github.com/turtlehq-tech/turtlestack-lite.git "$TURTLESTACK_PATH"
  cd "$TURTLESTACK_PATH" && npm install
  cd - > /dev/null
fi

echo "✅ TurtleStack Lite found at: $TURTLESTACK_PATH"
echo ""
echo "🚀 Starting with: npm run dev:all"
echo "   → MCP Bridge  : http://localhost:3001"
echo "   → Next.js App : http://localhost:3000"
echo ""

npm run dev:all
