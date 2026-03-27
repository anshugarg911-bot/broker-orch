import mongoose, { Schema, Document } from 'mongoose'

export interface IAnalysisCache extends Document {
  symbol: string
  type: 'classification' | 'fundamental' | 'analyst' | 'technical'
  data: Record<string, unknown>
  cachedAt: Date
  expiresAt: Date
}

const AnalysisCacheSchema = new Schema<IAnalysisCache>({
  symbol: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['classification', 'fundamental', 'analyst', 'technical'],
  },
  data: { type: Schema.Types.Mixed, required: true },
  cachedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
})

AnalysisCacheSchema.index({ symbol: 1, type: 1 }, { unique: true })
AnalysisCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const AnalysisCache =
  mongoose.models.AnalysisCache ||
  mongoose.model<IAnalysisCache>('AnalysisCache', AnalysisCacheSchema)
