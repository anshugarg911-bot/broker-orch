'use client'

import { useBrokerStore } from '@/store/brokerStore'
import { Position } from '@/types/broker'
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
import { Activity } from 'lucide-react'

const BROKER_BADGE: Record<string, string> = {
  kite: 'bg-[#387ED1]/20 text-[#387ED1] border-[#387ED1]/30',
  dhan: 'bg-[#00C7BE]/20 text-[#00C7BE] border-[#00C7BE]/30',
  groww: 'bg-[#5367FF]/20 text-[#5367FF] border-[#5367FF]/30',
  angelone: 'bg-[#E84043]/20 text-[#E84043] border-[#E84043]/30',
}

export function PositionsTable() {
  const { positions: rawPositions, isLoadingPositions } = useBrokerStore()
  const positions = Array.isArray(rawPositions) ? rawPositions : []

  if (isLoadingPositions) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Activity className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">No open positions today.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Avg Price</TableHead>
            <TableHead className="text-right">LTP</TableHead>
            <TableHead className="text-right">P&L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position, index) => (
            <PositionRow
              key={`${position.brokerId}-${position.tradingSymbol}-${index}`}
              position={position}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PositionRow({ position }: { position: Position }) {
  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium text-sm">{position.tradingSymbol}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Badge
              variant="outline"
              className={cn('text-[10px] px-1 py-0 font-medium', BROKER_BADGE[position.brokerId])}
            >
              {position.brokerName}
            </Badge>
            <span className="text-muted-foreground text-[10px]">{position.exchange}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-[10px]">
          {position.product}
        </Badge>
      </TableCell>
      <TableCell className={cn('text-right font-mono text-sm', position.quantity > 0 ? 'text-emerald-500' : 'text-red-500')}>
        {position.quantity > 0 ? '+' : ''}{position.quantity}
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {formatCurrency(position.averagePrice)}
      </TableCell>
      <TableCell className="text-right font-mono text-sm font-medium">
        {formatCurrency(position.lastPrice)}
      </TableCell>
      <TableCell className={cn('text-right font-mono text-sm font-medium', getPnlColor(position.pnl))}>
        {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
        <span className="text-xs ml-1 opacity-70">{formatPercent(position.pnlPercent)}</span>
      </TableCell>
    </TableRow>
  )
}
