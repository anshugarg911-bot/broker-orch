import { NextResponse } from 'next/server'
import { mcpClient } from '@/lib/mcp-client'
import { ApiResponse } from '@/types/broker'

export async function GET() {
  try {
    const data = await mcpClient.getConsolidatedPortfolio()
    const response: ApiResponse = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch consolidated portfolio',
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 502 })
  }
}
