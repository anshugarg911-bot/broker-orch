import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {
  BrokerAccount,
  BrokerHolding,
  BrokerId,
  BrokerStatus,
  ConsolidatedPortfolio,
  MarginData,
  Position,
} from '@/types/broker'

interface BrokerState {
  // Broker accounts
  brokers: BrokerAccount[]
  activeBrokerId: BrokerId | null

  // Data
  holdings: BrokerHolding[]
  positions: Position[]
  margins: MarginData[]
  consolidatedPortfolio: ConsolidatedPortfolio | null

  // UI State
  isLoadingHoldings: boolean
  isLoadingPositions: boolean
  isLoadingMargins: boolean
  lastSyncedAt: string | null
  failedBrokers: BrokerId[]
  errors: Record<BrokerId, string>

  // Actions
  setBrokerStatus: (brokerId: BrokerId, status: BrokerStatus, error?: string) => void
  setActiveBroker: (brokerId: BrokerId) => void
  setHoldings: (holdings: BrokerHolding[]) => void
  setPositions: (positions: Position[]) => void
  setMargins: (margins: MarginData[]) => void
  setConsolidatedPortfolio: (portfolio: ConsolidatedPortfolio) => void
  setLoadingHoldings: (loading: boolean) => void
  setLoadingPositions: (loading: boolean) => void
  setLoadingMargins: (loading: boolean) => void
  addFailedBroker: (brokerId: BrokerId) => void
  clearFailedBrokers: () => void
  updateLastSynced: () => void
  reset: () => void
}

const DEFAULT_BROKERS: BrokerAccount[] = [
  {
    id: 'kite',
    name: 'Zerodha',
    logo: '/brokers/zerodha.svg',
    status: 'disconnected',
  },
  {
    id: 'dhan',
    name: 'Dhan',
    logo: '/brokers/dhan.svg',
    status: 'disconnected',
  },
  {
    id: 'groww',
    name: 'Groww',
    logo: '/brokers/groww.svg',
    status: 'disconnected',
  },
]

const initialState = {
  brokers: DEFAULT_BROKERS,
  activeBrokerId: null,
  holdings: [],
  positions: [],
  margins: [],
  consolidatedPortfolio: null,
  isLoadingHoldings: false,
  isLoadingPositions: false,
  isLoadingMargins: false,
  lastSyncedAt: null,
  failedBrokers: [] as BrokerId[],
  errors: {} as Record<BrokerId, string>,
}

export const useBrokerStore = create<BrokerState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setBrokerStatus: (brokerId, status, error) =>
          set((state) => ({
            brokers: state.brokers.map((b) =>
              b.id === brokerId ? { ...b, status, error } : b
            ),
            errors: error
              ? { ...state.errors, [brokerId]: error }
              : state.errors,
          })),

        setActiveBroker: (brokerId) => set({ activeBrokerId: brokerId }),

        setHoldings: (holdings) => set({ holdings }),

        setPositions: (positions) => set({ positions }),

        setMargins: (margins) => set({ margins }),

        setConsolidatedPortfolio: (portfolio) =>
          set({ consolidatedPortfolio: portfolio }),

        setLoadingHoldings: (isLoadingHoldings) => set({ isLoadingHoldings }),

        setLoadingPositions: (isLoadingPositions) => set({ isLoadingPositions }),

        setLoadingMargins: (isLoadingMargins) => set({ isLoadingMargins }),

        addFailedBroker: (brokerId) =>
          set((state) => ({
            failedBrokers: [...new Set([...state.failedBrokers, brokerId])],
          })),

        clearFailedBrokers: () => set({ failedBrokers: [] }),

        updateLastSynced: () =>
          set({ lastSyncedAt: new Date().toISOString() }),

        reset: () => set(initialState),
      }),
      {
        name: 'broker-orch-store',
        partialize: (state) => ({
          brokers: state.brokers,
          activeBrokerId: state.activeBrokerId,
          lastSyncedAt: state.lastSyncedAt,
        }),
      }
    )
  )
)

// Selectors
export const selectConnectedBrokers = (state: BrokerState) =>
  state.brokers.filter((b) => b.status === 'connected')

export const selectTotalPortfolioValue = (state: BrokerState) =>
  state.consolidatedPortfolio?.totalCurrentValue ?? 0

export const selectTotalPnl = (state: BrokerState) =>
  state.consolidatedPortfolio?.totalPnl ?? 0
