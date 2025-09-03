import { supabase } from './supabase'
import type { MarketData } from './supabase'

// Timeframe mapping to match backend schema
const TIMEFRAME_MAP = {
  // Daily timeframes
  'daily': 1,
  '1D': 1,
  '1d': 1,
  
  // Hourly timeframes  
  '2hour': 120,
  '2h': 120,
  '2H': 120,
  '1hour': 60,
  '1h': 60,
  '1H': 60,
  
  // Minute timeframes (for future support)
  '15min': 15,
  '15minute': 15,
  '30min': 30,
  '30minute': 30,
  '60min': 60,
  '60minute': 60,
  
  // Weekly timeframes
  'weekly': 7,
  '1W': 7,
  '1w': 7,
  '7D': 7,
  '7d': 7,
  
  // Monthly timeframes
  'monthly': 30,
  '1M': 30,
  '1m': 30,
  '30D': 30,
  '30d': 30
} as const

// Get SMA periods from trading config
function getSMAPeriods(): number[] {
  try {
    // Import the config dynamically to avoid circular dependencies
    const config = require('../config/trading-config.json')
    return config.indicators.sma.periods || [20, 50, 89, 200]
  } catch (error) {
    console.warn('Could not load SMA periods from config, using defaults:', error)
    return [20, 50, 89, 200]
  }
}

// Convert timeframe string to integer
function getTimeframeValue(timeframe: string): number {
  const value = TIMEFRAME_MAP[timeframe as keyof typeof TIMEFRAME_MAP]
  if (value === undefined) {
    throw new Error(`Invalid timeframe: ${timeframe}. Supported values: ${Object.keys(TIMEFRAME_MAP).join(', ')}`)
  }
  return value
}

// Get display name for timeframe value
export function getTimeframeDisplayName(timeframeValue: number): string {
  for (const [key, value] of Object.entries(TIMEFRAME_MAP)) {
    if (value === timeframeValue) {
      return key
    }
  }
  return `Unknown (${timeframeValue})`
}

// Get all supported timeframes
export function getSupportedTimeframes(): string[] {
  return Object.keys(TIMEFRAME_MAP)
}

// Get available symbols for the dashboard
export function getAvailableSymbols() {
  return [
    { value: 'SPX', label: 'SPX', description: 'S&P 500 Index' },
    { value: 'SPY', label: 'SPY', description: 'SPDR S&P 500 ETF' },
    { value: 'ES', label: 'ES', description: 'E-mini S&P 500 Futures' },
    { value: 'VIX', label: 'VIX', description: 'Volatility Index' }
  ]
}

// Get market data for a symbol and timeframe
export async function getMarketData(symbol: string, timeframe: string, limit: number = 300) {
  const timeframeValue = getTimeframeValue(timeframe)
  
  console.log(`🔍 Fetching market data: ${symbol}, timeframe: ${timeframe} -> ${timeframeValue}`)
  
  // For daily, weekly, monthly - we need to query by timeframe_unit
  let query = supabase
    .from('market_data')
    .select('*')
    .eq('symbol', symbol)
    .order('timestamp', { ascending: false })
    .limit(limit)
  
  if (timeframe === 'daily') {
    query = query.eq('timeframe_unit', 'Daily')
  } else if (timeframe === 'weekly') {
    query = query.eq('timeframe_unit', 'Weekly')
  } else if (timeframe === 'monthly') {
    query = query.eq('timeframe_unit', 'Monthly')
  } else if (timeframe === '2h' || timeframe === '2hour') {
    query = query.eq('timeframe_unit', 'Minute').eq('timeframe', 120)
  } else {
    // For other intraday data, use the timeframe integer
    query = query.eq('timeframe', timeframeValue)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error(`❌ Error fetching market data for ${symbol} (${timeframe}):`, error)
    throw error
  }
  
  console.log(`✅ Fetched ${data?.length || 0} records for ${symbol} (${timeframe})`)
  return data as MarketData[]
}



