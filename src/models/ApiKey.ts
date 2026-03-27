import mongoose, { Schema, Document } from 'mongoose'

export interface IApiKey extends Document {
  type: 'anthropic' | 'kite' | 'dhan' | 'groww' | 'angelone'
  encryptedData: string
  iv: string
  authTag: string
  updatedAt: Date
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      enum: ['anthropic', 'kite', 'dhan', 'groww', 'angelone'],
    },
    encryptedData: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  { timestamps: true }
)

export const ApiKey = mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema)
