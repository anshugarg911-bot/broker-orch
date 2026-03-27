import type { BrokerHolding } from '@/types/broker'
import type { StockClassification, AssetClass, MarketCapCategory, SplitChartData } from '@/types/holdings-analysis'
import nseData from '@/data/nse-classifications.json'

const classifications = nseData as Record<string, Omit<StockClassification, 'symbol'>>

export function getClassification(symbol: string): StockClassification | null {
  const clean = symbol.replace(/-EQ$/, '').replace(/-BE$/, '').toUpperCase()
  const data = classifications[clean]
  if (!data) return null
  return { symbol: clean, ...data }
}

export function classifyHoldings(
  holdings: BrokerHolding[],
  cache?: Record<string, StockClassification>
): { classified: Map<string, StockClassification>; unknown: string[] } {
  const classified = new Map<string, StockClassification>()
  const unknown: string[] = []

  for (const h of holdings) {
    const symbol = h.tradingSymbol.replace(/-EQ$/, '').replace(/-BE$/, '').toUpperCase()

    // Check static data first
    const staticResult = getClassification(symbol)
    if (staticResult) {
      classified.set(symbol, staticResult)
      continue
    }

    // Check cache (Claude-classified)
    if (cache?.[symbol]) {
      classified.set(symbol, cache[symbol])
      continue
    }

    // Unknown — needs Claude classification
    unknown.push(symbol)
    // Default fallback until classified
    classified.set(symbol, {
      symbol,
      sector: 'Other',
      marketCap: 'smallCap',
      assetClass: 'equity',
    })
  }

  return { classified, unknown }
}

export function computeAssetClassSplit(
  holdings: BrokerHolding[],
  classificationMap: Map<string, StockClassification>
): SplitChartData[] {
  const groups = new Map<AssetClass, { value: number; count: number }>()
  let totalValue = 0

  for (const h of holdings) {
    const symbol = h.tradingSymbol.replace(/-EQ$/, '').replace(/-BE$/, '').toUpperCase()
    const cls = classificationMap.get(symbol)
    const assetClass = cls?.assetClass ?? 'equity'
    const existing = groups.get(assetClass) ?? { value: 0, count: 0 }
    existing.value += h.currentValue
    existing.count += 1
    groups.set(assetClass, existing)
    totalValue += h.currentValue
  }

  const labels: Record<AssetClass, string> = {
    equity: 'Equity',
    debt: 'Debt',
    etf: 'ETF',
    reit: 'REIT',
    hybrid: 'Hybrid',
    commodity: 'Commodity',
  }

  return Array.from(groups.entries())
    .map(([key, { value, count }]) => ({
      name: labels[key] ?? key,
      value,
      count,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
}

export function computeMarketCapSplit(
  holdings: BrokerHolding[],
  classificationMap: Map<string, StockClassification>
): SplitChartData[] {
  const groups = new Map<MarketCapCategory, { value: number; count: number }>()
  let totalValue = 0

  for (const h of holdings) {
    const symbol = h.tradingSymbol.replace(/-EQ$/, '').replace(/-BE$/, '').toUpperCase()
    const cls = classificationMap.get(symbol)
    const cap = cls?.marketCap ?? 'smallCap'
    const existing = groups.get(cap) ?? { value: 0, count: 0 }
    existing.value += h.currentValue
    existing.count += 1
    groups.set(cap, existing)
    totalValue += h.currentValue
  }

  const labels: Record<MarketCapCategory, string> = {
    largeCap: 'Large Cap',
    midCap: 'Mid Cap',
    smallCap: 'Small Cap',
    micro: 'Micro Cap',
  }

  const order: MarketCapCategory[] = ['largeCap', 'midCap', 'smallCap', 'micro']

  return order
    .filter((key) => groups.has(key))
    .map((key) => {
      const { value, count } = groups.get(key)!
      return {
        name: labels[key],
        value,
        count,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      }
    })
}

export function computeSectorSplit(
  holdings: BrokerHolding[],
  classificationMap: Map<string, StockClassification>
): SplitChartData[] {
  const groups = new Map<string, { value: number; count: number }>()
  let totalValue = 0

  for (const h of holdings) {
    const symbol = h.tradingSymbol.replace(/-EQ$/, '').replace(/-BE$/, '').toUpperCase()
    const cls = classificationMap.get(symbol)
    const sector = cls?.sector ?? 'Other'
    const existing = groups.get(sector) ?? { value: 0, count: 0 }
    existing.value += h.currentValue
    existing.count += 1
    groups.set(sector, existing)
    totalValue += h.currentValue
  }

  return Array.from(groups.entries())
    .map(([sector, { value, count }]) => ({
      name: sector,
      value,
      count,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
}
