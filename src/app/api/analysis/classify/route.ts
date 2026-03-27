import Anthropic from '@anthropic-ai/sdk'
import { getAnthropicKey } from '@/lib/api-keys'
import { connectDB } from '@/lib/db'
import { AnalysisCache } from '@/models/AnalysisCache'

export async function POST(request: Request) {
  try {
    const { symbols } = (await request.json()) as { symbols: string[] }

    if (!symbols?.length) {
      return Response.json(
        { success: false, error: 'Symbols array is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    // Check MongoDB cache first
    await connectDB()
    const cached = await AnalysisCache.find({
      symbol: { $in: symbols },
      type: 'classification',
    }).lean()

    const cachedMap: Record<string, { symbol: string; sector: string; marketCap: string; assetClass: string }> = {}
    for (const c of cached) {
      cachedMap[c.symbol] = c.data as typeof cachedMap[string]
    }

    const uncachedSymbols = symbols.filter((s) => !cachedMap[s])

    // If all cached, return immediately
    if (uncachedSymbols.length === 0) {
      return Response.json({ success: true, data: cachedMap, timestamp: new Date().toISOString() })
    }

    // Call Claude for uncached symbols
    const apiKey = await getAnthropicKey()
    const anthropic = new Anthropic({ apiKey })

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Classify these Indian stock market symbols (NSE/BSE). For each symbol, provide:
- sector: one of [IT, Banking & Finance, Pharma, Healthcare, Auto, FMCG, Energy, Metals & Mining, Infrastructure, Telecom, Real Estate, Insurance, Consumer Durables, Capital Goods, Chemicals, Defence, Retail, Consumer Services, Logistics, Aviation, Textile, Cement, Fintech, E-commerce, Conglomerate, Other]
- marketCap: one of [largeCap, midCap, smallCap, micro]
- assetClass: one of [equity, debt, etf, reit, hybrid, commodity]

Symbols: ${uncachedSymbols.join(', ')}

Respond ONLY with valid JSON object where keys are symbols and values have { sector, marketCap, assetClass }. No explanation.`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json(
        { success: false, error: 'Failed to parse classification', timestamp: new Date().toISOString() },
        { status: 500 }
      )
    }

    const raw = JSON.parse(jsonMatch[0]) as Record<string, { sector: string; marketCap: string; assetClass: string }>

    // Save to MongoDB cache (classifications are permanent)
    const farFuture = new Date('2099-12-31')
    const cacheOps = Object.entries(raw).map(([symbol, data]) => ({
      updateOne: {
        filter: { symbol, type: 'classification' as const },
        update: { symbol, type: 'classification', data: { symbol, ...data }, cachedAt: new Date(), expiresAt: farFuture },
        upsert: true,
      },
    }))
    if (cacheOps.length > 0) await AnalysisCache.bulkWrite(cacheOps)

    // Merge cached + fresh
    const allClassifications = { ...cachedMap }
    for (const [symbol, data] of Object.entries(raw)) {
      allClassifications[symbol] = { symbol, ...data }
    }

    return Response.json({ success: true, data: allClassifications, timestamp: new Date().toISOString() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, error: msg, timestamp: new Date().toISOString() }, { status: 500 })
  }
}
