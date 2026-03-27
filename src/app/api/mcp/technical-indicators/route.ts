import { mcpClient } from '@/lib/mcp-client'
import { getAnalysisBroker } from '@/lib/broker-priority'
import type { TechnicalIndicators } from '@/types/holdings-analysis'

function normalizeIndicators(raw: Record<string, unknown>, lastPrice: number): TechnicalIndicators {
  const rsiData = raw.rsi ?? raw.RSI
  const macdData = raw.macd ?? raw.MACD
  const bollingerData = raw.bollinger ?? raw.bollingerBands ?? raw.BOLLINGER

  // RSI
  let rsiValue = 50
  if (Array.isArray(rsiData)) {
    rsiValue = rsiData[rsiData.length - 1] ?? 50
  } else if (typeof rsiData === 'number') {
    rsiValue = rsiData
  } else if (rsiData && typeof rsiData === 'object' && 'value' in rsiData) {
    rsiValue = (rsiData as { value: number }).value
  }

  const rsiSignal = rsiValue < 30 ? 'oversold' : rsiValue > 70 ? 'overbought' : 'neutral'

  // MACD
  let macdLine = 0
  let signalLine = 0
  let histogram = 0

  if (macdData && typeof macdData === 'object') {
    const m = macdData as Record<string, unknown>
    if (Array.isArray(m.macdLine)) {
      macdLine = m.macdLine[m.macdLine.length - 1] ?? 0
    } else if (typeof m.macdLine === 'number') {
      macdLine = m.macdLine
    }
    if (Array.isArray(m.signalLine)) {
      signalLine = m.signalLine[m.signalLine.length - 1] ?? 0
    } else if (typeof m.signalLine === 'number') {
      signalLine = m.signalLine
    }
    if (Array.isArray(m.histogram)) {
      histogram = m.histogram[m.histogram.length - 1] ?? 0
    } else if (typeof m.histogram === 'number') {
      histogram = m.histogram
    }
  }

  const macdSignal = histogram > 0 ? 'bullish' : histogram < 0 ? 'bearish' : 'neutral'

  // Bollinger Bands
  let upper = 0
  let middle = 0
  let lower = 0

  if (bollingerData && typeof bollingerData === 'object') {
    const b = bollingerData as Record<string, unknown>
    if (Array.isArray(b.upperBand)) {
      upper = b.upperBand[b.upperBand.length - 1] ?? 0
    } else if (typeof b.upperBand === 'number') {
      upper = b.upperBand
    }
    if (Array.isArray(b.middleBand)) {
      middle = b.middleBand[b.middleBand.length - 1] ?? 0
    } else if (typeof b.middleBand === 'number') {
      middle = b.middleBand
    }
    if (Array.isArray(b.lowerBand)) {
      lower = b.lowerBand[b.lowerBand.length - 1] ?? 0
    } else if (typeof b.lowerBand === 'number') {
      lower = b.lowerBand
    }
  }

  const range = upper - lower
  let bollingerPosition: 'near_upper' | 'near_lower' | 'middle' = 'middle'
  if (range > 0) {
    const relativePos = (lastPrice - lower) / range
    if (relativePos > 0.8) bollingerPosition = 'near_upper'
    else if (relativePos < 0.2) bollingerPosition = 'near_lower'
  }

  return {
    rsi: { value: Math.round(rsiValue * 100) / 100, signal: rsiSignal },
    macd: { macdLine, signalLine, histogram, signal: macdSignal },
    bollinger: { upper, middle, lower, lastPrice, position: bollingerPosition },
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const requestedBroker = searchParams.get('broker') || undefined
    const lastPrice = parseFloat(searchParams.get('lastPrice') || '0')

    if (!symbol) {
      return Response.json(
        { success: false, error: 'Symbol is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    // Use best available broker for analysis (Dhan → Groww, skip Kite)
    const broker = await getAnalysisBroker(requestedBroker)

    let result: Record<string, unknown> | null = null

    if (broker) {
      try {
        result = await mcpClient.callTool<Record<string, unknown>>('get_technical_indicators', {
          symbol,
          indicators: ['RSI', 'MACD', 'BOLLINGER'],
          broker,
        })
      } catch {
        // Primary broker failed, try fallback
      }
    }

    // Fallback: try without specifying broker (uses active broker)
    if (!result) {
      result = await mcpClient.callTool<Record<string, unknown>>('get_technical_indicators', {
        symbol,
        indicators: ['RSI', 'MACD', 'BOLLINGER'],
      })
    }

    const data = result?.data ?? result
    const indicators = normalizeIndicators(
      (data && typeof data === 'object' ? data : {}) as Record<string, unknown>,
      lastPrice
    )

    return Response.json({
      success: true,
      data: indicators,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      { success: false, error: message, timestamp: new Date().toISOString() },
      { status: 502 }
    )
  }
}
