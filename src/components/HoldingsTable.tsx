'use client'

import { useBrokerStore } from '@/store/brokerStore'
import { useHoldingsAnalysisStore } from '@/store/holdingsAnalysisStore'
import { BrokerHolding, BrokerId } from '@/types/broker'
import { cn, formatCurrency, formatPercent, getPnlColor } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'

const BROKER_BADGE: Record<string, string> = {
  kite: 'bg-[#387ED1]/20 text-[#387ED1] border-[#387ED1]/30',
  dhan: 'bg-[#00C7BE]/20 text-[#00C7BE] border-[#00C7BE]/30',
  groww: 'bg-[#5367FF]/20 text-[#5367FF] border-[#5367FF]/30',
  angelone: 'bg-[#E84043]/20 text-[#E84043] border-[#E84043]/30',
}

export function HoldingsTable() {
  const { holdings: rawHoldings, isLoadingHoldings } = useBrokerStore()
  const selectedSymbol = useHoldingsAnalysisStore((s) => s.selectedSymbol)
  const selectHolding = useHoldingsAnalysisStore((s) => s.selectHolding)
  const holdings = Array.isArray(rawHoldings) ? rawHoldings : []

  if (isLoadingHoldings) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <TrendingUp className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">No holdings found. Connect a broker to get started.</p>
      </div>
    )
  }

  const sortedHoldings = [...holdings].sort((a, b) => b.currentValue - a.currentValue)

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Avg Price</TableHead>
            <TableHead className="text-right">LTP</TableHead>
            <TableHead className="text-right">Current Value</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="text-right">P&L %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedHoldings.map((holding, index) => (
            <HoldingRow
              key={`${holding.brokerId}-${holding.tradingSymbol}-${index}`}
              holding={holding}
              isSelected={selectedSymbol === holding.tradingSymbol}
              onSelect={() => selectHolding(holding.tradingSymbol, holding.brokerId as BrokerId)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function HoldingRow({ holding, isSelected, onSelect }: { holding: BrokerHolding; isSelected: boolean; onSelect: () => void }) {
  const isGain = holding.pnl >= 0

  return (
    <TableRow className={cn('cursor-pointer hover:bg-accent/30 transition-colors', isSelected && 'bg-accent/50')} onClick={onSelect}>
      <TableCell>
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium text-sm">{holding.tradingSymbol}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge
                variant="outline"
                className={cn('text-[10px] px-1 py-0 font-medium', BROKER_BADGE[holding.brokerId])}
              >
                {holding.brokerName}
              </Badge>
              <span className="text-muted-foreground text-[10px]">{holding.exchange}</span>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {holding.quantity}
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {formatCurrency(holding.averagePrice)}
      </TableCell>
      <TableCell className="text-right font-mono text-sm font-medium">
        {formatCurrency(holding.lastPrice)}
      </TableCell>
      <TableCell className="text-right font-mono text-sm font-medium">
        {formatCurrency(holding.currentValue)}
      </TableCell>
      <TableCell className={cn('text-right font-mono text-sm font-medium', getPnlColor(holding.pnl))}>
        <div className="flex items-center justify-end gap-1">
          {isGain ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {isGain ? '+' : ''}{formatCurrency(holding.pnl)}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <span className={cn(
          'font-mono text-sm font-medium px-2 py-0.5 rounded',
          holding.pnlPercent >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
        )}>
          {formatPercent(holding.pnlPercent)}
        </span>
      </TableCell>
    </TableRow>
  )
}
