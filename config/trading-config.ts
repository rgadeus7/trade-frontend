export interface TradingConfig {
  indicators: {
    sma: {
      strengthThreshold: number
      description: string
    }
    rsi: {
      overbought: {
        strong: number
        moderate: number
      }
      bullish: {
        strong: number
        moderate: number
      }
      bearish: {
        strong: number
        moderate: number
      }
      oversold: {
        strong: number
        moderate: number
      }
      description: string
    }
    bollingerBands: {
      strengthThreshold: number
      description: string
    }
    priceAction: {
      strengthThreshold: number
      description: string
    }
    gapAnalysis: {
      strengthThreshold: number
      description: string
    }
  }
  statusMapping: {
    sma: {
      bullish: string
      bearish: string
    }
    rsi: {
      overbought: string
      bullish: string
      bearish: string
      oversold: string
    }
    bollingerBands: {
      overbought: string
      neutral: string
      oversold: string
    }
    priceAction: {
      bullish: string
      bearish: string
    }
  }
}

// Import the JSON config
import configData from './trading-config.json'

export const tradingConfig: TradingConfig = configData

// Helper functions to get config values
export const getConfig = () => tradingConfig

export const getSMAStrengthThreshold = () => tradingConfig.indicators.sma.strengthThreshold

export const getRSIThresholds = () => tradingConfig.indicators.rsi

export const getBollingerBandsStrengthThreshold = () => tradingConfig.indicators.bollingerBands.strengthThreshold

export const getPriceActionStrengthThreshold = () => tradingConfig.indicators.priceAction.strengthThreshold

export const getGapAnalysisStrengthThreshold = () => tradingConfig.indicators.gapAnalysis.strengthThreshold
