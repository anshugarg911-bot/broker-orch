'use client'

import { useEffect } from 'react'
import { useHoldingsAnalysisStore } from '@/store/holdingsAnalysisStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const RSI_ZONES = [
  { label: 'Oversold', min: 0, max: 30, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { label: 'Neutral', min: 30, max: 70, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  { label: 'Overbought', min: 70, max: 100, color: 'text-red-400', bg: 'bg-red-400/10' },
]

function RSIGauge({ value, signal }: { value: number; signal: string }) {
  const zone = RSI_ZONES.find((z) => value >= z.min && value < z.max) ?? RSI_ZONES[1]
  const position = Math.min(100, Math.max(0, value))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">RSI (14)</span>
        <Badge variant="secondary" className={cn('text-[10px]', zone.bg, zone.color)}>
          {signal === 'oversold' ? 'Oversold' : signal === 'overbought' ? 'Overbought' : 'Neutral'}
        </Badge>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-[30%] bg-emerald-500/20 rounded-l-full" />
        <div className="absolute inset-y-0 left-[30%] w-[40%] bg-slate-500/10" />
        <div className="absolute inset-y-0 right-0 w-[30%] bg-red-500/20 rounded-r-full" />
        <div
          className="absolute top-0 h-3 w-1 bg-foreground rounded-full"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span>30</span>
        <span>70</span>
        <span>100</span>
      </div>
      <p className="text-center font-mono text-lg font-bold">{value.toFixed(1)}</p>
    </div>
  )
}

function MACDStatus({ macdLine, signalLine, histogram, signal }: { macdLine: number; signalLine: number; histogram: number; signal: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">MACD (12, 26, 9)</span>
        <Badge
          variant="secondary"
          className={cn(
            'text-[10px]',
            signal === 'bullish' ? 'bg-emerald-400/10 text-emerald-400' :
            signal === 'bearish' ? 'bg-red-400/10 text-red-400' :
            'bg-slate-400/10 text-slate-400'
          )}
        >
          {signal === 'bullish' ? 'Bullish Crossover' : signal === 'bearish' ? 'Bearish Crossover' : 'Neutral'}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-muted-foreground">MACD</p>
          <p className="font-mono text-xs">{macdLine.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Signal</p>
          <p className="font-mono text-xs">{signalLine.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Histogram</p>
          <p className={cn('font-mono text-xs', histogram > 0 ? 'text-emerald-400' : histogram < 0 ? 'text-red-400' : '')}>
            {histogram.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}

function BollingerStatus({ upper, middle, lower, lastPrice, position }: { upper: number; middle: number; lower: number; lastPrice: number; position: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Bollinger Bands (20, 2)</span>
        <Badge
          variant="secondary"
          className={cn(
            'text-[10px]',
            position === 'near_upper' ? 'bg-red-400/10 text-red-400' :
            position === 'near_lower' ? 'bg-emerald-400/10 text-emerald-400' :
            'bg-slate-400/10 text-slate-400'
          )}
        >
          {position === 'near_upper' ? 'Near Upper Band' : position === 'near_lower' ? 'Near Lower Band' : 'Middle Band'}
        </Badge>
      </div>
      <div className="space-y-1">
        {[
          { label: 'Upper', value: upper },
          { label: 'Middle', value: middle },
          { label: 'Price', value: lastPrice, highlight: true },
          { label: 'Lower', value: lower },
        ].map((row) => (
          <div key={row.label} className={cn('flex justify-between text-xs', row.highlight && 'font-medium text-foreground')}>
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-mono">₹{row.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TechnicalPanel() {
  const selectedSymbol = useHoldingsAnalysisStore((s) => s.selectedSymbol)
  const selectedBrokerId = useHoldingsAnalysisStore((s) => s.selectedBrokerId)
  const indicators = useHoldingsAnalysisStore((s) => s.technicalIndicators)
  const isLoading = useHoldingsAnalysisStore((s) => s.isLoadingTechnical)
  const setTechnicalIndicators = useHoldingsAnalysisStore((s) => s.setTechnicalIndicators)
  const setLoadingTechnical = useHoldingsAnalysisStore((s) => s.setLoadingTechnical)

  useEffect(() => {
    if (!selectedSymbol || !selectedBrokerId) return

    const controller = new AbortController()
    setLoadingTechnical(true)

    const params = new URLSearchParams({
      symbol: selectedSymbol,
      broker: selectedBrokerId,
      lastPrice: '0',
    })

    fetch(`/api/mcp/technical-indicators?${params}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setTechnicalIndicators(res.data)
        else setTechnicalIndicators(null)
      })
      .catch(() => setTechnicalIndicators(null))

    return () => controller.abort()
  }, [selectedSymbol, selectedBrokerId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!indicators) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Unable to load technical indicators.</p>
        <p className="text-muted-foreground text-xs mt-1">Make sure the MCP bridge is running.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardContent className="pt-4">
          <RSIGauge value={indicators.rsi.value} signal={indicators.rsi.signal} />
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="pt-4">
          <MACDStatus {...indicators.macd} />
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="pt-4">
          <BollingerStatus {...indicators.bollinger} />
        </CardContent>
      </Card>
    </div>
  )
}
