'use client'

import { useMemo } from 'react'
import { useBrokerStore } from '@/store/brokerStore'
import { useHoldingsAnalysisStore } from '@/store/holdingsAnalysisStore'
import { computePortfolioWeights, computeRiskMetrics, computeAllocationAlerts } from '@/lib/analytics'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatPercent, formatCurrency } from '@/lib/utils'
import { AlertTriangle, Shield, TrendingUp } from 'lucide-react'

export function RiskPanel() {
  const holdings = useBrokerStore((s) => s.holdings)
  const selectedSymbol = useHoldingsAnalysisStore((s) => s.selectedSymbol)
  const consolidatedPortfolio = useBrokerStore((s) => s.consolidatedPortfolio)

  const weights = useMemo(() => computePortfolioWeights(holdings), [holdings])
  const totalPnlPercent = consolidatedPortfolio?.totalPnlPercent ?? 0
  const riskMetrics = useMemo(() => computeRiskMetrics(weights, totalPnlPercent), [weights, totalPnlPercent])
  const alerts = useMemo(() => computeAllocationAlerts(weights), [weights])

  const selectedWeight = weights.find((w) => w.tradingSymbol === selectedSymbol)
  const selectedAlert = alerts.find((a) => a.tradingSymbol === selectedSymbol)

  if (!selectedSymbol) return null

  return (
    <div className="space-y-4">
      {/* Per-stock metrics */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Risk</h4>

        <Card size="sm">
          <CardContent className="py-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Portfolio Weight</span>
              <span className="font-mono text-sm">{selectedWeight ? formatPercent(selectedWeight.weight * 100) : '—'}</span>
            </div>
            {selectedWeight && (
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, selectedWeight.weight * 100)}%` }}
                />
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm">Estimated Beta</span>
              <span className="font-mono text-sm">
                {selectedWeight
                  ? selectedWeight.currentValue >= 50000
                    ? '~0.95'
                    : selectedWeight.currentValue >= 10000
                    ? '~1.15'
                    : '~1.35'
                  : '—'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Position Value</span>
              <span className="font-mono text-sm">{selectedWeight ? formatCurrency(selectedWeight.currentValue) : '—'}</span>
            </div>
          </CardContent>
        </Card>

        {selectedAlert && (
          <div className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
            selectedAlert.type === 'overweight' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
          )}>
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>
              {selectedAlert.type === 'overweight'
                ? `Overweight: ${formatPercent(selectedAlert.weight)} of portfolio (>10% threshold)`
                : `Underweight: ${formatPercent(selectedAlert.weight)} of portfolio (<0.5% threshold)`}
            </span>
          </div>
        )}
      </div>

      {/* Portfolio-level risk */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Portfolio Risk</h4>

        <Card size="sm">
          <CardContent className="py-3 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">Diversification Score</span>
              </div>
              <Badge variant="secondary" className={cn(
                'text-[10px]',
                riskMetrics.diversificationScore >= 70 ? 'bg-emerald-400/10 text-emerald-400' :
                riskMetrics.diversificationScore >= 40 ? 'bg-amber-400/10 text-amber-400' :
                'bg-red-400/10 text-red-400'
              )}>
                {riskMetrics.diversificationScore.toFixed(0)}/100
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">Top 5 Concentration</span>
              </div>
              <span className="font-mono text-xs">{formatPercent(riskMetrics.top5Concentration * 100)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs pl-[18px]">Max Single Exposure</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{riskMetrics.maxSingleExposureSymbol}</span>
                <span className="font-mono text-xs">{formatPercent(riskMetrics.maxSingleExposure * 100)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs pl-[18px]">Est. Portfolio Beta</span>
              <span className="font-mono text-xs">{riskMetrics.estimatedBeta.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs pl-[18px]">Capital at Risk (5%)</span>
              <span className="font-mono text-xs">{formatCurrency(riskMetrics.capitalAtRisk)}</span>
            </div>
          </CardContent>
        </Card>

        {alerts.length > 0 && (
          <Card size="sm">
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground mb-2">Allocation Alerts ({alerts.length})</p>
              <div className="space-y-1">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.tradingSymbol}
                    className={cn(
                      'flex items-center justify-between text-xs px-2 py-1 rounded',
                      alert.tradingSymbol === selectedSymbol && 'bg-accent/50'
                    )}
                  >
                    <span>{alert.tradingSymbol}</span>
                    <Badge variant="secondary" className={cn(
                      'text-[10px]',
                      alert.type === 'overweight' ? 'bg-amber-400/10 text-amber-400' : 'bg-blue-400/10 text-blue-400'
                    )}>
                      {alert.type} · {formatPercent(alert.weight)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