// Note: Removed getLatestIndicators function - indicators are calculated on-demand
// Note: Removed getLatestMarketData function - now using historical data for both display and indicators

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
export function calculateIndicators(data: MarketData[], timeframe: string = 'daily') {
  if (data.length === 0) {
    const smaPeriods = getSMAPeriods()
    const emptySMA: { [period: number]: number } = {}
    const emptySMALow: { [period: number]: number } = {}
    
    smaPeriods.forEach(period => {
      emptySMA[period] = 0
      emptySMALow[period] = 0
    })
    
    return { 
      sma: emptySMA,
      smaLow: emptySMALow,
      sma89: 0, 
      sma200: 0, 
      ema89: 0, 
      sma2h: 0, 
      sma89Low: 0, 
      sma200Low: 0 
    }
  }

  const prices = data.map(d => d.close).reverse() // Reverse to get chronological order
  const lowPrices = data.map(d => d.low).reverse() // Add low prices for SMA low calculation
  const smaPeriods = getSMAPeriods()

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

  // Calculate SMA for all periods
  const sma: { [period: number]: number } = {}
  const smaLow: { [period: number]: number } = {}
  
  smaPeriods.forEach(period => {
    sma[period] = calculateSMA(prices, period)
    smaLow[period] = calculateSMA(lowPrices, period)
  })

  // Use 89-period and 200-period SMA for all timeframes
  if (timeframe === 'daily' || timeframe === 'weekly' || timeframe === 'monthly') {
    return {
      sma,
      smaLow,
      sma89: sma[89] || 0,
      sma200: sma[200] || 0,
      ema89: calculateEMA(prices, 89),
      sma2h: 0, // Not applicable for these timeframes
      sma89Low: smaLow[89] || 0, // Add SMA low calculation
      sma200Low: smaLow[200] || 0 // Add 200 SMA low calculation
    }
  } else {
    // For 2-hour data, also use 89-period SMA
    return {
      sma,
      smaLow,
      sma89: 0, // Not applicable for 2-hour data
      sma200: 0, // Not applicable for 2-hour data
      ema89: 0, // Not applicable for 2-hour data
      sma2h: sma[89] || 0, // Use 89-period SMA for 2-hour data
      sma89Low: smaLow[89] || 0, // Add SMA low calculation for 2-hour
      sma200Low: smaLow[200] || 0 // Add 200 SMA low calculation for 2-hour
    }
  }
}

