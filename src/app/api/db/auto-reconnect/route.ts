import { connectDB } from '@/lib/db'
import { decrypt } from '@/lib/encryption'
import { ApiKey } from '@/models/ApiKey'
import { mcpClient } from '@/lib/mcp-client'

const BROKER_TYPES = ['kite', 'dhan', 'groww', 'angelone'] as const

export async function POST() {
  try {
    await connectDB()

    // Find all stored broker credentials
    const storedKeys = await ApiKey.find({ type: { $in: BROKER_TYPES } }).lean()

    if (storedKeys.length === 0) {
      return Response.json({
        success: true,
        data: { reconnected: [], message: 'No saved credentials found' },
        timestamp: new Date().toISOString(),
      })
    }

    const results: { broker: string; status: 'connected' | 'failed'; error?: string }[] = []

    for (const key of storedKeys) {
      try {
        const decrypted = JSON.parse(decrypt(key.encryptedData, key.iv, key.authTag))

        // Authenticate with MCP using stored credentials
        await mcpClient.callTool('authenticate_broker', {
          broker: key.type,
          ...decrypted,
        })

        results.push({ broker: key.type, status: 'connected' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Auth failed'
        results.push({ broker: key.type, status: 'failed', error: msg })
      }
    }

    return Response.json({
      success: true,
      data: { reconnected: results },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      { success: false, error: msg, timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
