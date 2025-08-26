import { supabase } from './supabase'
import type { MarketData } from './supabase'

// Get market data for a symbol and timeframe
export async function getMarketData(symbol: string, timeframe: 'daily' | '2hour', limit: number = 300) {
  const { data, error } = await supabase
    .from('market_data')
    .select('*')
    .eq('symbol', symbol)
    .eq('timeframe', timeframe)
    .order('timestamp', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching market data:', error)
    throw error
  }
  
  return data as MarketData[]
}

// Note: Removed getLatestIndicators function - indicators are calculated on-demand

// Get latest market data for all symbols
export async function getLatestMarketData() {
  // Map display symbols to actual database symbols
  const symbolMap = {
    'SPY': 'SPY',
    'SPX': '$SPX.X',
    'ES': '@ES',
    'VIX': '$VIX.X'
  }

  const results: any[] = []

  for (const [displaySymbol, dbSymbol] of Object.entries(symbolMap)) {
    // Get daily data
    try {
      const dailyData = await getMarketData(dbSymbol, 'daily', 1)
      if (dailyData && dailyData.length > 0) {
        results.push({
          ...dailyData[0],
          displaySymbol,
          timeframe: 'daily'
        })
      }
    } catch (error) {
      console.error(`Error fetching daily data for ${displaySymbol}:`, error)
    }

    // Get 2-hour data
    try {
      const hourlyData = await getMarketData(dbSymbol, '2hour', 1)
      if (hourlyData && hourlyData.length > 0) {
        results.push({
          ...hourlyData[0],
          displaySymbol,
          timeframe: '2hour'
        })
      }
    } catch (error) {
      console.error(`Error fetching 2-hour data for ${displaySymbol}:`, error)
    }
  }

  return results
}

export async function insertMarketData(data: Omit<MarketData, 'id' | 'created_at'>[]) {
  const { error } = await supabase
    .from('market_data')
    .upsert(data, { onConflict: 'symbol,timeframe,timestamp' })
  
  if (error) {
    console.error('Error inserting market data:', error)
    throw error
  }
  
  return { success: true }
}

// Note: Removed insertIndicators function - indicators are calculated on-demand

// Calculate technical indicators on-demand
function calculateIndicators(data: MarketData[], timeframe: 'daily' | '2hour' = 'daily') {
  if (data.length === 0) return { sma89: 0, ema89: 0, sma2h: 0 }

  const prices = data.map(d => d.close).reverse() // Reverse to get chronological order

  // Calculate SMA
  const calculateSMA = (prices: number[], period: number) => {
    if (prices.length < period) {
      const sum = prices.reduce((a, b) => a + b, 0)
      return sum / prices.length
    }
    const recentPrices = prices.slice(-period)
    const sum = recentPrices.reduce((a, b) => a + b, 0)
    return sum / period
  }

  // Calculate EMA
  const calculateEMA = (prices: number[], period: number) => {
    if (prices.length === 0) return 0
    
    if (prices.length < period) {
      const sum = prices.reduce((a, b) => a + b, 0)
      return sum / prices.length
    }
    
    const multiplier = 2 / (period + 1)
    const initialSMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
    let ema = initialSMA
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
    }
    
    return ema
  }

  // Use 89-period SMA for both timeframes
  if (timeframe === 'daily') {
    return {
      sma89: calculateSMA(prices, 89),
      ema89: calculateEMA(prices, 89),
      sma2h: 0 // Not applicable for daily data
    }
  } else {
    // For 2-hour data, also use 89-period SMA
    return {
      sma89: 0, // Not applicable for 2-hour data
      ema89: 0, // Not applicable for 2-hour data
      sma2h: calculateSMA(prices, 89) // Use 89-period SMA for 2-hour data
    }
  }
}

// Get data for dashboard display with on-demand indicator calculation
export async function getDashboardData() {
  try {
    const latestData = await getLatestMarketData()
    
    // Map display symbols to actual database symbols
    const symbolMap = {
      'SPY': 'SPY',
      'SPX': '$SPX.X',
      'ES': '@ES',
      'VIX': '$VIX.X'
    }
    
    // Calculate indicators on-demand for each symbol
    const dashboardData = await Promise.all(
      ['SPY', 'SPX', 'ES', 'VIX'].map(async (displaySymbol) => {
        const dbSymbol = symbolMap[displaySymbol as keyof typeof symbolMap]
        
                 // Get historical data for both timeframes (300 records is more than enough for 89-period SMA)
         const dailyHistoricalData = await getMarketData(dbSymbol, 'daily', 300)
         const hourlyHistoricalData = await getMarketData(dbSymbol, '2hour', 300)
         
         // Calculate indicators separately for each timeframe
         const dailyIndicators = calculateIndicators(dailyHistoricalData, 'daily')
         const hourlyIndicators = calculateIndicators(hourlyHistoricalData, '2hour')
         
                   // Debug logging for VIX - commented out for clean console
          // if (displaySymbol === 'VIX') {
          //   console.log(`VIX Debug - Daily data count: ${dailyHistoricalData.length}, Hourly data count: ${hourlyHistoricalData.length}`)
          //   console.log(`VIX Debug - Daily indicators:`, dailyIndicators)
          //   console.log(`VIX Debug - Hourly indicators:`, hourlyIndicators)
          // }
        
        const dailyData = latestData.find(d => d.displaySymbol === displaySymbol && d.timeframe === 'daily')
        const hourlyData = latestData.find(d => d.displaySymbol === displaySymbol && d.timeframe === '2hour')
        
                           return {
           symbol: displaySymbol,
           instrumentType: displaySymbol as 'SPY' | 'SPX' | 'ES' | 'VIX',
         daily: dailyData ? {
           price: dailyData.close,
           change: 0, // Calculate from previous data
           volume: dailyData.volume,
           timestamp: dailyData.timestamp
         } : null,
         hourly: hourlyData ? {
           price: hourlyData.close,
           change: 0, // Calculate from previous data
           volume: hourlyData.volume,
           timestamp: hourlyData.timestamp
         } : null,
         sma89: dailyIndicators.sma89 || 0, // From daily data, fallback to 0
         ema89: dailyIndicators.ema89 || 0, // From daily data, fallback to 0
         sma2h: hourlyIndicators.sma2h || 0 // From 2-hour data, fallback to 0
       }
      })
    )
    
    return dashboardData
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    throw error
  }
}