// Get data for dashboard display with on-demand indicator calculation
export async function getDashboardData(symbolFilter?: string) {
  try {
    // Map display symbols to actual database symbols
    const symbolMap = {
      'SPY': 'SPY',
      'SPX': '$SPX.X',
      'ES': '@ES',
      'VIX': '$VIX.X'
    }
    
    // Determine which symbols to fetch
    const symbolsToFetch = symbolFilter 
      ? [symbolFilter] 
      : ['SPX', 'SPY', 'ES', 'VIX']
    
    // Calculate indicators on-demand for each symbol
    const dashboardData = await Promise.all(
      symbolsToFetch.map(async (displaySymbol) => {
        const dbSymbol = symbolMap[displaySymbol as keyof typeof symbolMap]
        
        // Get historical data for all timeframes (increased to 500 records for better indicator accuracy)
        const dailyHistoricalData = await getMarketData(dbSymbol, 'daily', 500)
        const hourlyHistoricalData = await getMarketData(dbSymbol, '2h', 500)
        const weeklyHistoricalData = await getMarketData(dbSymbol, 'weekly', 500)
        const monthlyHistoricalData = await getMarketData(dbSymbol, 'monthly', 500)
        
        // Calculate indicators separately for each timeframe
        const dailyIndicators = calculateIndicators(dailyHistoricalData, 'daily')
        const hourlyIndicators = calculateIndicators(hourlyHistoricalData, '2hour')
        const weeklyIndicators = calculateIndicators(weeklyHistoricalData, 'weekly')
        const monthlyIndicators = calculateIndicators(monthlyHistoricalData, 'monthly')
        
        // Use the first record (most recent) from historical data for display
        const latestDaily = dailyHistoricalData[0]
        const latestHourly = hourlyHistoricalData[0]
        const latestWeekly = weeklyHistoricalData[0]
        const latestMonthly = monthlyHistoricalData[0]
        
        // Get yesterday's data from historical records (second record if available)
        const yesterdayDaily = dailyHistoricalData.length > 1 ? dailyHistoricalData[1] : null
        
        // Calculate price changes for better analysis
        const dailyChange = latestDaily && dailyHistoricalData.length > 1 
          ? ((latestDaily.close - dailyHistoricalData[1].close) / dailyHistoricalData[1].close) * 100 
          : 0
        
        const hourlyChange = latestHourly && hourlyHistoricalData.length > 1
          ? ((latestHourly.close - hourlyHistoricalData[1].close) / hourlyHistoricalData[1].close) * 100
          : 0
        
        // Debug logging for VIX - commented out for clean console
        // if (displaySymbol === 'VIX') {
        //   console.log(`VIX Debug - Daily data count: ${dailyHistoricalData.length}, Hourly data count: ${hourlyHistoricalData.length}`)
        //   console.log(`VIX Debug - Daily indicators:`, dailyIndicators)
        //   console.log(`VIX Debug - Hourly indicators:`, hourlyIndicators)
        // }
        
        // Prepare full OHLC historical data (reversed for chronological order)
        const dailyOHLC = {
          open: dailyHistoricalData.map(d => d.open).reverse(),
          high: dailyHistoricalData.map(d => d.high).reverse(),
          low: dailyHistoricalData.map(d => d.low).reverse(),
          close: dailyHistoricalData.map(d => d.close).reverse()
        }
        
        const hourlyOHLC = {
          open: hourlyHistoricalData.map(d => d.open).reverse(),
          high: hourlyHistoricalData.map(d => d.high).reverse(),
          low: hourlyHistoricalData.map(d => d.low).reverse(),
          close: hourlyHistoricalData.map(d => d.close).reverse()
        }
        
        const weeklyOHLC = {
          open: weeklyHistoricalData.map(d => d.open).reverse(),
          high: weeklyHistoricalData.map(d => d.high).reverse(),
          low: weeklyHistoricalData.map(d => d.low).reverse(),
          close: weeklyHistoricalData.map(d => d.close).reverse()
        }
        
        const monthlyOHLC = {
          open: monthlyHistoricalData.map(d => d.open).reverse(),
          high: monthlyHistoricalData.map(d => d.high).reverse(),
          low: monthlyHistoricalData.map(d => d.low).reverse(),
          close: monthlyHistoricalData.map(d => d.close).reverse()
        }
        
        return {
          symbol: displaySymbol,
          instrumentType: displaySymbol as 'SPY' | 'SPX' | 'ES' | 'VIX',
          daily: latestDaily ? {
            price: latestDaily.close,
            change: dailyChange, // Calculate from previous data
            volume: latestDaily.volume,
            timestamp: latestDaily.timestamp
          } : null,
          hourly: latestHourly ? {
            price: latestHourly.close,
            change: hourlyChange, // Calculate from previous data
            volume: latestHourly.volume,
            timestamp: latestHourly.timestamp
          } : null,
          yesterday: yesterdayDaily ? {
            close: yesterdayDaily.close,
            high: yesterdayDaily.high,
            low: yesterdayDaily.low,
            volume: yesterdayDaily.volume,
            timestamp: yesterdayDaily.timestamp
          } : null,
          // Dynamic SMA fields for all periods
          sma: dailyIndicators.sma || {},
          smaLow: dailyIndicators.smaLow || {},
          // Legacy fields for backward compatibility
          sma89: dailyIndicators.sma89 || 0, // From daily data, fallback to 0
          sma200: dailyIndicators.sma200 || 0, // From daily data, fallback to 0
          ema89: dailyIndicators.ema89 || 0, // From daily data, fallback to 0
          sma2h: hourlyIndicators.sma2h || 0, // From 2-hour data, fallback to 0
          // Legacy SMA low values for backward compatibility
          sma89Low: dailyIndicators.sma89Low || 0,
          sma200Low: dailyIndicators.sma200Low || 0,
          weeklySMALow: weeklyIndicators.sma89Low || 0,
          monthlySMALow: monthlyIndicators.sma89Low || 0,
          // Add weekly and monthly data
          weekly: latestWeekly ? {
            price: latestWeekly.close,
            change: weeklyHistoricalData.length > 1 
              ? ((latestWeekly.close - weeklyHistoricalData[1].close) / weeklyHistoricalData[1].close) * 100 
              : 0,
            volume: latestWeekly.volume,
            timestamp: latestWeekly.timestamp
          } : null,
          monthly: latestMonthly ? {
            price: latestMonthly.close,
            change: monthlyHistoricalData.length > 1 
              ? ((latestMonthly.close - monthlyHistoricalData[1].close) / monthlyHistoricalData[1].close) * 100 
              : 0,
            volume: latestMonthly.volume,
            timestamp: latestMonthly.timestamp
          } : null,
          // Add indicators for weekly and monthly
          weeklySMA: weeklyIndicators.sma89 || 0,
          monthlySMA: monthlyIndicators.sma89 || 0,
          // Add historical prices for RSI and Bollinger Bands calculations (keep for backward compatibility)
          dailyHistoricalPrices: dailyHistoricalData.map(d => d.close).reverse(), // Reverse to get chronological order
          hourlyHistoricalPrices: hourlyHistoricalData.map(d => d.close).reverse(), // Reverse to get chronological order
          weeklyHistoricalPrices: weeklyHistoricalData.map(d => d.close).reverse(), // Reverse to get chronological order
          monthlyHistoricalPrices: monthlyHistoricalData.map(d => d.close).reverse(), // Reverse to get chronological order
          // Add full OHLC historical data
          dailyHistoricalOHLC: dailyOHLC,
          hourlyHistoricalOHLC: hourlyOHLC,
          weeklyHistoricalOHLC: weeklyOHLC,
          monthlyHistoricalOHLC: monthlyOHLC
        }
      })
    )
    
    return dashboardData
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    throw error
  }
}
