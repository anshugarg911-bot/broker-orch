import { mcpClient } from '@/lib/mcp-client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get('symbols')
    const broker = searchParams.get('broker') || undefined

    if (!symbolsParam) {
      return Response.json(
        { success: false, error: 'Symbols parameter is required (comma-separated)', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

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
