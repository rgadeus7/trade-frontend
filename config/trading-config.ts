export interface IndicatorSubcategory {
  description: string
  indicators: string[]
  statusValues: string[]
  buySignal: string
  sellSignal: string
}

export interface IndicatorCategory {
  description: string
  subcategories: {
    [key: string]: IndicatorSubcategory
  }
}

export interface ConfigurableThresholds {
  bullishThreshold?: string
  bearishThreshold?: string
  neutralThreshold?: string
  overbought?: {
    strong: number
    moderate: number
    weak?: number
  } | string
  oversold?: {
    strong: number
    moderate: number
    weak?: number
  } | string
  neutral?: {
    upper: number
    lower: number
  } | string
  highVolume?: string
  lowVolume?: string
  normalVolume?: string
  highVolatility?: string
  lowVolatility?: string
  normalVolatility?: string
  strongTrend?: string
  weakTrend?: string
  trending?: string
  gapUp?: string
  gapDown?: string
  noGap?: string
  bullish?: string
  bearish?: string
  strongBullish?: string
  strongBearish?: string
  squeeze?: string
  volumeThreshold?: number
  lookbackPeriod?: number
  frame?: number
  multiplier?: number
  ignoreWicks?: boolean
  showHistoricalLevels?: boolean
  threshold?: number
  // Support/Resistance specific properties
  minSwingStrength?: number
  tolerance?: number
  minTouches?: number
  keyLevels?: string
  nearResistance?: string
  nearSupport?: string
  useSophisticatedDetection?: boolean
  leftLength?: number
  rightLength?: number
  usePivotDetection?: boolean
  // Delta Analysis specific properties
  periods?: Record<string, number>
  thresholds?: Record<string, Record<string, number>>
}

export interface Indicator {
  type: string
  periods?: number[]
  fastPeriod?: number
  slowPeriod?: number
  signalPeriod?: number
  kPeriod?: number
  dPeriod?: number
  stdDev?: number
  strengthThreshold?: number
  description: string
  configurable: ConfigurableThresholds
}

export interface SignalLogic {
  buyConditions: {
    primary: string[]
    secondary: string[]
    strongBuy: string[]
  }
  sellConditions: {
    primary: string[]
    secondary: string[]
    strongSell: string[]
  }
  neutralConditions: string[]
}

export interface TimeframeAnalysis {
  description: string
  weight: number
  indicators: string[]
}

export interface RiskManagement {
  stopLoss: {
    percentage: number
    atrMultiplier: number
    supportLevel: boolean
  }
  takeProfit: {
    riskRewardRatio: number
    resistanceLevel: boolean
    trailingStop: boolean
  }
  positionSizing: {
    maxRiskPerTrade: number
    maxPortfolioRisk: number
  }
}

export interface TradingConfig {
  indicatorCategories: {
    technical: IndicatorCategory
    'price-action': IndicatorCategory
  }
  indicators: {
    [key: string]: Indicator
  }
  signalLogic: SignalLogic
  timeframeAnalysis: {
    monthly: TimeframeAnalysis
    weekly: TimeframeAnalysis
    daily: TimeframeAnalysis
    hourly: TimeframeAnalysis
  }
  riskManagement: RiskManagement
}

// Import the JSON config
import configData from './trading-config.json'

export const tradingConfig: TradingConfig = configData

// Helper functions to get config values
export const getConfig = () => tradingConfig

// Category helpers
export const getIndicatorCategories = () => tradingConfig.indicatorCategories

export const getCategoryByIndicator = (indicatorName: string): { category: string; subcategory: string } | null => {
  for (const [category, config] of Object.entries(tradingConfig.indicatorCategories)) {
    if (category === 'technical') {
      for (const [subcategory, subConfig] of Object.entries(config.subcategories)) {
        if (subConfig.indicators.includes(indicatorName)) {
          return { category, subcategory }
        }
      }
    } else if (category === 'price-action') {
      for (const [subcategory, subConfig] of Object.entries(config.subcategories)) {
        if (subConfig.indicators.includes(indicatorName)) {
          return { category, subcategory }
        }
      }
    }
  }
  return null
}

// Indicator helpers
export const getIndicator = (indicatorName: string): Indicator | null => {
  return tradingConfig.indicators[indicatorName] || null
}

export const getIndicatorType = (indicatorName: string): string | null => {
  const indicator = getIndicator(indicatorName)
  return indicator?.type || null
}

