/**
 * MCP Bridge Server
 * ─────────────────────────────────────────────────────────
 * TurtleStack Lite is a stdio-based MCP server.
 * This bridge spawns it as a child process and exposes
 * an HTTP API on port 3001 so Next.js can talk to it.
 * ─────────────────────────────────────────────────────────
 */

import express from 'express'
import cors from 'cors'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TURTLESTACK_PATH = path.resolve(__dirname, '../../turtlestack-lite/src/index.js')
const PORT = process.env.MCP_BRIDGE_PORT || 3001

const app = express()
app.use(cors())
app.use(express.json())

// ─── MCP Client Setup ────────────────────────────────────
let mcpClient = null

async function connectMCP() {
  console.log(`🔌 Connecting to TurtleStack Lite at: ${TURTLESTACK_PATH}`)

  const transport = new StdioClientTransport({
    command: 'node',
    args: [TURTLESTACK_PATH],
  })

  mcpClient = new Client(
    { name: 'broker-orch-bridge', version: '1.0.0' },
    { capabilities: {} }
  )

  await mcpClient.connect(transport)
  console.log('✅ TurtleStack Lite MCP connected via stdio')
}

// ─── Routes ─────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mcp: mcpClient ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  })
})

// List all available MCP tools
app.get('/tools', async (req, res) => {
  try {
    const result = await mcpClient.listTools()
    res.json({ success: true, tools: result.tools })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Main MCP tool call endpoint (JSON-RPC style)
app.post('/mcp', async (req, res) => {
  if (!mcpClient) {
    return res.status(503).json({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'MCP client not connected' },
    })
  }

  const { method, params, id } = req.body

  try {
    if (method === 'tools/call') {
      const { name, arguments: toolArgs = {} } = params
      console.log(`📞 Tool call: ${name}`, toolArgs)

      const result = await mcpClient.callTool({ name, arguments: toolArgs })

      const parsedData = parseToolResult(result)

      return res.json({
        jsonrpc: '2.0',
        id: id || Date.now(),
        result: { content: [{ type: 'text', text: JSON.stringify(parsedData) }] },
      })
    }

    if (method === 'tools/list') {
      const result = await mcpClient.listTools()
      return res.json({ jsonrpc: '2.0', id, result })
    }

    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32601, message: `Method not supported: ${method}` },
    })
  } catch (err) {
    console.error(`❌ MCP error for ${params?.name}:`, err.message)
    res.status(502).json({
      jsonrpc: '2.0',
      id: id || null,
      error: { code: -32603, message: err.message },
    })
  }
})

// Convenience REST endpoints (used by Next.js API routes)
app.get('/api/brokers', async (req, res) => {
  try {
    const result = await mcpClient.callTool({ name: 'list_brokers', arguments: {} })
    const data = parseToolResult(result)
    res.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message, timestamp: new Date().toISOString() })
  }
})

app.post('/api/authenticate', async (req, res) => {
  try {
    const { broker, ...credentials } = req.body
    const result = await mcpClient.callTool({
      name: 'authenticate_broker',
      arguments: { broker, ...credentials },
    })
    const data = parseToolResult(result)
    res.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(401).json({ success: false, error: err.message, timestamp: new Date().toISOString() })
  }
})

app.get('/api/portfolio', async (req, res) => {
  try {
    const broker = req.query.broker
    const result = await mcpClient.callTool({
      name: 'get_portfolio',
      arguments: broker ? { broker } : {},
    })
    const data = parseToolResult(result)
    res.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message, timestamp: new Date().toISOString() })
  }
})

app.get('/api/portfolio/consolidated', async (req, res) => {
  try {
    const result = await mcpClient.callTool({ name: 'get_consolidated_portfolio', arguments: {} })
    const data = parseToolResult(result)
    res.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message, timestamp: new Date().toISOString() })
  }
})

app.get('/api/positions', async (req, res) => {
  try {
    const broker = req.query.broker
    const result = await mcpClient.callTool({
      name: 'get_positions',
      arguments: broker ? { broker } : {},
    })
    const data = parseToolResult(result)
    res.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message, timestamp: new Date().toISOString() })
  }
})

app.get('/api/margins', async (req, res) => {
  try {
    const broker = req.query.broker
    const result = await mcpClient.callTool({
      name: 'get_margins',
      arguments: broker ? { broker } : {},
    })
    const data = parseToolResult(result)
    res.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message, timestamp: new Date().toISOString() })
  }
})

// ─── Helper ─────────────────────────────────────────────
function parseToolResult(result) {
  if (result?.content?.[0]?.type === 'text') {
    const text = result.content[0].text

    // Try direct JSON parse first
    try {
      return JSON.parse(text)
    } catch { /* fall through */ }

    // TurtleStack returns: "Title:\n\n{...json...}"
    // Extract the JSON object/array from the text
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch { /* fall through */ }
    }

    return text
  }
  return result
}

// ─── Start ───────────────────────────────────────────────
async function start() {
  try {
    await connectMCP()
    app.listen(PORT, () => {
      console.log(`🌉 MCP Bridge running at http://localhost:${PORT}`)
      console.log(`   Health: http://localhost:${PORT}/health`)
      console.log(`   Tools:  http://localhost:${PORT}/tools`)
    })
  } catch (err) {
    console.error('❌ Failed to start MCP Bridge:', err.message)
    process.exit(1)
  }
}

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MCP Bridge...')
  process.exit(0)
})

start()
