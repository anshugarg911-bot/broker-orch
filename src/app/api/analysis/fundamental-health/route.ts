import Anthropic from '@anthropic-ai/sdk'
import { getAnthropicKey } from '@/lib/api-keys'
import { connectDB } from '@/lib/db'
import { AnalysisCache } from '@/models/AnalysisCache'
import { mcpClient } from '@/lib/mcp-client'

async function fetchLiveData(symbol: string, broker?: string) {
  try {
    const [quoteResult, technicalResult] = await Promise.allSettled([
      mcpClient.getQuote([symbol], broker),
      mcpClient.getTechnicalIndicators(symbol, ['RSI', 'MACD', 'BOLLINGER'], broker),
    ])
    return {
      quote: quoteResult.status === 'fulfilled' ? quoteResult.value : null,
      technicals: technicalResult.status === 'fulfilled' ? technicalResult.value : null,
    }
  } catch {
    return { quote: null, technicals: null }
  }
}

export async function POST(request: Request) {
  try {
    const { symbol, exchange, broker, currentPrice, avgPrice, pnl, pnlPercent, quantity, currentValue } = (await request.json()) as {
      symbol: string
      exchange: string
      broker?: string
      currentPrice?: number
      avgPrice?: number
      pnl?: number
      pnlPercent?: number
      quantity?: number
      currentValue?: number
    }

    if (!symbol) {
      return Response.json(
        { success: false, error: 'Symbol is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    // Check MongoDB cache
    await connectDB()
    const cached = await AnalysisCache.findOne({ symbol, type: 'fundamental' }).lean()
    if (cached) {
      return Response.json({ success: true, data: cached.data, fromCache: true, timestamp: new Date().toISOString() })
    }

    // Fetch live data from MCP
    const { quote, technicals } = await fetchLiveData(symbol, broker)

    let liveDataContext = ''
    if (quote) liveDataContext += `\n\nLive Market Data (from broker):\n${JSON.stringify(quote, null, 2)}`
    if (technicals) liveDataContext += `\n\nTechnical Indicators (live):\n${JSON.stringify(technicals, null, 2)}`

    let holdingContext = ''
    if (currentPrice) {
      holdingContext = `\n\nCurrent Holding Data:
- Current Price: ₹${currentPrice}
- Average Buy Price: ₹${avgPrice ?? 'N/A'}
- P&L: ₹${pnl ?? 'N/A'} (${pnlPercent?.toFixed(1) ?? 'N/A'}%)
- Quantity: ${quantity ?? 'N/A'}
- Position Value: ₹${currentValue ?? 'N/A'}`
    }

    const apiKey = await getAnthropicKey()
    const anthropic = new Anthropic({ apiKey })

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze the fundamental health of the Indian stock "${symbol}" listed on ${exchange || 'NSE'}.
${holdingContext}${liveDataContext}

Using the live data above AND your knowledge of this company, rate each category as "Strong", "Moderate", or "Weak":

1. **Profitability** — ROE, operating margins, net profit margins, return on capital
2. **Growth** — Revenue growth, earnings growth, order book growth, market expansion
3. **Financial Health** — Debt-to-equity ratio, current ratio, interest coverage, free cash flow

Also provide:
- An overall score from 1 to 10 (10 being excellent)
- A 2-3 sentence summary incorporating the live market data

Respond ONLY with valid JSON:
{
  "profitability": "Strong" | "Moderate" | "Weak",
  "growth": "Strong" | "Moderate" | "Weak",
  "financialHealth": "Strong" | "Moderate" | "Weak",
  "overallScore": <number 1-10>,
  "summary": "<string>"
}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ success: false, error: 'Failed to parse response', timestamp: new Date().toISOString() }, { status: 500 })
    }

    const data = JSON.parse(jsonMatch[0])

    // Cache for 24h
    await AnalysisCache.findOneAndUpdate(
      { symbol, type: 'fundamental' },
      { symbol, type: 'fundamental', data, cachedAt: new Date(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      { upsert: true }
    )

    return Response.json({ success: true, data, timestamp: new Date().toISOString() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, error: msg, timestamp: new Date().toISOString() }, { status: 500 })
  }
}
