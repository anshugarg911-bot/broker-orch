import { connectDB } from '@/lib/db'
import { decrypt } from '@/lib/encryption'
import { ApiKey } from '@/models/ApiKey'

let cachedAnthropicKey: { key: string; fetchedAt: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getAnthropicKey(): Promise<string> {
  // Check in-memory cache first
  if (cachedAnthropicKey && Date.now() - cachedAnthropicKey.fetchedAt < CACHE_TTL) {
    return cachedAnthropicKey.key
  }

  // Try MongoDB
  try {
    await connectDB()
    const entry = await ApiKey.findOne({ type: 'anthropic' })
    if (entry) {
      const decrypted = JSON.parse(decrypt(entry.encryptedData, entry.iv, entry.authTag))
      const key = decrypted.apiKey
      cachedAnthropicKey = { key, fetchedAt: Date.now() }
      return key
    }
  } catch {
    // Fall through to env var
  }

  // Fallback to env var
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY
  }

  throw new Error('Anthropic API key not configured. Add it in Settings.')
}

export function clearAnthropicKeyCache() {
  cachedAnthropicKey = null
}
