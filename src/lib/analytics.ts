import type { BrokerHolding } from '@/types/broker'

// ── Types ──────────────────────────────────────────────────────────────────

export interface PortfolioWeight {
  tradingSymbol: string
  exchange: string
  currentValue: number
  weight: number
  pnl: number
  pnlPercent: number
  quantity: number
  averagePrice: number
  lastPrice: number
  investedValue: number
}

export interface RiskMetrics {
  hhi: number
  diversificationScore: number
  maxSingleExposure: number
  maxSingleExposureSymbol: string
  top5Concentration: number
  top10Concentration: number
  estimatedBeta: number
  estimatedSharpe: number
  capitalAtRisk: number
  capitalAtRiskPercent: number
}

export interface PnlMetrics {
  totalPnl: number
  totalPnlPercent: number
  winRate: number
  winners: number
  losers: number
  neutral: number
  avgGain: number
  avgLoss: number
  riskRewardRatio: number
  topGainers: PortfolioWeight[]
  topLosers: PortfolioWeight[]
  pnlDistribution: PnlBucket[]
}

export interface PnlBucket {
  range: string
  count: number
  min: number
  max: number
}

export interface AllocationAlert {
  tradingSymbol: string
  weight: number
  type: 'overweight' | 'underweight'
}

export interface HeatmapCell {
  tradingSymbol: string
  pnlPercent: number
  weight: number
  currentValue: number
  pnl: number
  colorIntensity: number // -1 to 1
}

export interface SummaryStats {
  totalValue: number
  totalInvested: number
  totalPnl: number
  totalPnlPercent: number
  winRate: number
  bestPerformer: { symbol: string; pnlPercent: number }
  worstPerformer: { symbol: string; pnlPercent: number }
  diversificationScore: number
  holdingsCount: number
}

export interface ExchangeBreakdown {
  name: string
  value: number
  count: number
}

// ── Portfolio Weights ──────────────────────────────────────────────────────

export function computePortfolioWeights(holdings: BrokerHolding[]): PortfolioWeight[] {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0)
  if (totalValue === 0) return []

  return holdings.map((h) => ({
    tradingSymbol: h.tradingSymbol,
    exchange: h.exchange,
    currentValue: h.currentValue,
    weight: h.currentValue / totalValue,
    pnl: h.pnl,
    pnlPercent: h.pnlPercent,
    quantity: h.quantity,
    averagePrice: h.averagePrice,
    lastPrice: h.lastPrice,
    investedValue: h.investedValue,
  }))
}

// ── Risk Metrics ───────────────────────────────────────────────────────────

export function computeHHI(weights: PortfolioWeight[]): number {
  return weights.reduce((sum, w) => sum + Math.pow(w.weight * 100, 2), 0)
}

export function computeDiversificationScore(weights: PortfolioWeight[]): number {
  if (weights.length === 0) return 0
  const sumSquaredWeights = weights.reduce((sum, w) => sum + Math.pow(w.weight, 2), 0)
  if (sumSquaredWeights === 0) return 0
  const effectiveN = 1 / sumSquaredWeights
  return Math.min(100, (effectiveN / weights.length) * 100)
}

function estimateBeta(weights: PortfolioWeight[]): number {
  // Heuristic: large cap (>50k value) beta ~1.0, mid (10k-50k) ~1.2, small (<10k) ~1.4
  // Weighted average across portfolio
  if (weights.length === 0) return 1.0
  let weightedBeta = 0
  for (const w of weights) {
    let stockBeta: number
    if (w.currentValue >= 50000) stockBeta = 0.95
    else if (w.currentValue >= 10000) stockBeta = 1.15
    else stockBeta = 1.35
    weightedBeta += w.weight * stockBeta
  }
  return weightedBeta
}

function estimateSharpe(totalPnlPercent: number, holdingsCount: number): number {
  // Simplified Sharpe: (portfolio return - risk free rate) / estimated vol
  const riskFreeRate = 6.5 // India 10y yield approx
  const annualizedReturn = totalPnlPercent // Treat as period return
  const estimatedVol = Math.max(5, 25 - holdingsCount * 0.3) // More holdings = less vol
  return (annualizedReturn - riskFreeRate) / estimatedVol
}