export const isTrendIndicator = (indicatorName: string): boolean => {
  const categoryInfo = getCategoryByIndicator(indicatorName)
  return categoryInfo?.subcategory === 'directional'
}

export const isMomentumIndicator = (indicatorName: string): boolean => {
  const categoryInfo = getCategoryByIndicator(indicatorName)
  return categoryInfo?.subcategory === 'momentum'
}

export const isVolatilityIndicator = (indicatorName: string): boolean => {
  const categoryInfo = getCategoryByIndicator(indicatorName)
  return categoryInfo?.subcategory === 'volatility'
}

export const isPriceActionIndicator = (indicatorName: string): boolean => {
  const categoryInfo = getCategoryByIndicator(indicatorName)
  return categoryInfo?.category === 'price-action'
}

// Threshold helpers
export const getSMAStrengthThreshold = (): number => {
  return tradingConfig.indicators.sma.strengthThreshold || 0.02
}

export const getRSIThresholds = () => {
  return tradingConfig.indicators.rsi.configurable
}

export const getBollingerBandsConfig = () => {
  return tradingConfig.indicators.bollingerBands
}

export const getBollingerBandsPeriods = (): number[] => {
  return tradingConfig.indicators.bollingerBands.periods || [20]
}

export const getVWAPLookbackPeriod = (): number => {
  return tradingConfig.indicators.vwap.configurable.lookbackPeriod || 20
}

export const getVolumeProfileLookbackPeriod = (): number => {
  return tradingConfig.indicators.volumeProfile.configurable.lookbackPeriod || 50
}

export const getMMLOvershootLookbackPeriod = (): number => {
  return tradingConfig.indicators.mmlOvershoot.configurable.lookbackPeriod || 24
}

export const getMMLOversoldLookbackPeriod = (): number => {
  return tradingConfig.indicators.mmlOversold.configurable.lookbackPeriod || 24
}

export const getMMLOvershootFrame = (): number => {
  return tradingConfig.indicators.mmlOvershoot.configurable.frame || 16
}

export const getMMLOversoldFrame = (): number => {
  return tradingConfig.indicators.mmlOversold.configurable.frame || 16
}

export const getMMLOvershootMultiplier = (): number => {
  return tradingConfig.indicators.mmlOvershoot.configurable.multiplier || 1.5
}

export const getMMLOversoldMultiplier = (): number => {
  return tradingConfig.indicators.mmlOversold.configurable.multiplier || 1.5
}

export const getMMLOvershootIgnoreWicks = (): boolean => {
  return tradingConfig.indicators.mmlOvershoot.configurable.ignoreWicks || true
}

export const getMMLOversoldIgnoreWicks = (): boolean => {
  return tradingConfig.indicators.mmlOversold.configurable.ignoreWicks || true
}

export const getMMLOvershootShowHistoricalLevels = (): boolean => {
  return tradingConfig.indicators.mmlOvershoot.configurable.showHistoricalLevels || false
}

export const getMMLOversoldShowHistoricalLevels = (): boolean => {
  return tradingConfig.indicators.mmlOversold.configurable.showHistoricalLevels || false
}

// ATR helper functions
export const getATRPeriods = (): number[] => {
  return tradingConfig.indicators.atr.periods || [14, 21]
}

export const getATRPrimaryPeriod = (): number => {
  const periods = getATRPeriods()
  return periods[0] || 14
}

export const getATRComparisonPeriod = (): number => {
  const periods = getATRPeriods()
  return periods[1] || 21
}

// ROC helper functions
export const getROCPeriods = (): Record<string, number> => {
  return tradingConfig.indicators.roc.configurable.periods || {
    daily: 10,
    '2hour': 10,
    weekly: 5,
    monthly: 3
  }
}

export const getROCPeriod = (timeframe: string): number => {
  const periods = getROCPeriods()
  return periods[timeframe as keyof typeof periods] || 10
}

// SMA Distance helper functions
export const getSMADistanceThresholds = (): Record<string, Record<string, number>> => {
  return tradingConfig.indicators.smaDistance.configurable.thresholds || {
    daily: { 20: 0.05, 50: 0.08, 89: 0.12, 200: 0.20 },
    '2hour': { 20: 0.03, 50: 0.05, 89: 0.08, 200: 0.15 },
    weekly: { 20: 0.08, 50: 0.12, 89: 0.18, 200: 0.25 },
    monthly: { 20: 0.12, 50: 0.18, 89: 0.25, 200: 0.35 }
  }
}

