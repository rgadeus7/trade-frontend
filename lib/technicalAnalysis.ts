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

  // Calculate Murrey Math Lines (MML) levels
  static calculateMurreyMathLevels(high: number[], low: number[], frame: number = 64, multiplier: number = 1.5): {
    plus38: number;
    plus28: number;
    plus18: number;
    eightEight: number;
    sevenEight: number;
    sixEight: number;
    fiveEight: number;
    fourEight: number;
    threeEight: number;
    twoEight: number;
    oneEight: number;
    zeroEight: number;
    minus18: number;
    minus28: number;
    minus38: number;
  } {
    if (high.length < frame || low.length < frame) {
      return {
        plus38: 0, plus28: 0, plus18: 0, eightEight: 0, sevenEight: 0, sixEight: 0,
        fiveEight: 0, fourEight: 0, threeEight: 0, twoEight: 0, oneEight: 0, zeroEight: 0,
        minus18: 0, minus28: 0, minus38: 0
      }
    }

    const lookback = Math.round(frame * multiplier)
    const recentHigh = high.slice(-lookback)
    const recentLow = low.slice(-lookback)

    // Find highest/lowest price over specified lookback
    const vLow = Math.min(...recentLow)
    const vHigh = Math.max(...recentHigh)
    const vDist = vHigh - vLow

    // Handle negative prices
    const tmpHigh = vLow < 0 ? 0 - vLow : vHigh
    const tmpLow = vLow < 0 ? 0 - vLow - vDist : vLow
    const shift = vLow < 0

    // Calculate scale frame (SR)
    const logTen = Math.log(10)
    const log8 = Math.log(8)
    const log2 = Math.log(2)

    const sfVar = Math.log(0.4 * tmpHigh) / logTen - Math.floor(Math.log(0.4 * tmpHigh) / logTen)
    const SR = tmpHigh > 25 ? 
      sfVar > 0 ? Math.exp(logTen * (Math.floor(Math.log(0.4 * tmpHigh) / logTen) + 1)) : 
      Math.exp(logTen * Math.floor(Math.log(0.4 * tmpHigh) / logTen)) : 
      100 * Math.exp(log8 * Math.floor(Math.log(0.005 * tmpHigh) / log8))

    // Calculate N and M
    const nVar1 = Math.log(SR / (tmpHigh - tmpLow)) / log8
    const nVar2 = nVar1 - Math.floor(nVar1)
    const N = nVar1 <= 0 ? 0 : nVar2 === 0 ? Math.floor(nVar1) : Math.floor(nVar1) + 1

    // Calculate scale interval and frame
    const SI = SR * Math.exp(-N * log8)
    const M = Math.floor(1.0 / log2 * Math.log((tmpHigh - tmpLow) / SI) + 0.0000001)
    const I = Math.round((tmpHigh + tmpLow) * 0.5 / (SI * Math.exp((M - 1) * log2)))

    const Bot = (I - 1) * SI * Math.exp((M - 1) * log2)
    const Top = (I + 1) * SI * Math.exp((M - 1) * log2)

    // Determine if frame shift is required
    const doShift = tmpHigh - Top > 0.25 * (Top - Bot) || Bot - tmpLow > 0.25 * (Top - Bot)
    const ER = doShift ? 1 : 0

    const MM = ER === 0 ? M : ER === 1 && M < 2 ? M + 1 : 0
    const NN = ER === 0 ? N : ER === 1 && M < 2 ? N : N - 1

    // Recalculate if necessary
    const finalSI = ER === 1 ? SR * Math.exp(-NN * log8) : SI
    const finalI = ER === 1 ? Math.round((tmpHigh + tmpLow) * 0.5 / (finalSI * Math.exp((MM - 1) * log2))) : I
    const finalBot = ER === 1 ? (finalI - 1) * finalSI * Math.exp((MM - 1) * log2) : Bot
    const finalTop = ER === 1 ? (finalI + 1) * finalSI * Math.exp((MM - 1) * log2) : Top

    // Calculate increment
    const Increment = (finalTop - finalBot) / 8

    // Calculate absolute top
    const absTop = shift ? -(finalBot - 3 * Increment) : finalTop + 3 * Increment

    // Calculate all MML levels
    return {
      plus38: absTop,
      plus28: absTop - Increment,
      plus18: absTop - 2 * Increment,
      eightEight: absTop - 3 * Increment,
      sevenEight: absTop - 4 * Increment,
      sixEight: absTop - 5 * Increment,
      fiveEight: absTop - 6 * Increment,
      fourEight: absTop - 7 * Increment,
      threeEight: absTop - 8 * Increment,
      twoEight: absTop - 9 * Increment,
      oneEight: absTop - 10 * Increment,
      zeroEight: absTop - 11 * Increment,
      minus18: absTop - 12 * Increment,
      minus28: absTop - 13 * Increment,
      minus38: absTop - 14 * Increment
    }
  }

  // Check MML Overshoot conditions (resistance levels)
  static checkMMLOvershootConditions(currentPrice: number, mmlLevels: ReturnType<typeof TechnicalAnalysis.calculateMurreyMathLevels>): {
    isExtremeOvershoot: boolean;
    isOvershoot: boolean;
    isNormal: boolean;
  } {
    return {
      isExtremeOvershoot: currentPrice >= mmlLevels.plus28, // +2/8 and +3/8
      isOvershoot: currentPrice >= mmlLevels.plus18, // +1/8
      isNormal: currentPrice < mmlLevels.plus18
    }
  }

  // Check MML Oversold conditions (support levels)
  static checkMMLOversoldConditions(currentPrice: number, mmlLevels: ReturnType<typeof TechnicalAnalysis.calculateMurreyMathLevels>): {
    isExtremeOversold: boolean;
    isOversold: boolean;
    isNormal: boolean;
  } {
    return {
      isExtremeOversold: currentPrice <= mmlLevels.minus28, // -2/8 and -3/8
      isOversold: currentPrice <= mmlLevels.minus18, // -1/8
      isNormal: currentPrice > mmlLevels.minus18
    }
  }

  // Pivot-based Swing High/Low Detection (TradingView-style)
  static findPivotHighs(high: number[], leftLength: number = 10, rightLength: number = 10): { index: number; value: number }[] {
    if (high.length < leftLength + rightLength + 1) return []
    
    const pivotHighs: { index: number; value: number }[] = []
    
    for (let i = leftLength; i < high.length - rightLength; i++) {
      const currentValue = high[i]
      let isPivotHigh = true
      
      // Check left side
      for (let j = i - leftLength; j < i; j++) {
        if (high[j] >= currentValue) {
          isPivotHigh = false
          break
        }
      }
      
      // Check right side
      if (isPivotHigh) {
        for (let j = i + 1; j <= i + rightLength; j++) {
          if (high[j] >= currentValue) {
            isPivotHigh = false
            break
          }
        }
      }
      
      if (isPivotHigh) {
        pivotHighs.push({ index: i, value: currentValue })
      }
    }
    
    return pivotHighs
  }

  static findPivotLows(low: number[], leftLength: number = 10, rightLength: number = 10): { index: number; value: number }[] {
    if (low.length < leftLength + rightLength + 1) return []
    
    const pivotLows: { index: number; value: number }[] = []
    
    for (let i = leftLength; i < low.length - rightLength; i++) {
      const currentValue = low[i]
      let isPivotLow = true
      
      // Check left side
      for (let j = i - leftLength; j < i; j++) {
        if (low[j] <= currentValue) {
          isPivotLow = false
          break
        }
      }
      
      // Check right side
      if (isPivotLow) {
        for (let j = i + 1; j <= i + rightLength; j++) {
          if (low[j] <= currentValue) {
            isPivotLow = false
            break
          }
        }
      }
      
      if (isPivotLow) {
        pivotLows.push({ index: i, value: currentValue })
      }
    }
    
    return pivotLows
  }

  // Pivot Points Calculation
  static calculatePivotPoints(high: number, low: number, close: number): {
    pp: number; // Pivot Point
    r1: number; // Resistance 1
    r2: number; // Resistance 2
    r3: number; // Resistance 3
    s1: number; // Support 1
    s2: number; // Support 2
    s3: number; // Support 3
  } {
    const pp = (high + low + close) / 3
    const r1 = 2 * pp - low
    const s1 = 2 * pp - high
    const r2 = pp + (high - low)
    const s2 = pp - (high - low)
    const r3 = high + 2 * (pp - low)
    const s3 = low - 2 * (high - pp)
    
    return { pp, r1, r2, r3, s1, s2, s3 }
  }

  // Fibonacci Retracements
  static calculateFibonacciRetracements(swingHigh: number, swingLow: number): {
    level0: number; // 0% (swing high)
    level236: number; // 23.6%
    level382: number; // 38.2%
    level500: number; // 50%
    level618: number; // 61.8%
    level786: number; // 78.6%
    level100: number; // 100% (swing low)
  } {
    const range = swingHigh - swingLow
    
    return {
      level0: swingHigh,
      level236: swingHigh - (range * 0.236),
      level382: swingHigh - (range * 0.382),
      level500: swingHigh - (range * 0.5),
      level618: swingHigh - (range * 0.618),
      level786: swingHigh - (range * 0.786),
      level100: swingLow
    }
  }

  // Horizontal Support/Resistance Detection
  static findHorizontalLevels(high: number[], low: number[], close: number[], tolerance: number = 0.002): {
    resistance: number[];
    support: number[];
  } {
    const levels: { [key: number]: number } = {}
    
    // Group prices within tolerance
    for (let i = 0; i < close.length; i++) {
      const price = close[i]
      const roundedPrice = Math.round(price / tolerance) * tolerance
      
      if (!levels[roundedPrice]) {
        levels[roundedPrice] = 0
      }
      levels[roundedPrice]++
    }
    
    // Find levels with multiple touches (at least 2)
    const resistance: number[] = []
    const support: number[] = []
    
    for (const [price, touches] of Object.entries(levels)) {
      if (touches >= 2) {
        const priceValue = parseFloat(price)
        const currentPrice = close[close.length - 1]
        
        if (priceValue > currentPrice) {
          resistance.push(priceValue)
        } else {
          support.push(priceValue)
        }
      }
    }
    
    // Sort levels
    resistance.sort((a, b) => a - b)
    support.sort((a, b) => b - a)
    
    return { resistance, support }
  }

  // Check Support/Resistance conditions
  static checkSupportResistanceConditions(currentPrice: number, support: number[], resistance: number[], tolerance: number = 0.01): {
    nearSupport: boolean;
    nearResistance: boolean;
    atSupport: number | null;
    atResistance: number | null;
  } {
    let nearSupport = false
    let nearResistance = false
    let atSupport: number | null = null
    let atResistance: number | null = null
    
    // Check resistance levels
    for (const level of resistance) {
      const distance = Math.abs(currentPrice - level) / level
      if (distance <= tolerance) {
        nearResistance = true
        atResistance = level
        break
      }
    }
    
    // Check support levels
    for (const level of support) {
      const distance = Math.abs(currentPrice - level) / level
      if (distance <= tolerance) {
        nearSupport = true
        atSupport = level
        break
      }
    }
    
    return { nearSupport, nearResistance, atSupport, atResistance }
  }

  // Check Pivot Point conditions
  static checkPivotPointConditions(currentPrice: number, pivotPoints: ReturnType<typeof TechnicalAnalysis.calculatePivotPoints>): {
    abovePP: boolean;
    nearR1: boolean;
    nearR2: boolean;
    nearR3: boolean;
    nearS1: boolean;
    nearS2: boolean;
    nearS3: boolean;
  } {
    const tolerance = 0.005 // 0.5% tolerance
    
    return {
      abovePP: currentPrice > pivotPoints.pp,
      nearR1: Math.abs(currentPrice - pivotPoints.r1) / pivotPoints.r1 <= tolerance,
      nearR2: Math.abs(currentPrice - pivotPoints.r2) / pivotPoints.r2 <= tolerance,
      nearR3: Math.abs(currentPrice - pivotPoints.r3) / pivotPoints.r3 <= tolerance,
      nearS1: Math.abs(currentPrice - pivotPoints.s1) / pivotPoints.s1 <= tolerance,
      nearS2: Math.abs(currentPrice - pivotPoints.s2) / pivotPoints.s2 <= tolerance,
      nearS3: Math.abs(currentPrice - pivotPoints.s3) / pivotPoints.s3 <= tolerance
    }
  }
}

// Example usage:
// const prices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
// const sma20 = TechnicalAnalysis.calculateSMA(prices, 20)
// const rsi = TechnicalAnalysis.calculateRSI(prices, 14)
// const gap = TechnicalAnalysis.analyzeGap(110, 109)


