// Classification types
export type AssetClass = 'equity' | 'debt' | 'etf' | 'reit' | 'hybrid' | 'commodity'
export type MarketCapCategory = 'largeCap' | 'midCap' | 'smallCap' | 'micro'

export interface StockClassification {
  symbol: string
  sector: string
  marketCap: MarketCapCategory
  assetClass: AssetClass
}

// Donut chart data
export interface SplitChartData {
  name: string
  value: number
  count: number
  percentage: number
}

// Technical indicators
export interface TechnicalIndicators {
  rsi: {
    value: number
    signal: 'oversold' | 'neutral' | 'overbought'
  }
  macd: {
    macdLine: number
    signalLine: number
    histogram: number
    signal: 'bullish' | 'bearish' | 'neutral'
  }
  bollinger: {
    upper: number
    middle: number
    lower: number
    lastPrice: number
    position: 'near_upper' | 'near_lower' | 'middle'
  }
}

// AI Analyst types
export type AnalystPersona = 'warren_buffett' | 'michael_burry' | 'technical_analyst' | 'fundamental_analyst'
export type Signal = 'bullish' | 'bearish' | 'neutral'

export interface AnalystSignal {
  persona: AnalystPersona
  displayName: string
  signal: Signal
  confidence: number
  reasoning: string
}

// Fundamental health
export type HealthRating = 'Strong' | 'Moderate' | 'Weak'

export interface FundamentalHealth {
  profitability: HealthRating
  growth: HealthRating
  financialHealth: HealthRating
  overallScore: number
  summary: string
}

// Persona display config
export const PERSONA_CONFIG: Record<AnalystPersona, { displayName: string; icon: string; description: string }> = {
  warren_buffett: {
    displayName: 'Warren Buffett',
    icon: '🏛️',
    description: 'Value investing, moats, long-term quality',
  },
  michael_burry: {
    displayName: 'Michael Burry',
    icon: '📉',
    description: 'Contrarian, deep value, systemic risk',
  },
  technical_analyst: {
    displayName: 'Technical Analyst',
    icon: '📊',
    description: 'Price action, momentum, trend analysis',
  },
  fundamental_analyst: {
    displayName: 'Fundamental Analyst',
    icon: '📋',
    description: 'Financial ratios, growth, valuation',
  },
}