export function computeRiskMetrics(
  weights: PortfolioWeight[],
  totalPnlPercent: number
): RiskMetrics {
  const sorted = [...weights].sort((a, b) => b.weight - a.weight)
  const hhi = computeHHI(weights)
  const diversificationScore = computeDiversificationScore(weights)

  const maxSingle = sorted[0]
  const top5 = sorted.slice(0, 5).reduce((sum, w) => sum + w.weight * 100, 0)
  const top10 = sorted.slice(0, 10).reduce((sum, w) => sum + w.weight * 100, 0)

  const totalValue = weights.reduce((sum, w) => sum + w.currentValue, 0)
  const atRiskHoldings = weights.filter((w) => w.pnlPercent <= -10)
  const capitalAtRisk = atRiskHoldings.reduce((sum, w) => sum + w.currentValue, 0)

  return {
    hhi: Math.round(hhi),
    diversificationScore: Math.round(diversificationScore),
    maxSingleExposure: maxSingle ? maxSingle.weight * 100 : 0,
    maxSingleExposureSymbol: maxSingle ? maxSingle.tradingSymbol : '-',
    top5Concentration: top5,
    top10Concentration: top10,
    estimatedBeta: estimateBeta(weights),
    estimatedSharpe: estimateSharpe(totalPnlPercent, weights.length),
    capitalAtRisk,
    capitalAtRiskPercent: totalValue > 0 ? (capitalAtRisk / totalValue) * 100 : 0,
  }
}

// ── P&L Analysis ───────────────────────────────────────────────────────────

export function computePnlMetrics(weights: PortfolioWeight[]): PnlMetrics {
  const totalInvested = weights.reduce((sum, w) => sum + w.investedValue, 0)
  const totalPnl = weights.reduce((sum, w) => sum + w.pnl, 0)
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0

  const winnersArr = weights.filter((w) => w.pnl > 0)
  const losersArr = weights.filter((w) => w.pnl < 0)
  const neutralArr = weights.filter((w) => w.pnl === 0)

  const winRate = weights.length > 0 ? (winnersArr.length / weights.length) * 100 : 0

  const avgGain =
    winnersArr.length > 0
      ? winnersArr.reduce((sum, w) => sum + w.pnl, 0) / winnersArr.length
      : 0
  const avgLoss =
    losersArr.length > 0
      ? Math.abs(losersArr.reduce((sum, w) => sum + w.pnl, 0) / losersArr.length)
      : 0
  const riskRewardRatio = avgLoss > 0 ? avgGain / avgLoss : avgGain > 0 ? Infinity : 0

  const sortedByPnl = [...weights].sort((a, b) => b.pnl - a.pnl)
  const topGainers = sortedByPnl.filter((w) => w.pnl > 0).slice(0, 5)
  const topLosers = sortedByPnl.filter((w) => w.pnl < 0).reverse().slice(0, 5)

  const pnlDistribution = computePnlDistribution(weights)

  return {
    totalPnl,
    totalPnlPercent,
    winRate,
    winners: winnersArr.length,
    losers: losersArr.length,
    neutral: neutralArr.length,
    avgGain,
    avgLoss,
    riskRewardRatio: riskRewardRatio === Infinity ? 999 : riskRewardRatio,
    topGainers,
    topLosers,
    pnlDistribution,
  }
}

function computePnlDistribution(weights: PortfolioWeight[]): PnlBucket[] {
  const buckets: PnlBucket[] = [
    { range: '< -20%', count: 0, min: -Infinity, max: -20 },
    { range: '-20% to -10%', count: 0, min: -20, max: -10 },
    { range: '-10% to -5%', count: 0, min: -10, max: -5 },
    { range: '-5% to 0%', count: 0, min: -5, max: 0 },
    { range: '0% to 5%', count: 0, min: 0, max: 5 },
    { range: '5% to 10%', count: 0, min: 5, max: 10 },
    { range: '10% to 20%', count: 0, min: 10, max: 20 },
    { range: '> 20%', count: 0, min: 20, max: Infinity },
  ]

  for (const w of weights) {
    for (const b of buckets) {
      if (w.pnlPercent >= b.min && w.pnlPercent < b.max) {
        b.count++
        break
      }
    }
    // Edge case: exactly at max of last bucket
    if (w.pnlPercent >= 20) {
      // Already handled by > 20% bucket with max: Infinity
    }
  }

  return buckets
}

// ── Allocation Analysis ────────────────────────────────────────────────────

