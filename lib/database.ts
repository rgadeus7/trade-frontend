import { supabase } from './supabase'
import type { MarketData, Indicators } from './supabase'

// Get market data for a symbol and timeframe
export async function getMarketData(symbol: string, timeframe: 'daily' | '2hour', limit: number = 1000) {
  console.log(`Querying market_data for symbol: ${symbol}, timeframe: ${timeframe}`)
  
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
  
  console.log(`Query result for ${symbol} ${timeframe}:`, data)
  return data as MarketData[]
}

// Get latest indicators for a symbol
export async function getLatestIndicators(symbol: string) {
  const { data, error } = await supabase
    .from('indicators')
    .select('*')
    .eq('symbol', symbol)
    .order('timestamp', { ascending: false })
    .limit(1)
  
  if (error) {
    console.error('Error fetching indicators:', error)
    throw error
  }
  
  return data[0] as Indicators | null
}

// Get latest market data for all symbols
export async function getLatestMarketData() {
  // Map display symbols to actual database symbols
  const symbolMap = {
    'SPY': 'SPY',
    'SPX': '$SPX.X',
    'ES': '@ES'
  }
  const timeframes = ['daily', '2hour']
  
  const results = []
  
  for (const [displaySymbol, dbSymbol] of Object.entries(symbolMap)) {
    for (const timeframe of timeframes) {
      console.log(`Fetching ${timeframe} data for ${displaySymbol} (${dbSymbol})...`)
      const data = await getMarketData(dbSymbol, timeframe as 'daily' | '2hour', 1)
      console.log(`${displaySymbol} ${timeframe}:`, data)
      if (data && data.length > 0) {
        // Add the display symbol to the result for mapping
        const result = { ...data[0], displaySymbol }
        results.push(result)
      } else {
        console.log(`No data found for ${displaySymbol} (${dbSymbol}) ${timeframe}`)
      }
    }
  }
  
  console.log('All results:', results)
  return results
}

// Insert market data (for backend use)
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

// Insert indicators (for backend use)
export async function insertIndicators(data: Omit<Indicators, 'id' | 'created_at'>[]) {
  const { error } = await supabase
    .from('indicators')
    .upsert(data, { onConflict: 'symbol,timeframe,timestamp' })
  
  if (error) {
    console.error('Error inserting indicators:', error)
    throw error
  }
  
  return { success: true }
}

// Get data for dashboard display
export async function getDashboardData() {
  try {
    console.log('Getting dashboard data...')
    const latestData = await getLatestMarketData()
    console.log('Latest data:', latestData)
    
    // Map display symbols to actual database symbols for indicators
    const symbolMap = {
      'SPY': 'SPY',
      'SPX': '$SPX.X',
      'ES': '@ES'
    }
    
    const indicators = await Promise.all(
      ['SPY', 'SPX', 'ES'].map(displaySymbol => getLatestIndicators(symbolMap[displaySymbol as keyof typeof symbolMap]))
    )
    console.log('Indicators:', indicators)
    
    // Transform data for dashboard
    const dashboardData = ['SPY', 'SPX', 'ES'].map((displaySymbol, index) => {
      const dailyData = latestData.find(d => d.displaySymbol === displaySymbol && d.timeframe === 'daily')
      const hourlyData = latestData.find(d => d.displaySymbol === displaySymbol && d.timeframe === '2hour')
      const indicator = indicators[index]
      
      console.log(`${displaySymbol} - Daily:`, dailyData, 'Hourly:', hourlyData, 'Indicator:', indicator)
      
      return {
        symbol: displaySymbol,
        instrumentType: displaySymbol as 'SPY' | 'SPX' | 'ES',
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
        sma89: indicator?.sma89 || 0,
        ema89: indicator?.ema89 || 0,
        sma2h: indicator?.sma2h || 0 // Note: This is currently the same as sma89 since no 2-hour data exists
      }
    })
    
    console.log('Final dashboard data:', dashboardData)
    return dashboardData
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    throw error
  }
}
