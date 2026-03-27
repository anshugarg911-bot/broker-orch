'use client'

import { HoldingsTable } from '@/components/HoldingsTable'
import { PortfolioSplits } from '@/components/holdings/PortfolioSplits'
import { AnalysisSidePanel } from '@/components/holdings/AnalysisSidePanel'
import { useBrokerStore } from '@/store/brokerStore'
import { useHoldingsAnalysisStore } from '@/store/holdingsAnalysisStore'
import { cn, formatCurrency } from '@/lib/utils'

export default function HoldingsPage() {
  const { holdings, consolidatedPortfolio } = useBrokerStore()
  const isPanelOpen = useHoldingsAnalysisStore((s) => s.isPanelOpen)

  return (
    <div className="p-6 space-y-6 max-w-[1800px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Holdings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {holdings.length} stocks across all accounts
          </p>
        </div>
        {consolidatedPortfolio && (
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Total Value</p>
            <p className="font-bold text-xl">
              {formatCurrency(consolidatedPortfolio.totalCurrentValue)}
            </p>
          </div>
        )}
      </div>

      {/* Portfolio Splits — 3 donut charts */}
      <PortfolioSplits />

      {/* Split layout: table + analysis panel */}
      <div className="flex gap-0">
        <div className={cn('flex-1 min-w-0 transition-all duration-200', isPanelOpen && 'max-w-[calc(100%-420px)]')}>
          <HoldingsTable />
        </div>
        {isPanelOpen && <AnalysisSidePanel />}
      </div>
    </div>
  )
}
