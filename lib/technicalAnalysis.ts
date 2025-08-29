import { SMA, EMA, RSI, MACD, BollingerBands, ATR, PSAR } from 'technicalindicators'

// Simple wrapper functions for common indicators
export class TechnicalAnalysis {
  
  // Calculate Simple Moving Average
  static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0
    
    const smaValues = SMA.calculate({ period, values: prices })
    return smaValues[smaValues.length - 1] || 0
  }

  // Calculate Exponential Moving Average
  static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return 0
    
    const emaValues = EMA.calculate({ period, values: prices })
    return emaValues[emaValues.length - 1] || 0
  }

  // Calculate RSI
  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50 // Neutral RSI if not enough data
    
    const rsiValues = RSI.calculate({ period, values: prices })
    return rsiValues[rsiValues.length - 1] || 50
  }

  // Calculate MACD
  static calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 }
    
    const macdValues = MACD.calculate({ 
      fastPeriod: 12, 
      slowPeriod: 26, 
      signalPeriod: 9, 
      values: prices,
      SimpleMAOscillator: true,
      SimpleMASignal: true
    })
    
    const lastMACD = macdValues[macdValues.length - 1]
    return {
      macd: lastMACD?.MACD || 0,
      signal: lastMACD?.signal || 0,
      histogram: lastMACD?.histogram || 0
    }
  }

  // Calculate Bollinger Bands
  static calculateBollingerBands(prices: number[], period: number = 20): { upper: number; middle: number; lower: number } {
    if (prices.length < period) return { upper: 0, middle: 0, lower: 0 }
    
    const bbValues = BollingerBands.calculate({ 
      period, 
      stdDev: 2, 
      values: prices 
    })
    
    const lastBB = bbValues[bbValues.length - 1]
    return {
      upper: lastBB?.upper || 0,
      middle: lastBB?.middle || 0,
      lower: lastBB?.lower || 0
    }
  }

  // Calculate ATR (Average True Range)
  static calculateATR(high: number[], low: number[], close: number[], period: number = 14): number {
    if (high.length < period + 1 || low.length < period + 1 || close.length < period + 1) return 0
    
    const atrValues = ATR.calculate({ 
      high, 
      low, 
      close, 
      period 
    })
    
    return atrValues[atrValues.length - 1] || 0
  }

  // Calculate PSAR (Parabolic SAR)
  static calculatePSAR(high: number[], low: number[], step: number = 0.02, max: number = 0.2): number {
    if (high.length < 2 || low.length < 2) return 0
    
    const psarValues = PSAR.calculate({ 
      high, 
      low, 
      step, 
      max 
    })
    
    return psarValues[psarValues.length - 1] || 0
  }

  // Simple gap analysis
  static analyzeGap(currentOpen: number, previousClose: number): { isGapUp: boolean; isGapDown: boolean; gapSize: number; gapPercentage: number } {
    const gapSize = currentOpen - previousClose
    const gapPercentage = (gapSize / previousClose) * 100
    
    return {
      isGapUp: gapSize > 0,
      isGapDown: gapSize < 0,
      gapSize: Math.abs(gapSize),
      gapPercentage: Math.abs(gapPercentage)
    }
  }

  // Check if price is above/below moving averages
  static checkMovingAverageConditions(currentPrice: number, sma89: number, ema20: number): {
    aboveSMA89: boolean;
    aboveEMA20: boolean;
  } {
    return {
      aboveSMA89: currentPrice > sma89,
      aboveEMA20: currentPrice > ema20
    }
  }

  // Check RSI conditions
  static checkRSIConditions(rsi: number): {
    isOverbought: boolean;
    isOversold: boolean;
    isNeutral: boolean;
  } {
    return {
      isOverbought: rsi > 70,
      isOversold: rsi < 30,
      isNeutral: rsi >= 30 && rsi <= 70
    }
  }

  // Check ATR conditions
  static checkATRConditions(atr: number, averageATR: number): {
    isHighVolatility: boolean;
    isLowVolatility: boolean;
    isNormalVolatility: boolean;
  } {
    const ratio = atr / averageATR
    return {
      isHighVolatility: ratio > 2,
      isLowVolatility: ratio < 0.5,
      isNormalVolatility: ratio >= 0.5 && ratio <= 2
    }
  }

  // Check PSAR conditions
  static checkPSARConditions(currentPrice: number, psar: number): {
    isBullish: boolean;
    isBearish: boolean;
  } {
    return {
      isBullish: currentPrice > psar,
      isBearish: currentPrice < psar
    }
  }
}

// Example usage:
// const prices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
// const sma20 = TechnicalAnalysis.calculateSMA(prices, 20)
// const rsi = TechnicalAnalysis.calculateRSI(prices, 14)
// const gap = TechnicalAnalysis.analyzeGap(110, 109)
