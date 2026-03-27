import { connectDB } from '@/lib/db'
import { UserConfig } from '@/models/UserConfig'

export async function GET() {
  try {
    await connectDB()
    const configs = await UserConfig.find().lean()
    const result: Record<string, unknown> = {}
    for (const c of configs) {
      result[c.key] = c.value
    }
    return Response.json({ success: true, data: result, timestamp: new Date().toISOString() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, error: msg, timestamp: new Date().toISOString() }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB()
    const body = await request.json()

    if (body.entries && typeof body.entries === 'object') {
      const ops = Object.entries(body.entries).map(([key, value]) => ({
        updateOne: {
          filter: { key },
          update: { key, value },
          upsert: true,
        },
      }))
      await UserConfig.bulkWrite(ops)
    } else if (body.key) {
      await UserConfig.findOneAndUpdate(
        { key: body.key },
        { key: body.key, value: body.value },
        { upsert: true }
      )
    }

    return Response.json({ success: true, timestamp: new Date().toISOString() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, error: msg, timestamp: new Date().toISOString() }, { status: 500 })
  }
}
