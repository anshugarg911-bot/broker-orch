import { connectDB } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/encryption'
import { ApiKey } from '@/models/ApiKey'
import { clearAnthropicKeyCache } from '@/lib/api-keys'

export async function GET() {
  try {
    await connectDB()
    const keys = await ApiKey.find({}, { type: 1, updatedAt: 1, encryptedData: 1, iv: 1, authTag: 1 })

    const result = keys.map((k) => {
      let preview = ''
      try {
        const decrypted = JSON.parse(decrypt(k.encryptedData, k.iv, k.authTag))
        const val = decrypted.apiKey || decrypted.access_token || decrypted.jwt_token || ''
        if (val.length > 14) preview = val.slice(0, 10) + '...' + val.slice(-4)
        else preview = '****'
      } catch {
        preview = '****'
      }
      return { type: k.type, isSet: true, preview, updatedAt: k.updatedAt }
    })

    return Response.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, error: msg, timestamp: new Date().toISOString() }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const { type, data } = (await request.json()) as { type: string; data: Record<string, string> }

    if (!type || !data) {
      return Response.json(
        { success: false, error: 'type and data are required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    const { encryptedData, iv, authTag } = encrypt(JSON.stringify(data))

    await ApiKey.findOneAndUpdate(
      { type },
      { encryptedData, iv, authTag },
      { upsert: true, new: true }
    )

    if (type === 'anthropic') clearAnthropicKeyCache()

    return Response.json({ success: true, timestamp: new Date().toISOString() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, error: msg, timestamp: new Date().toISOString() }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB()
    const { type } = (await request.json()) as { type: string }

    if (!type) {
      return Response.json(
        { success: false, error: 'type is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    await ApiKey.deleteOne({ type })
    if (type === 'anthropic') clearAnthropicKeyCache()

    return Response.json({ success: true, timestamp: new Date().toISOString() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, error: msg, timestamp: new Date().toISOString() }, { status: 500 })
  }
}
