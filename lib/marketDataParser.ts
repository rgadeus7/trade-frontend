/**
 * Market Data Parser
 * 
 * Converts raw market data from API into structured P0-P5 format
 * P0 = Current period (with indicators)
 * P1-P5 = Historical periods (OHLCV only)
 */

export interface ParsedMarketData {
  symbol: string
  instrumentType: string
  timestamp: string
  timeframes: {
    [timeframe: string]: {
      P0: {
        date: string
        open: number
        high: number
        low: number
        close: number
        volume: number
        timestamp: string
        indicators?: {
          sma: { [period: number]: number }
          smaLow: { [period: number]: number }
          ema?: { [period: number]: number }
          bb?: { upper: number; middle: number; lower: number; period: number }
          mml?: { central: number; resistance1: number; resistance2: number; support1: number; support2: number }
          pivot?: { high: number; low: number; resistance1: number; resistance2: number; support1: number; support2: number }
          rsi?: { [period: number]: number }
        }
      }
      P1: {
        date: string
        open: number
        high: number
        low: number
        close: number
        volume: number
        timestamp: string
      }
      P2: {
        date: string
        open: number
        high: number
        low: number
        close: number
        volume: number
        timestamp: string
      }
      P3: {
        date: string
        open: number
        high: number
        low: number
        close: number
        volume: number
        timestamp: string
      }
      P4: {
        date: string
        open: number
        high: number
        low: number
        close: number
        volume: number
        timestamp: string
      }
      P5: {
        date: string
        open: number
        high: number
        low: number
        close: number
        volume: number
        timestamp: string
      }
    }
  }
}

