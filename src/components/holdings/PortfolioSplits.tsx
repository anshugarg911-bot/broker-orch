'use client'

import { useEffect, useMemo } from 'react'
import { useBrokerStore } from '@/store/brokerStore'
import { useHoldingsAnalysisStore } from '@/store/holdingsAnalysisStore'
import { classifyHoldings, computeAssetClassSplit, computeMarketCapSplit, computeSectorSplit } from '@/lib/classifications'
import { SplitDonutChart } from './SplitDonutChart'

export function PortfolioSplits() {
  const holdings = useBrokerStore((s) => s.holdings)
  const isLoading = useBrokerStore((s) => s.isLoadingHoldings)
  const classificationCache = useHoldingsAnalysisStore((s) => s.classificationCache)
  const cacheClassifications = useHoldingsAnalysisStore((s) => s.cacheClassifications)

  const { classified, unknown } = useMemo(
    () => classifyHoldings(holdings, classificationCache),
    [holdings, classificationCache]
  )

  // Fetch classifications for unknown symbols via Claude
  useEffect(() => {
    if (unknown.length === 0) return

    const controller = new AbortController()

    fetch('/api/analysis/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: unknown }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          cacheClassifications(res.data)
        }
      })
      .catch(() => {
        // Silently fail — defaults are already applied
      })

    return () => controller.abort()
  }, [unknown.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  const assetClassData = useMemo(() => computeAssetClassSplit(holdings, classified), [holdings, classified])
  const marketCapData = useMemo(() => computeMarketCapSplit(holdings, classified), [holdings, classified])
  const sectorData = useMemo(() => computeSectorSplit(holdings, classified), [holdings, classified])

  if (!holdings.length && !isLoading) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SplitDonutChart title="Asset Class" data={assetClassData} isLoading={isLoading} />
      <SplitDonutChart title="Market Cap" data={marketCapData} isLoading={isLoading} />
      <SplitDonutChart title="Sector" data={sectorData} isLoading={isLoading} />
    </div>
  )
}