export function computeAllocationAlerts(weights: PortfolioWeight[]): AllocationAlert[] {
  const alerts: AllocationAlert[] = []
  for (const w of weights) {
    const pct = w.weight * 100
    if (pct > 10) {
      alerts.push({ tradingSymbol: w.tradingSymbol, weight: pct, type: 'overweight' })
    } else if (pct < 0.5) {
      alerts.push({ tradingSymbol: w.tradingSymbol, weight: pct, type: 'underweight' })
    }
  }
  return alerts.sort((a, b) => {
    if (a.type === 'overweight' && b.type !== 'overweight') return -1
    if (a.type !== 'overweight' && b.type === 'overweight') return 1
    return b.weight - a.weight
  })
}

// ── Holdings Heatmap ───────────────────────────────────────────────────────

export function computeHeatmapData(weights: PortfolioWeight[]): HeatmapCell[] {
  return weights
    .map((w) => {
      // Clamp intensity between -1 and 1, with 5% as full saturation
      const intensity = Math.max(-1, Math.min(1, w.pnlPercent / 15))
      return {
        tradingSymbol: w.tradingSymbol,
        pnlPercent: w.pnlPercent,
        weight: w.weight,
        currentValue: w.currentValue,
        pnl: w.pnl,
        colorIntensity: intensity,
      }
    })
    .sort((a, b) => b.weight - a.weight)
}

export function getHeatmapColor(pnlPercent: number): string {
  if (pnlPercent >= 10) return '#059669' // emerald-600
  if (pnlPercent >= 5) return '#34d399' // emerald-400
  if (pnlPercent >= 2) return '#6ee7b7' // emerald-300
  if (pnlPercent > 0) return '#a7f3d0' // emerald-200
  if (pnlPercent === 0) return '#94a3b8' // slate-400
  if (pnlPercent > -2) return '#fca5a5' // red-300
  if (pnlPercent > -5) return '#f87171' // red-400
  if (pnlPercent > -10) return '#ef4444' // red-500
  return '#dc2626' // red-600
}

export function getHeatmapTextColor(pnlPercent: number): string {
  if (Math.abs(pnlPercent) >= 5) return '#ffffff'
  if (Math.abs(pnlPercent) >= 2) return '#1e293b'
  return '#1e293b'
}

// ── Exchange Breakdown ─────────────────────────────────────────────────────

export function computeExchangeBreakdown(weights: PortfolioWeight[]): ExchangeBreakdown[] {
  const map = new Map<string, { value: number; count: number }>()
  for (const w of weights) {
    const key = w.exchange || 'OTHER'
    const existing = map.get(key)
    if (existing) {
      existing.value += w.currentValue
      existing.count++
    } else {
      map.set(key, { value: w.currentValue, count: 1 })
    }
  }
  return Array.from(map.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value)
}

// ── Summary Stats ──────────────────────────────────────────────────────────

export function computeSummaryStats(holdings: BrokerHolding[]): SummaryStats {
  const weights = computePortfolioWeights(holdings)
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0)
  const totalInvested = holdings.reduce((sum, h) => sum + h.investedValue, 0)
  const totalPnl = holdings.reduce((sum, h) => sum + h.pnl, 0)
  const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0
  const winners = holdings.filter((h) => h.pnl > 0).length
  const winRate = holdings.length > 0 ? (winners / holdings.length) * 100 : 0

  const sorted = [...holdings].sort((a, b) => b.pnlPercent - a.pnlPercent)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  return {
    totalValue,
    totalInvested,
    totalPnl,
    totalPnlPercent,
    winRate,
    bestPerformer: best
      ? { symbol: best.tradingSymbol, pnlPercent: best.pnlPercent }
      : { symbol: '-', pnlPercent: 0 },
    worstPerformer: worst
      ? { symbol: worst.tradingSymbol, pnlPercent: worst.pnlPercent }
      : { symbol: '-', pnlPercent: 0 },
    diversificationScore: computeDiversificationScore(weights),
    holdingsCount: holdings.length,
  }
}

// ── Chart Colors ───────────────────────────────────────────────────────────

export const CHART_COLORS = [
  '#34d399', '#22d3ee', '#818cf8', '#f472b6', '#fb923c',
  '#facc15', '#a78bfa', '#38bdf8', '#4ade80', '#f87171',
] as const

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}
