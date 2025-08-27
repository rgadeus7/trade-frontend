import { TechnicalAnalysis } from './technicalAnalysis'

// Simple test to verify the library is working
export function testTechnicalAnalysis() {
  console.log('Testing Technical Analysis Library...')
  
  // Sample price data
  const prices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120]
  
  // Test SMA
  const sma20 = TechnicalAnalysis.calculateSMA(prices, 20)
  console.log('SMA(20):', sma20)
  
  // Test EMA
  const ema20 = TechnicalAnalysis.calculateEMA(prices, 20)
  console.log('EMA(20):', ema20)
  
  // Test RSI
  const rsi = TechnicalAnalysis.calculateRSI(prices, 14)
  console.log('RSI(14):', rsi)
  
  // Test MACD
  const macd = TechnicalAnalysis.calculateMACD(prices)
  console.log('MACD:', macd)
  
  // Test Bollinger Bands
  const bb = TechnicalAnalysis.calculateBollingerBands(prices, 20)
  console.log('Bollinger Bands:', bb)
  
  // Test Gap Analysis
  const gap = TechnicalAnalysis.analyzeGap(110, 109)
  console.log('Gap Analysis:', gap)
  
  // Test Moving Average Conditions
  const maConditions = TechnicalAnalysis.checkMovingAverageConditions(120, sma20, ema20)
  console.log('MA Conditions:', maConditions)
  
  // Test RSI Conditions
  const rsiConditions = TechnicalAnalysis.checkRSIConditions(rsi)
  console.log('RSI Conditions:', rsiConditions)
  
  console.log('Technical Analysis Library Test Complete!')
  
  return {
    sma20,
    ema20,
    rsi,
    macd,
    bb,
    gap,
    maConditions,
    rsiConditions
  }
}

// Export for use in other files
export default testTechnicalAnalysis
