export interface IndicatorCategory {
  description: string
  indicators: string[]
  statusValues: string[]
  buySignal: string
  sellSignal: string
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
    trend: IndicatorCategory
    momentum: IndicatorCategory
    volatility: IndicatorCategory
    volume: IndicatorCategory
    support_resistance: IndicatorCategory
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
export const getCategoryByIndicator = (indicatorName: string): string | null => {
  for (const [category, config] of Object.entries(tradingConfig.indicatorCategories)) {
    if (config.indicators.includes(indicatorName)) {
      return category
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
  return getIndicatorType(indicatorName) === 'trend'
}

export const isMomentumIndicator = (indicatorName: string): boolean => {
  return getIndicatorType(indicatorName) === 'momentum'
}

export const isVolatilityIndicator = (indicatorName: string): boolean => {
  return getIndicatorType(indicatorName) === 'volatility'
}

export const isVolumeIndicator = (indicatorName: string): boolean => {
  return getIndicatorType(indicatorName) === 'volume'
}

export const isSupportResistanceIndicator = (indicatorName: string): boolean => {
  return getIndicatorType(indicatorName) === 'support_resistance'
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

// Legacy compatibility (keeping old function names)
export const getDirectionalIndicators = () => tradingConfig.indicatorCategories.trend.indicators
export const getMomentumIndicators = () => tradingConfig.indicatorCategories.momentum.indicators

export const isDirectionalIndicator = (indicatorName: string): boolean => {
  return isTrendIndicator(indicatorName)
}

// Additional helper functions for the new framework
export const getIndicatorsByCategory = (category: string): string[] => {
  return tradingConfig.indicatorCategories[category as keyof typeof tradingConfig.indicatorCategories]?.indicators || []
}

export const getStatusValuesByCategory = (category: string): string[] => {
  return tradingConfig.indicatorCategories[category as keyof typeof tradingConfig.indicatorCategories]?.statusValues || []
}

export const getCategoryBuySignal = (category: string): string => {
  return tradingConfig.indicatorCategories[category as keyof typeof tradingConfig.indicatorCategories]?.buySignal || ''
}

export const getCategorySellSignal = (category: string): string => {
  return tradingConfig.indicatorCategories[category as keyof typeof tradingConfig.indicatorCategories]?.sellSignal || ''
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
