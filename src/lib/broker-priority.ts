import { connectDB } from '@/lib/db'
import { ApiKey } from '@/models/ApiKey'

// Priority order for analysis data: Dhan (best) → Groww (backup) → Kite (no analysis data)
const ANALYSIS_PRIORITY = ['dhan', 'groww'] as const
const QUOTE_PRIORITY = ['dhan', 'kite'] as const

/**
 * Get the best available broker for analysis (historical data + indicators).
 * Dhan has 11 indicators + OHLCV. Groww has 5 indicators + OHLCV. Kite has none.
 */
export async function getAnalysisBroker(preferredBroker?: string): Promise<string | undefined> {
  if (preferredBroker && ANALYSIS_PRIORITY.includes(preferredBroker as typeof ANALYSIS_PRIORITY[number])) {
    return preferredBroker
  }

  try {
    await connectDB()
    const storedKeys = await ApiKey.find(
      { type: { $in: [...ANALYSIS_PRIORITY] } },
      { type: 1 }
    ).lean()

    const connected = new Set(storedKeys.map((k) => k.type))

    for (const broker of ANALYSIS_PRIORITY) {
      if (connected.has(broker)) return broker
    }
  } catch {
    // Fall through
  }

  return preferredBroker || undefined
}

/**
 * Get the best available broker for live quotes.
 * Dhan has quotes + live feed. Kite has quotes. Groww has none.
 */
export async function getQuoteBroker(preferredBroker?: string): Promise<string | undefined> {
  if (preferredBroker && QUOTE_PRIORITY.includes(preferredBroker as typeof QUOTE_PRIORITY[number])) {
    return preferredBroker
  }

  try {
    await connectDB()
    const storedKeys = await ApiKey.find(
      { type: { $in: [...QUOTE_PRIORITY] } },
      { type: 1 }
    ).lean()

    const connected = new Set(storedKeys.map((k) => k.type))

    for (const broker of QUOTE_PRIORITY) {
      if (connected.has(broker)) return broker
    }
  } catch {
    // Fall through
  }

  return preferredBroker || undefined
}