export const getSMADistanceThreshold = (timeframe: string, smaPeriod: number): number => {
  const thresholds = getSMADistanceThresholds()
  const timeframeThresholds = thresholds[timeframe as keyof typeof thresholds]
  return timeframeThresholds?.[smaPeriod] || 0.10 // Default 10%
}



// Signal logic helpers
export const getBuyConditions = () => tradingConfig.signalLogic.buyConditions
export const getSellConditions = () => tradingConfig.signalLogic.sellConditions
export const getNeutralConditions = () => tradingConfig.signalLogic.neutralConditions

// Timeframe helpers
export const getTimeframeAnalysis = () => tradingConfig.timeframeAnalysis
export const getTimeframeWeight = (timeframe: string): number => {
  return tradingConfig.timeframeAnalysis[timeframe as keyof typeof tradingConfig.timeframeAnalysis]?.weight || 0
}

// Risk management helpers
export const getRiskManagement = () => tradingConfig.riskManagement

// New helper functions for the config-based framework
export const getIndicatorsByCategory = (category: string, subcategory?: string): string[] => {
  const categoryConfig = tradingConfig.indicatorCategories[category as keyof typeof tradingConfig.indicatorCategories]
  if (categoryConfig && subcategory) {
    return categoryConfig.subcategories[subcategory]?.indicators || []
  }
  return []
}

export const getStatusValuesByCategory = (category: string, subcategory?: string): string[] => {
  const categoryConfig = tradingConfig.indicatorCategories[category as keyof typeof tradingConfig.indicatorCategories]
  if (categoryConfig && subcategory) {
    return categoryConfig.subcategories[subcategory]?.statusValues || []
  }
  return []
}

export const getCategoryBuySignal = (category: string, subcategory?: string): string => {
  const categoryConfig = tradingConfig.indicatorCategories[category as keyof typeof tradingConfig.indicatorCategories]
  if (categoryConfig && subcategory) {
    return categoryConfig.subcategories[subcategory]?.buySignal || ''
  }
  return ''
}

export const getCategorySellSignal = (category: string, subcategory?: string): string => {
  const categoryConfig = tradingConfig.indicatorCategories[category as keyof typeof tradingConfig.indicatorCategories]
  if (categoryConfig && subcategory) {
    return categoryConfig.subcategories[subcategory]?.sellSignal || ''
  }
  return ''
}

// Helper function to get all subcategories for a category
export const getSubcategoriesByCategory = (category: string): string[] => {
  const categoryConfig = tradingConfig.indicatorCategories[category as keyof typeof tradingConfig.indicatorCategories]
  if (categoryConfig) {
    return Object.keys(categoryConfig.subcategories)
  }
  return []
}

// New function to get indicator categorization from config
export const getIndicatorCategorization = (indicatorId: string): { category: string; subcategory: string } | null => {
  return getCategoryByIndicator(indicatorId)
}

// Legacy functions for backward compatibility
export const getBollingerBandsStrengthThreshold = (): number => {
  return tradingConfig.indicators.bollingerBands.strengthThreshold || 0.01
}

export const getPriceActionStrengthThreshold = (): number => {
  return tradingConfig.indicators.priceAction.strengthThreshold || 0.01
}

// Support/Resistance helper functions
export const getSwingHighLowLeftLength = (): number => {
  return tradingConfig.indicators.swingHighLow?.configurable?.leftLength || 10
}

export const getSwingHighLowRightLength = (): number => {
  return tradingConfig.indicators.swingHighLow?.configurable?.rightLength || 10
}

export const getSwingHighLowMinStrength = (): number => {
  return tradingConfig.indicators.swingHighLow?.configurable?.minSwingStrength || 0.01
}

export const getSwingHighLowUsePivotDetection = (): boolean => {
  return tradingConfig.indicators.swingHighLow?.configurable?.usePivotDetection || true
}

export const getPivotPointsTolerance = (): number => {
  return tradingConfig.indicators.pivotPoints?.configurable?.tolerance || 0.005
}

export const getFibonacciTolerance = (): number => {
  return tradingConfig.indicators.fibonacciRetracements?.configurable?.tolerance || 0.01
}

export const getHorizontalLevelsTolerance = (): number => {
  return tradingConfig.indicators.horizontalLevels?.configurable?.tolerance || 0.002
}

export const getHorizontalLevelsMinTouches = (): number => {
  return tradingConfig.indicators.horizontalLevels?.configurable?.minTouches || 2
}
