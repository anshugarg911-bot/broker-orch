import Anthropic from '@anthropic-ai/sdk'
import { mcpClient } from '@/lib/mcp-client'
import { getAnthropicKey } from '@/lib/api-keys'
import { getAnalysisBroker, getQuoteBroker } from '@/lib/broker-priority'
import { connectDB } from '@/lib/db'
import { AnalysisCache } from '@/models/AnalysisCache'
import type { AnalystPersona } from '@/types/holdings-analysis'

interface AnalystRequest {
  symbol: string
  exchange: string
  broker?: string
  currentPrice: number
  avgPrice: number
  pnl: number
  pnlPercent: number
  quantity: number
  currentValue: number
}

const PERSONA_PROMPTS: Record<AnalystPersona, { name: string; system: string }> = {
  warren_buffett: {
    name: 'Warren Buffett',
    system: `You are Warren Buffett analyzing an Indian stock. Focus on:
- Economic moat and competitive advantages
- Management quality and capital allocation
- Intrinsic value vs current price
- Long-term business fundamentals
- Whether this is a "wonderful company at a fair price"
Be honest and direct. If the stock doesn't meet your criteria, say so.`,
  },
  michael_burry: {
    name: 'Michael Burry',
    system: `You are Michael Burry analyzing an Indian stock. Focus on:
- Contrarian signals — is the market overvaluing or undervaluing this?
- Hidden risks the market is ignoring
- Balance sheet deep dive — debt levels, cash burn
- Sector-level systemic risks
- Whether this is a short candidate or deep value opportunity
Be skeptical and look for what others miss.`,
  },
  technical_analyst: {
    name: 'Technical Analyst',
    system: `You are a quantitative technical analyst analyzing an Indian stock. Focus on:
- Price trend (uptrend, downtrend, sideways)
- Key support and resistance levels
- Volume patterns and momentum
- Moving average signals (golden cross, death cross)
- RSI, MACD interpretation
Base your analysis on typical price behavior patterns for this stock.`,
  },
  fundamental_analyst: {
    name: 'Fundamental Analyst',
    system: `You are a fundamental equity research analyst analyzing an Indian stock. Focus on:
- Valuation ratios (P/E, P/B, EV/EBITDA) relative to sector peers
- Revenue and earnings growth trajectory
- Margin expansion or compression
- Return on equity and capital efficiency
- Fair value estimate and margin of safety
Provide a data-driven, objective analysis.`,
  },
}

export async function POST(request: Request) {
  try {
    const apiKey = await getAnthropicKey()
    const anthropic = new Anthropic({ apiKey })
    const body = (await request.json()) as AnalystRequest

    if (!body.symbol) {
      return Response.json(
        { success: false, error: 'Symbol is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    // Check MongoDB cache
    await connectDB()
    const cached = await AnalysisCache.findOne({ symbol: body.symbol, type: 'analyst' }).lean()
    if (cached) {
      const encoder = new TextEncoder()
      const cachedSignals = (cached.data as { signals: unknown[] }).signals || []
      const stream = new ReadableStream({
        start(controller) {
          for (const signal of cachedSignals) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(signal)}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        },
      })
      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
      })
    }

    const encoder = new TextEncoder()
    const personas: AnalystPersona[] = ['warren_buffett', 'michael_burry', 'technical_analyst', 'fundamental_analyst']
    const allSignals: unknown[] = []

    // Fetch live data using best available brokers
    let liveDataContext = ''
    try {
      const [analysisBroker, quoteBroker] = await Promise.all([
        getAnalysisBroker(body.broker),
        getQuoteBroker(body.broker),
      ])

      const [quoteResult, technicalResult] = await Promise.allSettled([
        mcpClient.getQuote([body.symbol], quoteBroker),
        mcpClient.getTechnicalIndicators(body.symbol, ['RSI', 'MACD', 'BOLLINGER'], analysisBroker),
      ])
      if (quoteResult.status === 'fulfilled' && quoteResult.value) {
        liveDataContext += `\nLive Market Data:\n${JSON.stringify(quoteResult.value, null, 2)}`
      }
      if (technicalResult.status === 'fulfilled' && technicalResult.value) {
        liveDataContext += `\nTechnical Indicators:\n${JSON.stringify(technicalResult.value, null, 2)}`
      }
    } catch {
      // Continue without live data
    }

    const stream = new ReadableStream({
      async start(controller) {
        for (const persona of personas) {
          try {
            const config = PERSONA_PROMPTS[persona]

            const message = await anthropic.messages.create({
              model: 'claude-opus-4-6',
              max_tokens: 512,
              system: config.system,
              messages: [
                {
                  role: 'user',
                  content: `Analyze "${body.symbol}" (${body.exchange}).
Current price: ₹${body.currentPrice.toFixed(2)}
Average buy price: ₹${body.avgPrice.toFixed(2)}
P&L: ₹${body.pnl.toFixed(2)} (${body.pnlPercent.toFixed(1)}%)
Quantity held: ${body.quantity}
Position value: ₹${body.currentValue.toFixed(2)}
${liveDataContext}

Respond ONLY with valid JSON:
{
  "signal": "bullish" | "bearish" | "neutral",
  "confidence": <number 0-100>,
  "reasoning": "<2-3 sentence reasoning>"
}`,
                },
              ],
            })

            const text = message.content[0].type === 'text' ? message.content[0].text : ''
            const jsonMatch = text.match(/\{[\s\S]*?\}/)

            let signal = 'neutral'
            let confidence = 50
            let reasoning = 'Unable to parse analysis.'

            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0])
              signal = parsed.signal ?? 'neutral'
              confidence = parsed.confidence ?? 50
              reasoning = parsed.reasoning ?? 'No reasoning provided.'
            }

            const event = {
              persona,
              displayName: config.name,
              signal,
              confidence,
              reasoning,
            }

            allSignals.push(event)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
          } catch {
            const fallback = {
              persona,
              displayName: PERSONA_PROMPTS[persona].name,
              signal: 'neutral',
              confidence: 0,
              reasoning: 'Analysis failed. Please try again.',
            }
            allSignals.push(fallback)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(fallback)}\n\n`))
          }
        }

        // Cache results for 24h
        try {
          await AnalysisCache.findOneAndUpdate(
            { symbol: body.symbol, type: 'analyst' },
            { symbol: body.symbol, type: 'analyst', data: { signals: allSignals }, cachedAt: new Date(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            { upsert: true }
          )
        } catch {
          // Non-critical
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      { success: false, error: msg, timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
