import { supabase } from './supabase'
import type { MarketData } from './supabase'

// Get market data for a symbol and timeframe
export async function getMarketData(symbol: string, timeframe: 'daily' | '2hour' | 'weekly' | 'monthly', limit: number = 300) {
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
export function calculateIndicators(data: MarketData[], timeframe: 'daily' | '2hour' | 'weekly' | 'monthly' = 'daily') {
  if (data.length === 0) return { sma89: 0, ema89: 0, sma2h: 0, sma89Low: 0 }

  const prices = data.map(d => d.close).reverse() // Reverse to get chronological order
  const lowPrices = data.map(d => d.low).reverse() // Add low prices for SMA low calculation

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

  // Use 89-period SMA for all timeframes
  if (timeframe === 'daily' || timeframe === 'weekly' || timeframe === 'monthly') {
    return {
      sma89: calculateSMA(prices, 89),
      ema89: calculateEMA(prices, 89),
      sma2h: 0, // Not applicable for these timeframes
      sma89Low: calculateSMA(lowPrices, 89) // Add SMA low calculation
    }
  } else {
    // For 2-hour data, also use 89-period SMA
    return {
      sma89: 0, // Not applicable for 2-hour data
      ema89: 0, // Not applicable for 2-hour data
      sma2h: calculateSMA(prices, 89), // Use 89-period SMA for 2-hour data
      sma89Low: calculateSMA(lowPrices, 89) // Add SMA low calculation for 2-hour
    }
  }
}

// Get data for dashboard display with on-demand indicator calculation
export async function getDashboardData() {
  try {
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
        
        // Get historical data for all timeframes (increased to 500 records for better indicator accuracy)
        const dailyHistoricalData = await getMarketData(dbSymbol, 'daily', 500)
        const hourlyHistoricalData = await getMarketData(dbSymbol, '2hour', 500)
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
          sma89: dailyIndicators.sma89 || 0, // From daily data, fallback to 0
          ema89: dailyIndicators.ema89 || 0, // From daily data, fallback to 0
          sma2h: hourlyIndicators.sma2h || 0, // From 2-hour data, fallback to 0
          // Add SMA low values
          sma89Low: dailyIndicators.sma89Low || 0,
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
