'use client'

import { useHoldingsAnalysisStore } from '@/store/holdingsAnalysisStore'
import { useBrokerStore } from '@/store/brokerStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, getPnlColor, formatPercent } from '@/lib/utils'
import { X, Activity, Sparkles, Brain, Shield } from 'lucide-react'
import { TechnicalPanel } from './TechnicalPanel'
import { FundamentalPanel } from './FundamentalPanel'
import { AIAnalystPanel } from './AIAnalystPanel'
import { RiskPanel } from './RiskPanel'

export function AnalysisSidePanel() {
  const selectedSymbol = useHoldingsAnalysisStore((s) => s.selectedSymbol)
  const closePanel = useHoldingsAnalysisStore((s) => s.closePanel)
  const holdings = useBrokerStore((s) => s.holdings)

  const holding = holdings.find((h) => h.tradingSymbol === selectedSymbol)

  if (!selectedSymbol || !holding) return null

  return (
    <div className="w-[420px] shrink-0 border-l border-border animate-in slide-in-from-right-5 duration-200">
      <div className="sticky top-0 h-[calc(100vh-theme(spacing.16))] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{holding.tradingSymbol}</h3>
              <Badge variant="outline" className="text-[10px]">{holding.exchange}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-sm">{formatCurrency(holding.lastPrice)}</span>
              <span className={cn('font-mono text-sm', getPnlColor(holding.pnl))}>
                {formatCurrency(holding.pnl)} ({formatPercent(holding.pnlPercent)})
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={closePanel} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="p-4">
          <Tabs defaultValue="technical">
            <TabsList className="w-full">
              <TabsTrigger value="technical" className="flex-1 gap-1 text-xs">
                <Activity className="h-3 w-3" />
                Technical
              </TabsTrigger>
              <TabsTrigger value="fundamental" className="flex-1 gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                Fundamental
              </TabsTrigger>
              <TabsTrigger value="ai-analyst" className="flex-1 gap-1 text-xs">
                <Brain className="h-3 w-3" />
                AI Analyst
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex-1 gap-1 text-xs">
                <Shield className="h-3 w-3" />
                Risk
              </TabsTrigger>
            </TabsList>

            <TabsContent value="technical" className="mt-4">
              <TechnicalPanel />
            </TabsContent>

            <TabsContent value="fundamental" className="mt-4">
              <FundamentalPanel />
            </TabsContent>

            <TabsContent value="ai-analyst" className="mt-4">
              <AIAnalystPanel />
            </TabsContent>

            <TabsContent value="risk" className="mt-4">
              <RiskPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
