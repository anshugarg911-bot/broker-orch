'use client'

import { useBrokerStore } from '@/store/brokerStore'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import { normalizePortfolioResponse, normalizePositionsResponse } from '@/lib/normalizers'
import { BrokerId } from '@/types/broker'
import { TrendingUp, TrendingDown, Wallet, BarChart3, Activity, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PortfolioSummary() {
  const store = useBrokerStore()
  const {
    brokers,
    consolidatedPortfolio,
    holdings,
    positions,
    lastSyncedAt,
    isLoadingHoldings,
    setLoadingHoldings,
    setHoldings,
    setPositions,
    setConsolidatedPortfolio,
    updateLastSynced,
  } = store

  // Calculate totals directly from holdings array (works even without consolidated portfolio)
  const safeHoldings = Array.isArray(holdings) ? holdings : []
  const computedCurrentValue = safeHoldings.reduce((s, h) => s + (h.currentValue ?? 0), 0)
  const computedInvested    = safeHoldings.reduce((s, h) => s + (h.investedValue ?? 0), 0)
  const computedPnl         = safeHoldings.reduce((s, h) => s + (h.pnl ?? 0), 0)
  const computedPnlPct      = computedInvested > 0 ? (computedPnl / computedInvested) * 100 : 0

  const totalValue    = consolidatedPortfolio?.totalCurrentValue ?? computedCurrentValue
  const totalPnl      = consolidatedPortfolio?.totalPnl          ?? computedPnl
  const totalInvested = consolidatedPortfolio?.totalInvested      ?? computedInvested
  const totalPnlPercent = consolidatedPortfolio?.totalPnlPercent  ?? computedPnlPct
  const isGain = totalPnl >= 0

  const handleSync = async () => {
    setLoadingHoldings(true)
    try {
      const connectedBrokers = brokers.filter((b) => b.status === 'connected')
      const allHoldings: ReturnType<typeof normalizePortfolioResponse> = []
      const allPositions: ReturnType<typeof normalizePositionsResponse> = []

      // Fetch holdings + positions per connected broker in parallel
      await Promise.all(
        connectedBrokers.map(async (broker) => {
          const brokerId = broker.id as BrokerId
          try {
            const [holdRes, posRes] = await Promise.all([
              fetch(`/api/mcp/portfolio?broker=${brokerId}`),
              fetch(`/api/mcp/positions?broker=${brokerId}`),
            ])

            if (holdRes.ok) {
              const json = await holdRes.json()
              if (json.data) {
                allHoldings.push(...normalizePortfolioResponse(json.data, brokerId))
              }
            }

            if (posRes.ok) {
              const json = await posRes.json()
              if (json.data) {
                allPositions.push(...normalizePositionsResponse(json.data, brokerId))
              }
            }
          } catch {
            // One broker failing shouldn't stop others
          }
        })
      )

      setHoldings(allHoldings)
      setPositions(allPositions)

      // Also try consolidated for summary stats
      try {
        const consolidatedRes = await fetch('/api/mcp/portfolio/consolidated')
        if (consolidatedRes.ok) {
          const consolidatedData = await consolidatedRes.json()
          if (consolidatedData.success && consolidatedData.data) {
            setConsolidatedPortfolio(consolidatedData.data)
          }
        }
      } catch { /* non-critical */ }

      updateLastSynced()

      // Save portfolio snapshot to MongoDB (fire-and-forget)
      const allH = Array.isArray(store.holdings) ? store.holdings : []
      if (allH.length > 0) {
        const ti = allH.reduce((s, h) => s + (h.investedValue ?? 0), 0)
        const tcv = allH.reduce((s, h) => s + (h.currentValue ?? 0), 0)
        fetch('/api/db/snapshots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            holdings: allH,
            totalInvested: ti,
            totalCurrentValue: tcv,
            totalPnl: tcv - ti,
            totalPnlPercent: ti > 0 ? ((tcv - ti) / ti) * 100 : 0,
            brokerBreakdown: [],
          }),
        }).catch(() => {})
      }
    } finally {
      setLoadingHoldings(false)
    }
  }

  const stats = [
    {
      label: 'Portfolio Value',
      value: formatCurrency(totalValue),
      icon: Wallet,
      colorClass: 'text-foreground',
    },
    {
      label: 'Invested',
      value: formatCurrency(totalInvested),
      icon: BarChart3,
      colorClass: 'text-muted-foreground',
    },
    {
      label: 'Total P&L',
      value: formatCurrency(totalPnl),
      sub: formatPercent(totalPnlPercent),
      icon: isGain ? TrendingUp : TrendingDown,
      colorClass: isGain ? 'text-emerald-500' : 'text-red-500',
    },
    {
      label: 'Open Positions',
      value: positions.length.toString(),
      sub: `${holdings.length} holdings`,
      icon: Activity,
      colorClass: 'text-amber-500',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Portfolio Overview</h2>
          {lastSyncedAt && (
            <p className="text-muted-foreground text-xs mt-0.5">
              Last synced: {new Date(lastSyncedAt).toLocaleTimeString('en-IN')}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isLoadingHoldings}
        >
          <RefreshCw className={cn('w-3 h-3 mr-1.5', isLoadingHoldings && 'animate-spin')} />
          Sync
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-muted-foreground text-xs font-medium">{stat.label}</p>
                  <Icon className={cn('w-4 h-4', stat.colorClass)} />
                </div>
                <p className={cn('font-bold text-xl', stat.colorClass)}>{stat.value}</p>
                {stat.sub && (
                  <p className={cn('text-xs mt-0.5 opacity-70', stat.colorClass)}>{stat.sub}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
