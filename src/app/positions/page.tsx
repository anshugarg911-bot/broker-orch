'use client'

import { PositionsTable } from '@/components/PositionsTable'
import { useBrokerStore } from '@/store/brokerStore'
import { isMarketOpen } from '@/lib/utils'

export default function PositionsPage() {
  const { positions } = useBrokerStore()
  const marketOpen = isMarketOpen()

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Positions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {positions.length} open position{positions.length !== 1 ? 's' : ''} today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${marketOpen ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/30'}`} />
          <span className="text-sm text-muted-foreground">
            {marketOpen ? 'Live' : 'Market Closed'}
          </span>
        </div>
      </div>
      <PositionsTable />
    </div>
  )
}
