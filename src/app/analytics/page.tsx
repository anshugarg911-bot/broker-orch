'use client'

import { useBrokerStore } from '@/store/brokerStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { BarChart2 } from 'lucide-react'

export default function AnalyticsPage() {
  const { holdings, consolidatedPortfolio } = useBrokerStore()

  const brokerBreakdown = consolidatedPortfolio?.brokerBreakdown ?? []

  const topHoldings = [...holdings]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 10)

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Portfolio breakdown and performance
        </p>
      </div>

      {holdings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BarChart2 className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No data available. Connect a broker and sync holdings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Broker Breakdown */}
          {brokerBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Broker Allocation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {brokerBreakdown.map((b) => {
                  const pct = consolidatedPortfolio
                    ? (b.currentValue / consolidatedPortfolio.totalCurrentValue) * 100
                    : 0
                  return (
                    <div key={b.brokerId}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm capitalize">{b.brokerId}</span>
                        <span className="text-sm font-medium">{formatCurrency(b.currentValue)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">{pct.toFixed(1)}% of portfolio</p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Top Holdings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Holdings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topHoldings.map((h, i) => (
                <div key={`${h.brokerId}-${h.tradingSymbol}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs w-4">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{h.tradingSymbol}</p>
                      <p className="text-muted-foreground text-xs capitalize">{h.brokerId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(h.currentValue)}</p>
                    <p className={`text-xs ${h.pnlPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatPercent(h.pnlPercent)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
