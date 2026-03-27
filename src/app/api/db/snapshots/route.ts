import { connectDB } from '@/lib/db'
import { PortfolioSnapshot } from '@/models/PortfolioSnapshot'

export async function GET(request: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const snapshots = await PortfolioSnapshot.find()
      .sort({ syncedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()

    const total = await PortfolioSnapshot.countDocuments()

    return Response.json({
      success: true,
      data: { snapshots, total, limit, offset },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, error: msg, timestamp: new Date().toISOString() }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()

    const snapshot = await PortfolioSnapshot.create({
      syncedAt: new Date(),
      holdings: body.holdings || [],
      totalInvested: body.totalInvested || 0,
      totalCurrentValue: body.totalCurrentValue || 0,
      totalPnl: body.totalPnl || 0,
      totalPnlPercent: body.totalPnlPercent || 0,
      brokerBreakdown: body.brokerBreakdown || [],
      holdingsCount: body.holdings?.length || 0,
    })

    return Response.json({
      success: true,
      data: { id: snapshot._id, syncedAt: snapshot.syncedAt },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ success: false, error: msg, timestamp: new Date().toISOString() }, { status: 500 })
  }
}
