'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingUp,
  Activity,
  Settings,
  Wallet,
  BarChart2,
} from 'lucide-react'
import { useBrokerStore } from '@/store/brokerStore'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/holdings', label: 'Holdings', icon: TrendingUp },
  { href: '/positions', label: 'Positions', icon: Activity },
  { href: '/margins', label: 'Margins', icon: Wallet },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { brokers } = useBrokerStore()
  const connectedCount = brokers.filter((b) => b.status === 'connected').length

  return (
    <aside className="w-60 min-h-screen bg-card border-r flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">Broker Orch</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">
              {connectedCount} broker{connectedCount !== 1 ? 's' : ''} connected
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Broker Status Footer */}
      <div className="p-4 border-t">
        <div className="space-y-2">
          {brokers.map((broker) => (
            <div key={broker.id} className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">{broker.name}</span>
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  broker.status === 'connected' && 'bg-emerald-400',
                  broker.status === 'disconnected' && 'bg-muted-foreground/30',
                  broker.status === 'connecting' && 'bg-amber-400 animate-pulse',
                  broker.status === 'error' && 'bg-destructive'
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
