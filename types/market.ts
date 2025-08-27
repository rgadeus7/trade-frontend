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
  sma89: number
  ema89: number
  sma2h: number
  weeklySMA: number
  monthlySMA: number
  dailyHistoricalPrices?: number[]
  hourlyHistoricalPrices?: number[]
  weeklyHistoricalPrices?: number[]
  monthlyHistoricalPrices?: number[]
}
