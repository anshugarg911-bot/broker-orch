'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { CHART_COLORS, getChartColor } from '@/lib/analytics'
import type { SplitChartData } from '@/types/holdings-analysis'

interface SplitDonutChartProps {
  title: string
  data: SplitChartData[]
  isLoading?: boolean
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: SplitChartData }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{d.name}</p>
      <p className="text-muted-foreground">{formatCurrency(d.value)}</p>
      <p className="text-muted-foreground">{d.percentage.toFixed(1)}% · {d.count} stock{d.count !== 1 ? 's' : ''}</p>
    </div>
  )
}

export function SplitDonutChart({ title, data, isLoading }: SplitDonutChartProps) {
  if (isLoading) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!data.length) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs text-center py-8">No data</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={getChartColor(i)} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-1">
          {data.slice(0, 5).map((d, i) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: getChartColor(i) }}
                />
                <span className="text-muted-foreground truncate max-w-[100px]">{d.name}</span>
              </div>
              <span className="font-mono text-foreground">{d.percentage.toFixed(1)}%</span>
            </div>
          ))}
          {data.length > 5 && (
            <p className="text-muted-foreground text-[10px] text-center">+{data.length - 5} more</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
