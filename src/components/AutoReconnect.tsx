'use client'

import { useEffect, useRef } from 'react'
import { useBrokerStore } from '@/store/brokerStore'
import { normalizePortfolioResponse, normalizePositionsResponse } from '@/lib/normalizers'
import type { BrokerId } from '@/types/broker'

export function AutoReconnect() {
  const hasRun = useRef(false)
  const {
    setBrokerStatus,
    setHoldings,
    setPositions,
    setLoadingHoldings,
    updateLastSynced,
  } = useBrokerStore()

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    async function reconnect() {
      try {
        const res = await fetch('/api/db/auto-reconnect', { method: 'POST' })
        const data = await res.json()

        if (!data.success || !data.data?.reconnected?.length) return

        const connected: BrokerId[] = []

        for (const result of data.data.reconnected) {
          if (result.status === 'connected') {
            setBrokerStatus(result.broker as BrokerId, 'connected')
            connected.push(result.broker as BrokerId)
          }
        }

        if (connected.length === 0) return

        // Auto-sync holdings and positions for reconnected brokers
        setLoadingHoldings(true)
        try {
          const allHoldings: ReturnType<typeof normalizePortfolioResponse> = []
          const allPositions: ReturnType<typeof normalizePositionsResponse> = []

          await Promise.all(
            connected.map(async (brokerId) => {
              try {
                const [holdRes, posRes] = await Promise.all([
                  fetch(`/api/mcp/portfolio?broker=${brokerId}`),
                  fetch(`/api/mcp/positions?broker=${brokerId}`),
                ])
                if (holdRes.ok) {
                  const json = await holdRes.json()
                  if (json.data) allHoldings.push(...normalizePortfolioResponse(json.data, brokerId))
                }
                if (posRes.ok) {
                  const json = await posRes.json()
                  if (json.data) allPositions.push(...normalizePositionsResponse(json.data, brokerId))
                }
              } catch {
                // Individual broker sync failure is non-critical
              }
            })
          )

          if (allHoldings.length > 0) setHoldings(allHoldings)
          if (allPositions.length > 0) setPositions(allPositions)
          updateLastSynced()
        } finally {
          setLoadingHoldings(false)
        }
      } catch {
        // Auto-reconnect is non-critical — user can manually connect
      }
    }

    reconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
