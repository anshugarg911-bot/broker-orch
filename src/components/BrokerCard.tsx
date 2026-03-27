'use client'

import { useState } from 'react'
import { BrokerAccount, BrokerId } from '@/types/broker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBrokerStore } from '@/store/brokerStore'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff, Loader2, AlertCircle, Zap } from 'lucide-react'
import { AuthDialog } from './AuthDialog'

interface BrokerCardProps {
  broker: BrokerAccount
}

const STATUS_CONFIG = {
  connected: {
    icon: Wifi,
    label: 'Connected',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  disconnected: {
    icon: WifiOff,
    label: 'Disconnected',
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
  connecting: {
    icon: Loader2,
    label: 'Connecting...',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
}

const BROKER_COLORS: Record<BrokerId, string> = {
  kite: 'from-[#387ED1]/10 to-transparent border-[#387ED1]/20',
  dhan: 'from-[#00C7BE]/10 to-transparent border-[#00C7BE]/20',
  groww: 'from-[#5367FF]/10 to-transparent border-[#5367FF]/20',
  angelone: 'from-[#E84043]/10 to-transparent border-[#E84043]/20',
}

export function BrokerCard({ broker }: BrokerCardProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { holdings, positions } = useBrokerStore()

  const safeHoldings = Array.isArray(holdings) ? holdings : []
  const safePositions = Array.isArray(positions) ? positions : []
  const brokerHoldings = safeHoldings.filter((h) => h.brokerId === broker.id)
  const brokerPositions = safePositions.filter((p) => p.brokerId === broker.id)
  const brokerPnl = brokerHoldings.reduce((sum, h) => sum + h.pnl, 0)

  const StatusIcon = STATUS_CONFIG[broker.status].icon

  return (
    <>
      <Card
        className={cn(
          'bg-gradient-to-br border transition-all duration-200 hover:scale-[1.01]',
          BROKER_COLORS[broker.id]
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-semibold text-base">
              {broker.name}
            </CardTitle>
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-medium',
                STATUS_CONFIG[broker.status].className
              )}
            >
              <StatusIcon
                className={cn(
                  'w-3 h-3 mr-1',
                  broker.status === 'connecting' && 'animate-spin'
                )}
              />
              {STATUS_CONFIG[broker.status].label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {broker.status === 'connected' ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Holdings</p>
                  <p className="font-bold text-lg">
                    {brokerHoldings.length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Positions</p>
                  <p className="font-bold text-lg">
                    {brokerPositions.length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">P&L</p>
                  <p
                    className={cn(
                      'font-bold text-sm',
                      brokerPnl >= 0 ? 'text-emerald-500' : 'text-red-500'
                    )}
                  >
                    {brokerPnl >= 0 ? '+' : ''}
                    {brokerPnl.toFixed(0)}
                  </p>
                </div>
              </div>

              {broker.lastSync && (
                <p className="text-muted-foreground text-xs text-center">
                  Last sync:{' '}
                  {new Date(broker.lastSync).toLocaleTimeString('en-IN')}
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAuthDialog(true)}
              >
                <Zap className="w-3 h-3 mr-1" />
                Re-authenticate
              </Button>
            </>
          ) : (
            <>
              {broker.error && (
                <p className="text-destructive text-xs bg-destructive/10 rounded p-2">
                  {broker.error}
                </p>
              )}
              <Button
                className="w-full"
                onClick={() => setShowAuthDialog(true)}
              >
                Connect {broker.name}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <AuthDialog
        broker={broker}
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </>
  )
}
