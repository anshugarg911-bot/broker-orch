/**
 * Data Normalizers
 * ─────────────────────────────────────────────────────────
 * TurtleStack Lite returns broker-specific raw data.
 * These functions normalize it into our standard types.
 * ─────────────────────────────────────────────────────────
 */

import { BrokerHolding, BrokerId, Position } from '@/types/broker'

// ─── Extract array from any API response shape ───────────
export function extractArray<T>(data: unknown): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data as T[]

  // Common wrapped shapes from broker APIs
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>
    // Try common keys in order
    for (const key of ['holdings', 'data', 'positions', 'result', 'items', 'records']) {
      if (Array.isArray(obj[key])) return obj[key] as T[]
    }
    // If it has numeric keys it might be array-like
    const values = Object.values(obj)
    if (values.length > 0 && values.every(v => typeof v === 'object')) {
      return values as T[]
    }
  }

  return []
}

// ─── Normalize Dhan Holdings ─────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDhanHolding(raw: any): BrokerHolding {
  const qty = Number(raw.totalQty ?? raw.quantity ?? raw.availableQty ?? 0)
  const avgPrice = Number(raw.avgCostPrice ?? raw.averageTradedPrice ?? raw.avgPrice ?? 0)
  const ltp = Number(raw.lastTradedPrice ?? raw.ltp ?? raw.currentPrice ?? avgPrice)
  const currentValue = qty * ltp
  const investedValue = qty * avgPrice
  const pnl = currentValue - investedValue
  const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0

  return {
    brokerId: 'dhan',
    brokerName: 'Dhan',
    tradingSymbol: raw.tradingSymbol ?? raw.symbol ?? raw.scripName ?? 'UNKNOWN',
    exchange: raw.exchangeSegment ?? raw.exchange ?? 'NSE',
    isin: raw.isin ?? undefined,
    quantity: qty,
    averagePrice: avgPrice,
    lastPrice: ltp,
    pnl,
    pnlPercent,
    currentValue,
    investedValue,
    product: raw.productType ?? raw.product ?? 'CNC',
  }
}

// ─── Normalize Kite/Zerodha Holdings ─────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeKiteHolding(raw: any): BrokerHolding {
  const qty = Number(raw.quantity ?? raw.t1_quantity ?? 0)
  const avgPrice = Number(raw.average_price ?? raw.averagePrice ?? 0)
  const ltp = Number(raw.last_price ?? raw.ltp ?? avgPrice)
  const currentValue = qty * ltp
  const investedValue = qty * avgPrice
  const pnl = Number(raw.pnl ?? currentValue - investedValue)
  const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0

  return {
    brokerId: 'kite',
    brokerName: 'Zerodha',
    tradingSymbol: raw.tradingsymbol ?? raw.tradingSymbol ?? 'UNKNOWN',
    exchange: raw.exchange ?? 'NSE',
    isin: raw.isin ?? undefined,
    quantity: qty,
    averagePrice: avgPrice,
    lastPrice: ltp,
    pnl,
    pnlPercent,
    currentValue,
    investedValue,
    product: raw.product ?? 'CNC',
  }
}

// ─── Normalize any holding to BrokerHolding ──────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeHolding(raw: any, brokerId: BrokerId): BrokerHolding {
  // If already normalized (has our fields), just ensure brokerId is set
  if (raw.brokerId && raw.tradingSymbol && typeof raw.pnl === 'number') {
    return { ...raw, brokerId, brokerName: getBrokerName(brokerId) }
  }

  // TurtleStack pre-formatted output uses `symbol` field
  if (raw.symbol && !raw.tradingSymbol && !raw.tradingsymbol) {
    const qty = Number(raw.quantity ?? 0)
    const avgPrice = Number(raw.avgPrice ?? 0)
    const ltp = Number(raw.currentPrice ?? avgPrice)
    const currentValue = Number(raw.currentValue ?? qty * ltp)
    const investedValue = Number(raw.investedValue ?? qty * avgPrice)
    const pnl = Number(raw.pnl ?? currentValue - investedValue)
    const pnlPercent = Number(raw.pnlPercent ?? (investedValue > 0 ? (pnl / investedValue) * 100 : 0))
    return {
      brokerId,
      brokerName: getBrokerName(brokerId),
      tradingSymbol: raw.symbol,
      exchange: raw.exchange ?? 'NSE',
      isin: raw.isin ?? undefined,
      quantity: qty,
      averagePrice: avgPrice,
      lastPrice: ltp,
      pnl,
      pnlPercent,
      currentValue,
      investedValue,
      product: raw.product ?? 'CNC',
    }
  }

  switch (brokerId) {
    case 'dhan':   return normalizeDhanHolding(raw)
    case 'kite':   return normalizeKiteHolding(raw)
    default:       return normalizeDhanHolding(raw) // fallback
  }
}

