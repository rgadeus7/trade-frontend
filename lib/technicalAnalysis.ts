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

  // Calculate VWAP (Volume Weighted Average Price)
  static calculateVWAP(high: number[], low: number[], close: number[], volume: number[]): number {
    if (high.length < 1 || low.length < 1 || close.length < 1 || volume.length < 1) return 0
    
    let cumulativeTPV = 0 // Total Price Volume
    let cumulativeVolume = 0
    
    for (let i = 0; i < close.length; i++) {
      const typicalPrice = (high[i] + low[i] + close[i]) / 3
      const priceVolume = typicalPrice * volume[i]
      
      cumulativeTPV += priceVolume
      cumulativeVolume += volume[i]
    }
    
    return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0
  }

  // Calculate Volume Profile
  static calculateVolumeProfile(high: number[], low: number[], close: number[], volume: number[], priceLevels: number = 10): {
    poc: number; // Point of Control
    valueArea: { upper: number; lower: number };
    volumeDistribution: { price: number; volume: number }[];
  } {
    if (high.length < 1 || low.length < 1 || close.length < 1 || volume.length < 1) {
      return {
        poc: 0,
        valueArea: { upper: 0, lower: 0 },
        volumeDistribution: []
      }
    }
    
    // Find price range
    const minPrice = Math.min(...low)
    const maxPrice = Math.max(...high)
    const priceRange = maxPrice - minPrice
    const priceStep = priceRange / priceLevels
    
    // Create price buckets
    const volumeBuckets: { [key: number]: number } = {}
    
    for (let i = 0; i < close.length; i++) {
      const typicalPrice = (high[i] + low[i] + close[i]) / 3
      const bucketIndex = Math.floor((typicalPrice - minPrice) / priceStep)
      const bucketPrice = minPrice + (bucketIndex * priceStep)
      
      volumeBuckets[bucketPrice] = (volumeBuckets[bucketPrice] || 0) + volume[i]
    }
    
    // Find Point of Control (highest volume price level)
    let poc = 0
    let maxVolume = 0
    
    for (const [price, vol] of Object.entries(volumeBuckets)) {
      if (vol > maxVolume) {
        maxVolume = vol
        poc = parseFloat(price)
      }
    }
    
    // Calculate Value Area (70% of volume)
    const totalVolume = Object.values(volumeBuckets).reduce((sum, vol) => sum + vol, 0)
    const valueAreaVolume = totalVolume * 0.7
    
    const sortedBuckets = Object.entries(volumeBuckets)
      .map(([price, volume]) => ({ price: parseFloat(price), volume }))
      .sort((a, b) => a.price - b.price)
    
    let cumulativeVolume = 0
    let valueAreaLower = poc
    let valueAreaUpper = poc
    
    // Find value area around POC
    for (let i = 0; i < sortedBuckets.length; i++) {
      cumulativeVolume += sortedBuckets[i].volume
      if (cumulativeVolume >= valueAreaVolume / 2) {
        valueAreaLower = sortedBuckets[i].price
        break
      }
    }
    
    cumulativeVolume = 0
    for (let i = sortedBuckets.length - 1; i >= 0; i--) {
      cumulativeVolume += sortedBuckets[i].volume
      if (cumulativeVolume >= valueAreaVolume / 2) {
        valueAreaUpper = sortedBuckets[i].price
        break
      }
    }
    
    return {
      poc,
      valueArea: { upper: valueAreaUpper, lower: valueAreaLower },
      volumeDistribution: sortedBuckets
    }
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
