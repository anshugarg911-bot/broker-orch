'use client'

import { useBrokerStore } from '@/store/brokerStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Wallet } from 'lucide-react'

export default function MarginsPage() {
  const { margins } = useBrokerStore()

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold">Margins</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Available margin across all accounts
        </p>
      </div>

      {margins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Wallet className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No margin data. Connect a broker to see margins.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {margins.map((margin) => (
            <Card key={margin.brokerId}>
              <CardHeader>
                <CardTitle className="text-base capitalize">{margin.brokerId}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Available</span>
                  <span className="font-semibold text-emerald-500">{formatCurrency(margin.available)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Used</span>
                  <span className="font-semibold text-red-500">{formatCurrency(margin.used)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-muted-foreground text-sm">Total</span>
                  <span className="font-bold">{formatCurrency(margin.total)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((margin.available / margin.total) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xs text-center">
                  {((margin.available / margin.total) * 100).toFixed(1)}% available
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
