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

// Helper function to deduplicate market data by timeframe
function deduplicateMarketData(data: MarketData[], timeframe: string): MarketData[] {
  if (data.length === 0) return data
  
  // console.log(`🔄 Deduplicating ${timeframe} data: ${data.length} records`)
  
  let uniqueData: MarketData[]
  
  if (timeframe === 'daily' || timeframe === 'weekly' || timeframe === 'monthly') {
    // For time-based data, deduplicate by date and keep most recent
    const dateGroups = new Map()
    data.forEach(item => {
      const dateKey = new Date(item.timestamp).toDateString()
      if (!dateGroups.has(dateKey) || new Date(item.timestamp) > new Date(dateGroups.get(dateKey).timestamp)) {
        dateGroups.set(dateKey, item) // Keep the most recent timestamp for this date
      }
    })
    
    // Convert back to array and sort by timestamp (newest first)
    uniqueData = Array.from(dateGroups.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  } else if (timeframe === '2h' || timeframe === '2hour') {
    // For intraday data, deduplicate by exact timestamp (should be unique anyway)
    const timestampGroups = new Map()
    data.forEach(item => {
      const timeKey = new Date(item.timestamp).toISOString()
      if (!timestampGroups.has(timeKey)) {
        timestampGroups.set(timeKey, item)
      }
    })
    
    uniqueData = Array.from(timestampGroups.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  } else {
    // For other timeframes, just remove exact duplicates
    uniqueData = data.filter((item, index, self) => 
      index === self.findIndex(t => t.timestamp === item.timestamp && t.close === item.close)
    )
  }
  
  const duplicateCount = data.length - uniqueData.length
  if (duplicateCount > 0) {
    // console.warn(`⚠️ Found ${duplicateCount} duplicate records in ${timeframe} data`)
  }
  
  // console.log(`✅ Deduplication complete: ${data.length} → ${uniqueData.length} unique records`)
  return uniqueData
}

// Get market data for a symbol and timeframe
export async function getMarketData(symbol: string, timeframe: string, limit: number = 300) {
  const timeframeValue = getTimeframeValue(timeframe)
  
  // console.log(`🔍 Fetching market data: ${symbol}, timeframe: ${timeframe} -> ${timeframeValue}`)
  
  // For daily, weekly, monthly - we need to query by timeframe_unit
  let query = supabase
    .from('market_data')
    .select('*')
    .eq('symbol', symbol)
    .order('timestamp', { ascending: false }) // Keep descending - newest first for SMA calculations
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
  
  // console.log(`✅ Fetched ${data?.length || 0} records for ${symbol} (${timeframe})`)
  
  // Deduplicate data right after fetching to ensure clean data for all calculations
  const deduplicatedData = deduplicateMarketData(data || [], timeframe)
  
  return deduplicatedData as MarketData[]
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

  // Helper function to validate data sufficiency for accurate SMA calculations
  const hasSufficientDataForSMA = (dataLength: number, period: number): boolean => {
    return dataLength >= period
  }

  // Manual verification function for 89 SMA
  const verify89SMA = (prices: number[]) => {
    if (prices.length < 89) {
      console.warn(`⚠️ Cannot verify 89 SMA: only ${prices.length} prices available`)
      return null
    }
    
    const sma89Prices = prices.slice(0, 89)
    const manualSum = sma89Prices.reduce((sum, price) => sum + price, 0)
    const manualSMA = manualSum / 89
    
    // console.log(`🔍 Manual 89 SMA Verification:`)
    // console.log(`  Using first 89 prices: ${sma89Prices.length}`)
    // console.log(`  Manual sum: ${manualSum.toFixed(2)}`)
    // console.log(`  Manual SMA: ${manualSMA.toFixed(2)}`)
    // console.log(`  Expected: 6147.00`)
    // console.log(`  Difference: ${Math.abs(manualSMA - 6147.00).toFixed(2)}`)
    
    return manualSMA
  }

  let prices = data.map(d => d.close) // Data is now in chronological order (oldest first)
  let lowPrices = data.map(d => d.low) // Data is now in chronological order (oldest first)
  const smaPeriods = getSMAPeriods()

  // Debug data ordering for 89 SMA
  // console.log(`📊 Data Ordering Debug for ${timeframe}:`)
  // console.log(`  Raw data count: ${data.length}`)
  // console.log(`  Prices count: ${prices.length}`)
  if (data.length > 0) {
    // console.log(`  Raw data first (oldest): ${data[0].close} at ${data[0].timestamp}`)
    // console.log(`  Raw data last (newest): ${data[data.length - 1].close} at ${data[data.length - 1].timestamp}`)
    // console.log(`  Prices first: ${prices[0]} (should be oldest)`)
    // console.log(`  Prices last: ${prices[prices.length - 1]} (should be newest)`)
  }

  // Calculate SMA
  const calculateSMA = (prices: number[], period: number) => {
    if (prices.length < period) {
      // Log warning when falling back to average of all prices
      // console.warn(`⚠️ Insufficient data for ${period}-period SMA: only ${prices.length} records available. Using average of all prices.`)
      const sum = prices.reduce((a, b) => a + b, 0)
      return sum / prices.length
    }
    
    // For 89 SMA, add detailed debugging
    if (period === 89) {
      // console.log(`🔍 89 SMA Calculation Debug:`)
      // console.log(`  Total prices available: ${prices.length}`)
      // console.log(`  Taking first ${period} prices (most recent for proper SMA)`)
      
      const recentPrices = prices.slice(0, period) // Take first 89 prices (most recent)
      // console.log(`  First 5 prices (most recent): ${recentPrices.slice(0, 5).map(p => p.toFixed(2)).join(', ')}`)
      // console.log(`  Last 5 prices (oldest in 89): ${recentPrices.slice(-5).map(p => p.toFixed(2)).join(', ')}`)
      
      // Show all 89 prices for verification
      // console.log(`  All 89 prices used for calculation:`)
      // recentPrices.forEach((price, index) => {
      //   console.log(`    [${index + 1}]: ${price.toFixed(2)}`)
      // })
      
      const sum = recentPrices.reduce((a, b) => a + b, 0)
      const result = sum / period
      // console.log(`  Sum: ${sum.toFixed(2)}, Period: ${period}, Result: ${result.toFixed(2)}`)
      // console.log(`  Verification: ${sum.toFixed(2)} ÷ ${period} = ${result.toFixed(2)}`)
      
      // Manual verification
      const manualResult = verify89SMA(prices)
      if (manualResult && Math.abs(manualResult - result) > 0.01) {
        // console.error(`🚨 DISCREPANCY DETECTED: Calculated ${result.toFixed(2)} vs Manual ${manualResult.toFixed(2)}`)
      }
      
      return result
    }
    
    const recentPrices = prices.slice(0, period) // Take first 'period' prices (most recent)
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
    // Start with SMA of the first 'period' prices (most recent)
    const initialSMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
    let ema = initialSMA
    
    // Calculate EMA for all remaining prices (older ones)
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
    }
    
    return ema
  }

  // Calculate SMA for all periods
  const sma: { [period: number]: number } = {}
  const smaLow: { [period: number]: number } = {}
  
  // Log data availability for debugging
  // console.log(`📊 Calculating indicators for ${timeframe}: ${prices.length} price records available`)
  
  smaPeriods.forEach(period => {
    sma[period] = calculateSMA(prices, period)
    smaLow[period] = calculateSMA(lowPrices, period)
  })

  // Validate critical SMA periods and provide better fallbacks
  const criticalPeriods = [89, 200]
  criticalPeriods.forEach(period => {
    if (prices.length < period) {
      // console.warn(`🚨 Critical: ${period}-period SMA calculation may be inaccurate. Need ${period} records, only have ${prices.length}`)
    }
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
        
        // Validate data availability for accurate calculations
        // console.log(`📈 Data validation for ${displaySymbol}:`)
        // console.log(`  Daily: ${dailyHistoricalData.length} records (need 89+ for accurate 89 SMA)`)
        // console.log(`  2-Hour: ${hourlyHistoricalData.length} records (need 89+ for accurate 89 SMA)`)
        // console.log(`  Weekly: ${weeklyHistoricalData.length} records (need 89+ for accurate 89 SMA)`)
        // console.log(`  Monthly: ${monthlyHistoricalData.length} records (need 89+ for accurate 89 SMA)`)
        
        // Log date range for debugging
        if (dailyHistoricalData.length > 0) {
          const oldestDate = new Date(dailyHistoricalData[dailyHistoricalData.length - 1].timestamp)
          const newestDate = new Date(dailyHistoricalData[0].timestamp)
          // console.log(`📅 Daily data range: ${oldestDate.toDateString()} to ${newestDate.toDateString()}`)
        }
        
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
