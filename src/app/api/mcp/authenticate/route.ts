import { NextRequest, NextResponse } from 'next/server'
import { mcpClient } from '@/lib/mcp-client'
import { ApiResponse } from '@/types/broker'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { broker, ...credentials } = body

    if (!broker) {
      return NextResponse.json(
        { success: false, error: 'broker is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    const data = await mcpClient.authenticateBroker(broker, credentials)
    const response: ApiResponse = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 401 })
  }
}
