import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { BrokerId } from '@/types/broker'
import type {
  TechnicalIndicators,
  FundamentalHealth,
  AnalystSignal,
  StockClassification,
} from '@/types/holdings-analysis'

interface HoldingsAnalysisState {
  // API Key (client only knows if it's set, not the value)
  isAnthropicKeySet: boolean

  // Selected holding
  selectedSymbol: string | null
  selectedBrokerId: BrokerId | null
  isPanelOpen: boolean

  // Classification cache (Claude-classified unknowns)
  classificationCache: Record<string, StockClassification>

  // Side panel data
  technicalIndicators: TechnicalIndicators | null
  fundamentalHealth: FundamentalHealth | null
  analystSignals: AnalystSignal[]

  // Loading states
  isLoadingTechnical: boolean
  isLoadingFundamental: boolean
  isLoadingAnalyst: boolean

  // Actions
  selectHolding: (symbol: string, brokerId: BrokerId) => void
  closePanel: () => void
  setTechnicalIndicators: (data: TechnicalIndicators | null) => void
  setFundamentalHealth: (data: FundamentalHealth | null) => void
  addAnalystSignal: (signal: AnalystSignal) => void
  clearAnalystSignals: () => void
  setLoadingTechnical: (loading: boolean) => void
  setLoadingFundamental: (loading: boolean) => void
  setLoadingAnalyst: (loading: boolean) => void
  cacheClassification: (symbol: string, classification: StockClassification) => void
  cacheClassifications: (classifications: Record<string, StockClassification>) => void
  setAnthropicKeySet: (isSet: boolean) => void
}

export const useHoldingsAnalysisStore = create<HoldingsAnalysisState>()(
  devtools(
    persist(
      (set) => ({
        isAnthropicKeySet: false,

        selectedSymbol: null,
        selectedBrokerId: null,
        isPanelOpen: false,

        classificationCache: {},

        technicalIndicators: null,
        fundamentalHealth: null,
        analystSignals: [],

        isLoadingTechnical: false,
        isLoadingFundamental: false,
        isLoadingAnalyst: false,

        selectHolding: (symbol, brokerId) =>
          set({
            selectedSymbol: symbol,
            selectedBrokerId: brokerId,
            isPanelOpen: true,
            technicalIndicators: null,
            fundamentalHealth: null,
            analystSignals: [],
            isLoadingTechnical: true,
            isLoadingFundamental: false,
            isLoadingAnalyst: false,
          }),

        closePanel: () =>
          set({
            isPanelOpen: false,
            selectedSymbol: null,
            selectedBrokerId: null,
            technicalIndicators: null,
            fundamentalHealth: null,
            analystSignals: [],
            isLoadingTechnical: false,
            isLoadingFundamental: false,
            isLoadingAnalyst: false,
          }),

        setTechnicalIndicators: (data) =>
          set({ technicalIndicators: data, isLoadingTechnical: false }),

        setFundamentalHealth: (data) =>
          set({ fundamentalHealth: data, isLoadingFundamental: false }),

        addAnalystSignal: (signal) =>
          set((state) => ({ analystSignals: [...state.analystSignals, signal] })),

        clearAnalystSignals: () => set({ analystSignals: [] }),

        setLoadingTechnical: (loading) => set({ isLoadingTechnical: loading }),
        setLoadingFundamental: (loading) => set({ isLoadingFundamental: loading }),
        setLoadingAnalyst: (loading) => set({ isLoadingAnalyst: loading }),

        cacheClassification: (symbol, classification) =>
          set((state) => ({
            classificationCache: { ...state.classificationCache, [symbol]: classification },
          })),

        cacheClassifications: (classifications) =>
          set((state) => ({
            classificationCache: { ...state.classificationCache, ...classifications },
          })),

        setAnthropicKeySet: (isSet) => set({ isAnthropicKeySet: isSet }),
      }),
      {
        name: 'holdings-analysis-store',
        partialize: (state) => ({
          classificationCache: state.classificationCache,
          isAnthropicKeySet: state.isAnthropicKeySet,
        }),
      }
    ),
    { name: 'HoldingsAnalysis' }
  )
)
