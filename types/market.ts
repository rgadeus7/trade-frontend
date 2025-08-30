export interface MarketData {
  symbol: string
  instrumentType: 'SPY' | 'SPX' | 'ES' | 'VIX'
  daily: {
    price: number
    change: number
    volume: number
    timestamp: string
  } | null
  hourly: {
    price: number
    change: number
    volume: number
    timestamp: string
  } | null
  weekly: {
    price: number
    change: number
    volume: number
    timestamp: string
  } | null
  monthly: {
    price: number
    change: number
    volume: number
    timestamp: string
  } | null
  yesterday: {
    close: number
    high: number
    low: number
    volume: number
    timestamp: string
  } | null
  // Dynamic SMA fields for all periods
  sma: { [period: number]: number }
  smaLow: { [period: number]: number }
  // Legacy fields for backward compatibility
  sma89: number
  sma200: number
  ema89: number
  sma2h: number
  weeklySMA: number
  monthlySMA: number
  // Legacy SMA low values for backward compatibility
  sma89Low: number
  sma200Low: number
  weeklySMALow: number
  monthlySMALow: number
  // Update historical data to include full OHLC
  dailyHistoricalPrices?: number[]
  hourlyHistoricalPrices?: number[]
  weeklyHistoricalPrices?: number[]
  monthlyHistoricalPrices?: number[]
  // Add full OHLC historical data
  dailyHistoricalOHLC?: {
    open: number[]
    high: number[]
    low: number[]
    close: number[]
  }
  hourlyHistoricalOHLC?: {
    open: number[]
    high: number[]
    low: number[]
    close: number[]
  }
  weeklyHistoricalOHLC?: {
    open: number[]
    high: number[]
    low: number[]
    close: number[]
  }
  monthlyHistoricalOHLC?: {
    open: number[]
    high: number[]
    low: number[]
    close: number[]
  }
}