export interface RawMarketData {
  symbol: string
  instrumentType: string
  daily?: { price: number; change: number; volume: number; timestamp: string } | null
  hourly?: { price: number; change: number; volume: number; timestamp: string } | null
  weekly?: { price: number; change: number; volume: number; timestamp: string } | null
  monthly?: { price: number; change: number; volume: number; timestamp: string } | null
  yesterday?: { close: number; high: number; low: number; volume: number; timestamp: string } | null
  sma?: { [period: number]: number }
  smaLow?: { [period: number]: number }
  sma89?: number
  sma200?: number
  ema89?: number
  sma2h?: number
  weeklySMA?: number
  monthlySMA?: number
  sma89Low?: number
  sma200Low?: number
  weeklySMALow?: number
  monthlySMALow?: number
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

/**
 * Parse raw market data into structured P0-P5 format
 */
export function parseMarketData(rawData: RawMarketData | RawMarketData[]): ParsedMarketData {
  // Handle array response (API returns array of market data)
  const data = Array.isArray(rawData) ? rawData[0] : rawData
  
  if (!data) {
    throw new Error('No market data available')
  }
  
  console.log('📊 Processing market data for symbol:', data.symbol)
  console.log('📊 Current day data:', data.daily)
  console.log('📊 Yesterday data:', data.yesterday)
  
  const parsed: ParsedMarketData = {
    symbol: data.symbol,
    instrumentType: data.instrumentType,
    timestamp: new Date().toISOString(),
    timeframes: {}
  }

  // Parse Daily timeframe
  if (data.dailyHistoricalOHLC) {
    console.log('📊 Daily historical OHLC:', data.dailyHistoricalOHLC)
    console.log('📊 Daily SMA data:', data.sma)
    console.log('📊 Daily SMA 89:', data.sma89)
    
    parsed.timeframes['1D'] = parseTimeframeData(
      data.dailyHistoricalOHLC,
      '1D',
      {
        sma: data.sma || {},
        smaLow: data.smaLow || {},
        ema: data.ema89 ? { 89: data.ema89 } : undefined
      }
    )
  }

  // Parse 2H timeframe (from hourly data)
  if (data.hourlyHistoricalOHLC) {
    parsed.timeframes['2H'] = parseTimeframeData(
      data.hourlyHistoricalOHLC,
      '2H',
      {
        sma: data.sma2h ? { 89: data.sma2h } : {}
      }
    )
  }

  // Parse Weekly timeframe
  if (data.weeklyHistoricalOHLC) {
    parsed.timeframes['1W'] = parseTimeframeData(
      data.weeklyHistoricalOHLC,
      '1W',
      {
        sma: data.weeklySMA ? { 89: data.weeklySMA } : {}
      }
    )
  }

  // Parse Monthly timeframe
  if (data.monthlyHistoricalOHLC) {
    parsed.timeframes['1M'] = parseTimeframeData(
      data.monthlyHistoricalOHLC,
      '1M',
      {
        sma: data.monthlySMA ? { 89: data.monthlySMA } : {}
      }
    )
  }

  return parsed
}

/**
 * Parse individual timeframe data into P0-P5 structure
 */
function parseTimeframeData(
  historicalOHLC: { open: number[]; high: number[]; low: number[]; close: number[] },
  timeframe: string,
  indicators?: { sma?: { [period: number]: number }; smaLow?: { [period: number]: number }; ema?: { [period: number]: number } }
) {
  const { open, high, low, close } = historicalOHLC
  
  // Ensure we have at least 6 periods of data
  const periods = Math.min(6, open.length)
  
  const result: any = {}
  
  // Parse P0 (current) with indicators - use LAST element (most recent)
  if (periods > 0) {
    const currentIndex = open.length - 1 // Last element is current day
    result.P0 = {
      date: formatDateFromTimestamp(new Date()),
      open: open[currentIndex] || 0,
      high: high[currentIndex] || 0,
      low: low[currentIndex] || 0,
      close: close[currentIndex] || 0,
      volume: 0, // Volume not available in historical data
      timestamp: new Date().toISOString(),
      indicators: indicators ? {
        sma: indicators.sma || {},
        smaLow: indicators.smaLow || {},
        ema: indicators.ema || {}
      } : undefined
    }
  }
  
  // Parse P1-P5 (historical periods without indicators) - work backwards from current
  for (let i = 1; i < periods; i++) {
    const periodKey = `P${i}` as keyof typeof result
    const historicalIndex = open.length - 1 - i // Work backwards from current day
    result[periodKey] = {
      date: formatDateFromTimestamp(new Date(Date.now() - (i * getTimeframeMs(timeframe)))),
      open: open[historicalIndex] || 0,
      high: high[historicalIndex] || 0,
      low: low[historicalIndex] || 0,
      close: close[historicalIndex] || 0,
      volume: 0, // Volume not available in historical data
      timestamp: new Date(Date.now() - (i * getTimeframeMs(timeframe))).toISOString()
    }
  }
  
  return result
}

/**
 * Get milliseconds for timeframe
 */
function getTimeframeMs(timeframe: string): number {
  switch (timeframe) {
    case '1D': return 24 * 60 * 60 * 1000 // 1 day
    case '2H': return 2 * 60 * 60 * 1000 // 2 hours
    case '1W': return 7 * 24 * 60 * 60 * 1000 // 1 week
    case '1M': return 30 * 24 * 60 * 60 * 1000 // 1 month (approximate)
    default: return 24 * 60 * 60 * 1000
  }
}

/**
 * Format date from timestamp
 */
function formatDateFromTimestamp(timestamp: Date): string {
  return timestamp.toISOString().split('T')[0] // YYYY-MM-DD format
}

/**
 * Parse period-prefixed field name (e.g., "P0_open" -> period: "P0", field: "open")
 */
function parsePeriodField(fieldName: string): { period: string; field: string } | null {
  if (typeof fieldName !== 'string') {
    return null
  }
  
  // Match pattern: P0_open, P1_high, P2_sma_89, etc.
  const match = fieldName.match(/^(P\d+)_(.+)$/)
  if (match) {
    return {
      period: match[1], // P0, P1, P2, etc.
      field: match[2]   // open, high, sma_89, etc.
    }
  }
  
  return null
}

/**
 * Get market data value from parsed structure
 */
export function getMarketDataValue(
  parsedData: ParsedMarketData,
  field: string,
  timeframe?: string,
  period?: string
): number | null {
  // Ensure field is a string
  if (typeof field !== 'string') {
    console.error('getMarketDataValue: field is not a string:', field, typeof field)
    return null
  }
  
  // Parse period-prefixed field (e.g., "P0_open")
  const parsedField = parsePeriodField(field)
  if (parsedField) {
    const { period: fieldPeriod, field: fieldName } = parsedField
    return getMarketDataValue(parsedData, fieldName, timeframe, fieldPeriod)
  }
  
  if (!timeframe || !parsedData.timeframes[timeframe]) {
    return null
  }
  
  const timeframeData = parsedData.timeframes[timeframe]
  const targetPeriod = period || 'P0'
  
  if (!timeframeData[targetPeriod as keyof typeof timeframeData]) {
    return null
  }
  
  const periodData = timeframeData[targetPeriod as keyof typeof timeframeData] as any
  
  // Handle indicator fields
  if (field.startsWith('sma_')) {
    const period = parseInt(field.split('_')[1])
    return periodData.indicators?.sma?.[period] || null
  }
  
  if (field.startsWith('ema_')) {
    const period = parseInt(field.split('_')[1])
    return periodData.indicators?.ema?.[period] || null
  }
  
  if (field.startsWith('rsi_')) {
    const period = parseInt(field.split('_')[1])
    return periodData.indicators?.rsi?.[period] || null
  }
  
  if (field.startsWith('bb_')) {
    const bbType = field.split('_')[1] // upper, middle, lower
    return periodData.indicators?.bb?.[bbType] || null
  }
  
  // Handle basic OHLCV fields
  if (['open', 'high', 'low', 'close', 'volume'].includes(field)) {
    return periodData[field] || null
  }
  
  return null
}

/**
 * Get market data label for display
 */
export function getMarketDataLabel(field: string, timeframe?: string, period?: string): string {
  // Ensure field is a string
  if (typeof field !== 'string') {
    console.error('getMarketDataLabel: field is not a string:', field, typeof field)
    return String(field) || 'Unknown'
  }
  
  const periodLabel = period ? ` (${period})` : ''
  const timeframeLabel = timeframe ? ` (${timeframe})` : ''
  
  if (field.startsWith('sma_')) {
    const period = field.split('_')[1]
    return `SMA ${period}${timeframeLabel}${periodLabel}`
  }
  
  if (field.startsWith('ema_')) {
    const period = field.split('_')[1]
    return `EMA ${period}${timeframeLabel}${periodLabel}`
  }
  
  if (field.startsWith('rsi_')) {
    const period = field.split('_')[1]
    return `RSI ${period}${timeframeLabel}${periodLabel}`
  }
  
  // Basic fields
  const fieldLabels: { [key: string]: string } = {
    open: 'Open',
    high: 'High',
    low: 'Low',
    close: 'Close',
    volume: 'Volume'
  }
  
  return fieldLabels[field] || field
}
