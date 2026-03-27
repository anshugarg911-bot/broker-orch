'use client'

import { useCallback, useState } from 'react'
import { useHoldingsAnalysisStore } from '@/store/holdingsAnalysisStore'
import { useBrokerStore } from '@/store/brokerStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import type { HealthRating } from '@/types/holdings-analysis'

const RATING_STYLE: Record<HealthRating, { color: string; bg: string }> = {
  Strong: { color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  Moderate: { color: 'text-amber-400', bg: 'bg-amber-400/10' },
  Weak: { color: 'text-red-400', bg: 'bg-red-400/10' },
}

function ScoreCircle({ score }: { score: number }) {
  const percentage = (score / 10) * 100
  const color = score >= 7 ? '#34d399' : score >= 4 ? '#fbbf24' : '#f87171'
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
        <circle
          cx="44" cy="44" r={radius} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
    </div>
  )
}

export function FundamentalPanel() {
  const selectedSymbol = useHoldingsAnalysisStore((s) => s.selectedSymbol)
  const fundamentalHealth = useHoldingsAnalysisStore((s) => s.fundamentalHealth)
  const isLoading = useHoldingsAnalysisStore((s) => s.isLoadingFundamental)
  const setFundamentalHealth = useHoldingsAnalysisStore((s) => s.setFundamentalHealth)
  const setLoadingFundamental = useHoldingsAnalysisStore((s) => s.setLoadingFundamental)
  const holdings = useBrokerStore((s) => s.holdings)
  const [hasRequested, setHasRequested] = useState(false)

  const holding = holdings.find((h) => h.tradingSymbol === selectedSymbol)

  const fetchFundamentals = useCallback(async () => {
    if (!selectedSymbol || !holding) return
    setLoadingFundamental(true)
    setHasRequested(true)

    try {
      const res = await fetch('/api/analysis/fundamental-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
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
      const data = await res.json()
      if (data.success) setFundamentalHealth(data.data)
      else setFundamentalHealth(null)
    } catch {
      setFundamentalHealth(null)
    }
  }, [selectedSymbol, holding]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasRequested && !fundamentalHealth) {
    return (
      <div className="text-center py-10 space-y-3">
        <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Fundamental analysis powered by Claude Opus</p>
        <Button onClick={fetchFundamentals} size="sm">
          Analyze Fundamentals
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <Skeleton className="h-[88px] w-[88px] rounded-full" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (!fundamentalHealth) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Unable to analyze fundamentals.</p>
        <Button onClick={fetchFundamentals} size="sm" variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  const categories: { label: string; rating: HealthRating }[] = [
    { label: 'Profitability', rating: fundamentalHealth.profitability },
    { label: 'Growth', rating: fundamentalHealth.growth },
    { label: 'Financial Health', rating: fundamentalHealth.financialHealth },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-center py-2">
        <ScoreCircle score={fundamentalHealth.overallScore} />
      </div>

      <div className="space-y-2">
        {categories.map(({ label, rating }) => {
          const style = RATING_STYLE[rating]
          return (
            <Card key={label} size="sm">
              <CardContent className="py-3 flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <Badge variant="secondary" className={cn('text-xs', style.bg, style.color)}>
                  {rating}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{fundamentalHealth.summary}</p>
    </div>
  )
}
