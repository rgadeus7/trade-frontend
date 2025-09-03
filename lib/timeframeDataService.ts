import { getMarketData } from './database'
import { calculateIndicators } from './database'
import type { MarketData } from './supabase'

export type TimeframeType = 'daily' | '2hour' | 'weekly' | 'monthly'

export interface TimeframeData {
  symbol: string
  timeframe: TimeframeType
  currentPrice: number
  previousPrice: number
  change: number
  volume: number
  timestamp: string
  // Dynamic SMA fields for all periods
  sma: { [period: number]: number }
  smaLow: { [period: number]: number }
  // Legacy fields for backward compatibility
  sma89: number
  sma200: number
  sma89Low: number
  sma200Low: number
  historicalPrices: number[]
  historicalOHLC: {
    open: number[]
    high: number[]
    low: number[]
    close: number[]
  }
  historicalVolume: number[]
}

export interface TimeframeDataService {
  getTimeframeData(symbol: string, timeframe: TimeframeType, limit?: number): Promise<TimeframeData | null>
  getAllTimeframesData(symbol: string, limit?: number): Promise<Record<TimeframeType, TimeframeData | null>>
}

class TimeframeDataServiceImpl implements TimeframeDataService {
  
  // Map display symbols to actual database symbols
  private symbolMap = {
    'SPY': 'SPY',
    'SPX': '$SPX.X',
    'ES': '@ES',
    'VIX': '$VIX.X'
  }

  async getTimeframeData(symbol: string, timeframe: TimeframeType, limit: number = 500): Promise<TimeframeData | null> {
    try {
      const dbSymbol = this.symbolMap[symbol as keyof typeof this.symbolMap] || symbol
      
      // Make API call for specific timeframe
      // console.log(`Fetching ${timeframe} data for ${symbol} (DB: ${dbSymbol})`)
      const historicalData = await getMarketData(dbSymbol, timeframe, limit)
      
      if (historicalData.length === 0) {
        // console.warn(`No ${timeframe} data found for ${symbol}`)
        return null
      }

      // Calculate indicators for this specific timeframe
      const indicators = calculateIndicators(historicalData, timeframe)
      
      // Get current and previous data
      const current = historicalData[0]
      const previous = historicalData.length > 1 ? historicalData[1] : null
      
      // Calculate price change
      const change = previous 
        ? ((current.close - previous.close) / previous.close) * 100 
        : 0

      // Prepare OHLC data (reversed for chronological order)
      const historicalOHLC = {
        open: historicalData.map(d => d.open).reverse(),
        high: historicalData.map(d => d.high).reverse(),
        low: historicalData.map(d => d.low).reverse(),
        close: historicalData.map(d => d.close).reverse()
      }

      // Prepare historical volume data (reversed for chronological order)
      const historicalVolume = historicalData.map(d => d.volume).reverse()

      return {
        symbol,
        timeframe,
        currentPrice: current.close,
        previousPrice: previous?.close || current.close,
        change,
        volume: current.volume,
        timestamp: current.timestamp,
        // Dynamic SMA fields for all periods
        sma: indicators.sma || {},
        smaLow: indicators.smaLow || {},
        // Legacy fields for backward compatibility
        sma89: indicators.sma89 || indicators.sma2h || 0, // Use appropriate SMA based on timeframe
        sma200: indicators.sma200 || 0, // Use 200 SMA for daily/weekly/monthly
        sma89Low: indicators.sma89Low || 0,
        sma200Low: indicators.sma200Low || 0,
        historicalPrices: historicalData.map(d => d.close).reverse(),
        historicalOHLC,
        historicalVolume
      }
    } catch (error) {
      // console.error(`Error fetching ${timeframe} data for ${symbol}:`, error)
      return null
    }
  }

  async getAllTimeframesData(symbol: string, limit: number = 500): Promise<Record<TimeframeType, TimeframeData | null>> {
    const timeframes: TimeframeType[] = ['daily', '2hour', 'weekly', 'monthly']
    
    // Make parallel API calls for all timeframes
    const results = await Promise.allSettled(
      timeframes.map(timeframe => this.getTimeframeData(symbol, timeframe, limit))
    )

    // Convert results to record
    const data: Record<TimeframeType, TimeframeData | null> = {
      daily: null,
      '2hour': null,
      weekly: null,
      monthly: null
    }

    results.forEach((result, index) => {
      const timeframe = timeframes[index]
      if (result.status === 'fulfilled') {
        data[timeframe] = result.value
      } else {
        // console.error(`Failed to fetch ${timeframe} data for ${symbol}:`, result.reason)
      }
    })

    return data
  }

  // Helper method to get data for multiple symbols
  async getMultipleSymbolsData(symbols: string[], limit: number = 500): Promise<Record<string, Record<TimeframeType, TimeframeData | null>>> {
    const results = await Promise.allSettled(
      symbols.map(symbol => this.getAllTimeframesData(symbol, limit))
    )

    const data: Record<string, Record<TimeframeType, TimeframeData | null>> = {}
    
    results.forEach((result, index) => {
      const symbol = symbols[index]
      if (result.status === 'fulfilled') {
        data[symbol] = result.value
      } else {
        // console.error(`Failed to fetch data for ${symbol}:`, result.reason)
        data[symbol] = { daily: null, '2hour': null, weekly: null, monthly: null }
      }
    })

    return data
  }
}

// Export singleton instance
export const timeframeDataService = new TimeframeDataServiceImpl()

// Export helper functions for backward compatibility
export async function getTimeframeData(symbol: string, timeframe: TimeframeType, limit?: number) {
  return timeframeDataService.getTimeframeData(symbol, timeframe, limit)
}

export async function getAllTimeframesData(symbol: string, limit?: number) {
  return timeframeDataService.getAllTimeframesData(symbol, limit)
}
