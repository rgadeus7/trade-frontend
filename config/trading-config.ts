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

export const getMACDConfig = () => {
  return tradingConfig.indicators.macd
}

export const getStochConfig = () => {
  return tradingConfig.indicators.stoch
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

export const getGapAnalysisStrengthThreshold = (): number => {
  return tradingConfig.indicators.gapAnalysis.strengthThreshold || 0.01
}