// ─── Normalize Dhan Position ─────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDhanPosition(raw: any): Position {
  const qty = Number(raw.netQty ?? raw.quantity ?? 0)
  const avgPrice = Number(raw.costPrice ?? raw.averagePrice ?? 0)
  const ltp = Number(raw.lastTradedPrice ?? raw.ltp ?? avgPrice)
  const pnl = Number(raw.unrealizedProfit ?? raw.pnl ?? (qty * (ltp - avgPrice)))
  const pnlPercent = avgPrice > 0 ? ((ltp - avgPrice) / avgPrice) * 100 : 0

  return {
    brokerId: 'dhan',
    brokerName: 'Dhan',
    tradingSymbol: raw.tradingSymbol ?? raw.symbol ?? 'UNKNOWN',
    exchange: raw.exchangeSegment ?? raw.exchange ?? 'NSE',
    product: raw.productType ?? raw.product ?? 'INTRADAY',
    quantity: qty,
    averagePrice: avgPrice,
    lastPrice: ltp,
    pnl,
    pnlPercent,
    buyQuantity: Number(raw.buyQty ?? 0),
    sellQuantity: Number(raw.sellQty ?? 0),
    buyValue: Number(raw.buyAvg ?? 0) * Number(raw.buyQty ?? 0),
    sellValue: Number(raw.sellAvg ?? 0) * Number(raw.sellQty ?? 0),
  }
}

// ─── Normalize Kite Position ─────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeKitePosition(raw: any): Position {
  const qty = Number(raw.quantity ?? raw.net_quantity ?? 0)
  const avgPrice = Number(raw.average_price ?? raw.averagePrice ?? 0)
  const ltp = Number(raw.last_price ?? raw.ltp ?? avgPrice)
  const pnl = Number(raw.pnl ?? raw.unrealised ?? 0)
  const pnlPercent = avgPrice > 0 ? ((ltp - avgPrice) / avgPrice) * 100 : 0

  return {
    brokerId: 'kite',
    brokerName: 'Zerodha',
    tradingSymbol: raw.tradingsymbol ?? raw.tradingSymbol ?? 'UNKNOWN',
    exchange: raw.exchange ?? 'NSE',
    product: raw.product ?? 'MIS',
    quantity: qty,
    averagePrice: avgPrice,
    lastPrice: ltp,
    pnl,
    pnlPercent,
    buyQuantity: Number(raw.buy_quantity ?? 0),
    sellQuantity: Number(raw.sell_quantity ?? 0),
    buyValue: Number(raw.buy_value ?? 0),
    sellValue: Number(raw.sell_value ?? 0),
  }
}

// ─── Normalize any position ──────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePosition(raw: any, brokerId: BrokerId): Position {
  if (raw.brokerId && raw.tradingSymbol && typeof raw.pnl === 'number') {
    return { ...raw, brokerId, brokerName: getBrokerName(brokerId) }
  }

  switch (brokerId) {
    case 'dhan': return normalizeDhanPosition(raw)
    case 'kite': return normalizeKitePosition(raw)
    default:     return normalizeDhanPosition(raw)
  }
}

// ─── Normalize full portfolio response ───────────────────
export function normalizePortfolioResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  brokerId: BrokerId
): BrokerHolding[] {
  const rawArray = extractArray<Record<string, unknown>>(data)
  return rawArray
    .filter(Boolean)
    .map((item) => normalizeHolding(item, brokerId))
}

// ─── Normalize positions response ────────────────────────
export function normalizePositionsResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  brokerId: BrokerId
): Position[] {
  // Kite returns { net: [], day: [] }
  if (data?.net && Array.isArray(data.net)) {
    return data.net.map((item: unknown) => normalizePosition(item, brokerId))
  }
  const rawArray = extractArray<Record<string, unknown>>(data)
  return rawArray
    .filter(Boolean)
    .map((item) => normalizePosition(item, brokerId))
}

// ─── Helpers ─────────────────────────────────────────────
export function getBrokerName(brokerId: BrokerId): string {
  const names: Record<BrokerId, string> = {
    kite: 'Zerodha',
    dhan: 'Dhan',
    groww: 'Groww',
    angelone: 'AngelOne',
  }
  return names[brokerId] ?? brokerId
}
