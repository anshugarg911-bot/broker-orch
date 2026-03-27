import { mcpClient } from '@/lib/mcp-client'
import { getQuoteBroker } from '@/lib/broker-priority'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get('symbols')
    const requestedBroker = searchParams.get('broker') || undefined

    if (!symbolsParam) {
      return Response.json(
        { success: false, error: 'Symbols parameter is required (comma-separated)', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    // Use best available broker for quotes (Dhan → Kite, Groww has no quotes)
    const broker = await getQuoteBroker(requestedBroker)

    const symbols = symbolsParam.split(',').map((s) => s.trim()).filter(Boolean)
    const result = await mcpClient.getQuote(symbols, broker)

    return Response.json({
      success: true,
      data: result,
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
