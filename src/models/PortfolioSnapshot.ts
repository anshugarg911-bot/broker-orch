import mongoose, { Schema, Document } from 'mongoose'

interface HoldingEntry {
  brokerId: string
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

interface BrokerBreakdownEntry {
  brokerId: string
  invested: number
  currentValue: number
  pnl: number
}

export interface IPortfolioSnapshot extends Document {
  syncedAt: Date
  holdings: HoldingEntry[]
  totalInvested: number
  totalCurrentValue: number
  totalPnl: number
  totalPnlPercent: number
  brokerBreakdown: BrokerBreakdownEntry[]
  holdingsCount: number
}

const HoldingSchema = new Schema(
  {
    brokerId: String,
    brokerName: String,
    tradingSymbol: String,
    exchange: String,
    isin: String,
    quantity: Number,
    averagePrice: Number,
    lastPrice: Number,
    pnl: Number,
    pnlPercent: Number,
    currentValue: Number,
    investedValue: Number,
    product: String,
  },
  { _id: false }
)

const BrokerBreakdownSchema = new Schema(
  {
    brokerId: String,
    invested: Number,
    currentValue: Number,
    pnl: Number,
  },
  { _id: false }
)

const PortfolioSnapshotSchema = new Schema<IPortfolioSnapshot>({
  syncedAt: { type: Date, default: Date.now, index: true },
  holdings: [HoldingSchema],
  totalInvested: Number,
  totalCurrentValue: Number,
  totalPnl: Number,
  totalPnlPercent: Number,
  brokerBreakdown: [BrokerBreakdownSchema],
  holdingsCount: Number,
})

PortfolioSnapshotSchema.index({ syncedAt: -1 })

export const PortfolioSnapshot =
  mongoose.models.PortfolioSnapshot ||
  mongoose.model<IPortfolioSnapshot>('PortfolioSnapshot', PortfolioSnapshotSchema)
