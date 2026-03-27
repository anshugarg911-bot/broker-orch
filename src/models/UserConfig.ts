import mongoose, { Schema, Document } from 'mongoose'

export interface IUserConfig extends Document {
  key: string
  value: unknown
  updatedAt: Date
}

const UserConfigSchema = new Schema<IUserConfig>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
)

export const UserConfig =
  mongoose.models.UserConfig ||
  mongoose.model<IUserConfig>('UserConfig', UserConfigSchema)
