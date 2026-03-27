export type BrokerId = 'kite' | 'dhan' | 'groww' | 'angelone'

export type BrokerStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

export interface BrokerAccount {
  id: BrokerId
  name: string
  logo: string
  status: BrokerStatus
  lastSync?: string
  error?: string
}

export interface BrokerHolding {
  brokerId: BrokerId
  brokerName: string
  tradingSymbol: string
  exchange: string
  isin?: string
  quantity: number
  averagePrice: number
  lastPrice: number
  pnl: number
  pnlPercent: number
  currentValue: number
  investedValue: number
  product?: string
}

export interface Position {
  brokerId: BrokerId
  brokerName: string
  tradingSymbol: string
  exchange: string
  product: string
  quantity: number
  averagePrice: number
  lastPrice: number
  pnl: number
  pnlPercent: number
  buyQuantity: number
  sellQuantity: number
  buyValue: number
  sellValue: number
  multiplier?: number
}

export interface MarginData {
  brokerId: BrokerId
  available: number
  used: number
  total: number
  currency: string
}

export interface AuthCredentials {
  kite?: { api_key: string; access_token: string }
  dhan?: { access_token: string; client_id: string }
  groww?: { jwt_token: string }
  angelone?: { api_key: string; client_id: string; jwt_token: string }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface ConsolidatedPortfolio {
  holdings: BrokerHolding[]
  totalInvested: number
  totalCurrentValue: number
  totalPnl: number
  totalPnlPercent: number
  brokerBreakdown: {
    brokerId: BrokerId
    invested: number
    currentValue: number
    pnl: number
  }[]
}
