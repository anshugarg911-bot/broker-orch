/**
 * MCP Client — bridges Next.js API routes to TurtleStack Lite MCP server
 * TurtleStack Lite runs as a local Node.js process on port 3001
 */

import axios, { AxiosInstance } from 'axios'

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001'

class MCPClient {
  private client: AxiosInstance
  private sessionId: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: MCP_SERVER_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Call any TurtleStack Lite MCP tool by name
   */
  async callTool<T = unknown>(
    toolName: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    try {
      const response = await this.client.post('/mcp', {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params,
          ...(this.sessionId ? { sessionId: this.sessionId } : {}),
        },
      })

      if (response.data?.error) {
        throw new Error(response.data.error.message || 'MCP tool error')
      }

      // Extract session ID from first response
      if (response.data?.result?.sessionId && !this.sessionId) {
        this.sessionId = response.data.result.sessionId
      }

      return response.data?.result?.content?.[0]?.text
        ? JSON.parse(response.data.result.content[0].text)
        : response.data?.result
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`MCP Server Error: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * List all available brokers and their auth status
   */
  async listBrokers() {
    return this.callTool('list_brokers')
  }

  /**
   * Authenticate a broker
   */
  async authenticateBroker(broker: string, credentials: Record<string, string>) {
    return this.callTool('authenticate_broker', { broker, ...credentials })
  }

  /**
   * Get portfolio/holdings for a broker (or active broker)
   */
  async getPortfolio(broker?: string) {
    return this.callTool('get_portfolio', broker ? { broker } : {})
  }

  /**
   * Get consolidated portfolio across all authenticated brokers
   */
  async getConsolidatedPortfolio() {
    return this.callTool('get_consolidated_portfolio')
  }

  /**
   * Get positions for a broker (or active broker)
   */
  async getPositions(broker?: string) {
    return this.callTool('get_positions', broker ? { broker } : {})
  }

  /**
   * Get margins for a broker
   */
  async getMargins(broker?: string) {
    return this.callTool('get_margins', broker ? { broker } : {})
  }

  /**
   * Compare portfolios across brokers
   */
  async comparePortfolios(brokers?: string[]) {
    return this.callTool('compare_portfolios', brokers ? { brokers } : {})
  }

  /**
   * Get live quotes for symbols
   */
  async getQuote(symbols: string[], broker?: string) {
    const symbolObjects = symbols.map((s) => ({ tradingsymbol: s }))
    return this.callTool('get_quote', { symbols: symbolObjects, ...(broker ? { broker } : {}) })
  }

  /**
   * Get technical indicators for a symbol
   */
  async getTechnicalIndicators(symbol: string, indicators: string[] = ['RSI', 'MACD', 'BOLLINGER'], broker?: string) {
    return this.callTool('get_technical_indicators', { symbol, indicators, ...(broker ? { broker } : {}) })
  }

  setSessionId(id: string) {
    this.sessionId = id
  }

  getSessionId() {
    return this.sessionId
  }
}

// Singleton instance
export const mcpClient = new MCPClient()
