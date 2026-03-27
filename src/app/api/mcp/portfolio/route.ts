import { NextRequest, NextResponse } from 'next/server'
import { mcpClient } from '@/lib/mcp-client'
import { ApiResponse } from '@/types/broker'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const broker = searchParams.get('broker') || undefined

    const data = await mcpClient.getPortfolio(broker)
    const response: ApiResponse = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch portfolio',
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 502 })
  }
}
