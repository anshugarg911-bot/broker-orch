'use client'

import { useCallback } from 'react'
import { useHoldingsAnalysisStore } from '@/store/holdingsAnalysisStore'
import { useBrokerStore } from '@/store/brokerStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PERSONA_CONFIG } from '@/types/holdings-analysis'
import type { AnalystSignal, Signal } from '@/types/holdings-analysis'

const SIGNAL_STYLE: Record<Signal, { color: string; bg: string; icon: typeof TrendingUp }> = {
  bullish: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: TrendingUp },
  bearish: { color: 'text-red-400', bg: 'bg-red-400/10', icon: TrendingDown },
  neutral: { color: 'text-slate-400', bg: 'bg-slate-400/10', icon: Minus },
}

function AnalystCard({ signal }: { signal: AnalystSignal }) {
  const config = PERSONA_CONFIG[signal.persona]
  const style = SIGNAL_STYLE[signal.signal]
  const Icon = style.icon

  return (
    <Card size="sm">
      <CardContent className="py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{config.icon}</span>
            <div>
              <p className="text-sm font-medium">{signal.displayName}</p>
              <p className="text-[10px] text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className={cn('text-[10px] gap-1', style.bg, style.color)}>
            <Icon className="h-3 w-3" />
            {signal.signal.charAt(0).toUpperCase() + signal.signal.slice(1)}
          </Badge>
        </div>

        {/* Confidence bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Confidence</span>
            <span>{signal.confidence}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', style.bg.replace('/10', ''))}
              style={{ width: `${signal.confidence}%`, backgroundColor: style.color.replace('text-', '').includes('emerald') ? '#34d399' : style.color.includes('red') ? '#f87171' : '#94a3b8' }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{signal.reasoning}</p>
      </CardContent>
    </Card>
  )
}

export function AIAnalystPanel() {
  const selectedSymbol = useHoldingsAnalysisStore((s) => s.selectedSymbol)
  const analystSignals = useHoldingsAnalysisStore((s) => s.analystSignals)
  const isLoading = useHoldingsAnalysisStore((s) => s.isLoadingAnalyst)
  const addAnalystSignal = useHoldingsAnalysisStore((s) => s.addAnalystSignal)
  const clearAnalystSignals = useHoldingsAnalysisStore((s) => s.clearAnalystSignals)
  const setLoadingAnalyst = useHoldingsAnalysisStore((s) => s.setLoadingAnalyst)
  const holdings = useBrokerStore((s) => s.holdings)

  const holding = holdings.find((h) => h.tradingSymbol === selectedSymbol)

  const runAnalysis = useCallback(async () => {
    if (!selectedSymbol || !holding) return

    clearAnalystSignals()
    setLoadingAnalyst(true)

    try {
      const res = await fetch('/api/analysis/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: holding.tradingSymbol,
          exchange: holding.exchange,
          broker: holding.brokerId,
          currentPrice: holding.lastPrice,
          avgPrice: holding.averagePrice,
          pnl: holding.pnl,
          pnlPercent: holding.pnlPercent,
          quantity: holding.quantity,
          currentValue: holding.currentValue,
        }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        setLoadingAnalyst(false)
        return
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') continue

          try {
            const signal = JSON.parse(payload) as AnalystSignal
            addAnalystSignal(signal)
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch {
      // Error handled by empty signals
    } finally {
      setLoadingAnalyst(false)
    }
  }, [selectedSymbol, holding]) // eslint-disable-line react-hooks/exhaustive-deps

  if (analystSignals.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10 space-y-3">
        <Brain className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          AI analysts powered by Claude Opus
        </p>
        <p className="text-xs text-muted-foreground">
          4 investment personas will analyze {selectedSymbol}
        </p>
        <Button onClick={runAnalysis} size="sm">
          Analyze with AI
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {isLoading && analystSignals.length < 4 && (
        <div className="space-y-3">
          {analystSignals.map((s) => (
            <AnalystCard key={s.persona} signal={s} />
          ))}
          {Array.from({ length: 4 - analystSignals.length }).map((_, i) => (
            <Skeleton key={`skel-${i}`} className="h-32 w-full" />
          ))}
        </div>
      )}

      {!isLoading && analystSignals.length > 0 && (
        <>
          <div className="space-y-3">
            {analystSignals.map((s) => (
              <AnalystCard key={s.persona} signal={s} />
            ))}
          </div>
          <div className="text-center pt-2">
            <Button onClick={runAnalysis} size="sm" variant="outline">
              Re-analyze
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
