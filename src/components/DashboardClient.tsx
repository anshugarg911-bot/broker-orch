'use client'

import { useBrokerStore } from '@/store/brokerStore'
import { BrokerCard } from './BrokerCard'
import { PortfolioSummary } from './PortfolioSummary'
import { HoldingsTable } from './HoldingsTable'
import { PositionsTable } from './PositionsTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isMarketOpen } from '@/lib/utils'

export function DashboardClient() {
  const { brokers } = useBrokerStore()
  const marketOpen = isMarketOpen()

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${marketOpen ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/30'}`} />
          <span className="text-sm text-muted-foreground">
            Market {marketOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Broker Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {brokers.map((broker) => (
          <BrokerCard key={broker.id} broker={broker} />
        ))}
      </div>

      {/* Portfolio Summary */}
      <PortfolioSummary />

      {/* Holdings & Positions Tabs */}
      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="holdings">
            Holdings
          </TabsTrigger>
          <TabsTrigger value="positions">
            Positions
            {marketOpen && (
              <span className="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="holdings">
          <HoldingsTable />
        </TabsContent>
        <TabsContent value="positions">
          <PositionsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
