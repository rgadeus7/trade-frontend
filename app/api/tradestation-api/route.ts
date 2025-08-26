import { NextRequest, NextResponse } from 'next/server'

// Trade Station API Integration for SPY, SPX, ES
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const token = searchParams.get('token')

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter required' }, { status: 400 })
    }

    // Validate symbol is one of our supported instruments
    const supportedSymbols = ['SPY', 'SPX', 'ES']
    if (!supportedSymbols.includes(symbol)) {
      return NextResponse.json({ error: 'Unsupported symbol. Only SPY, SPX, ES are supported.' }, { status: 400 })
    }

    // Only proceed if token is provided
    if (!token) {
      console.log(`No token provided for ${symbol}, returning mock data`)
      const mockData = generateMockData(symbol)
      return NextResponse.json(mockData)
    }

    // Get real data from Trade Station
    try {
      const realData = await getRealTradeStationData(symbol, token)
      if (realData) {
        console.log(`Successfully fetched real data for ${symbol}`)
        return NextResponse.json(realData)
      }
    } catch (error) {
      console.error(`Failed to fetch real data for ${symbol}, falling back to mock:`, error)
      // Fall back to mock data if real API fails
    }

    // Return mock data as fallback
    const mockData = generateMockData(symbol)
    return NextResponse.json(mockData)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch Trade Station data' }, { status: 500 })
  }
}

// Real Trade Station API integration - single call for daily data
async function getRealTradeStationData(symbol: string, accessToken: string) {
  try {
    // Different symbol formats for different instruments
    let apiSymbol: string
    if (symbol === 'ES') {
      apiSymbol = `@${symbol}` // Futures need @ prefix
    } else if (symbol === 'SPX') {
      apiSymbol = `$${symbol}.X` // SPX needs $SPX.X format
    } else {
      apiSymbol = symbol // SPY uses plain symbol
    }
    
    const apiUrl = `https://api.tradestation.com/v3/marketdata/barcharts/${apiSymbol}?barsback=300&interval=1&unit=Daily`
    console.log(`🔍 Making API call for ${symbol}:`, apiUrl)
    console.log(`🔑 Using token:`, accessToken.substring(0, 20) + '...')
    
    // Get daily barcharts data (1000 bars, daily interval)
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`📡 Response status for ${symbol}:`, response.status)
    console.log(`📡 Response headers for ${symbol}:`, Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Trade Station API error for ${symbol}:`, response.status, errorText)
      throw new Error(`Trade Station API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log(`✅ Raw Trade Station response for ${symbol}:`, JSON.stringify(data, null, 2))
    
    return transformTradeStationData(data, symbol)
  } catch (error) {
    console.error('❌ Failed to fetch real Trade Station data:', error)
    throw error
  }
}

// Transform Trade Station data to our format
function transformTradeStationData(barchartsData: any, symbol: string) {
  console.log(`🔄 Transforming data for ${symbol}:`, JSON.stringify(barchartsData, null, 2))
  
  if (!barchartsData.Bars || barchartsData.Bars.length === 0) {
    console.error(`❌ No bars data for ${symbol}:`, barchartsData)
    throw new Error('No data received from Trade Station')
  }

  const bars = barchartsData.Bars
  // Bars are returned in chronological order (oldest first), so last element is most recent
  const latestBar = bars[bars.length - 1] // Most recent data (last element)
  const previousBar = bars.length > 1 ? bars[bars.length - 2] : null // Previous day for change calculation
  
  console.log(`📊 Latest bar for ${symbol}:`, JSON.stringify(latestBar, null, 2))
  if (previousBar) {
    console.log(`📊 Previous bar for ${symbol}:`, JSON.stringify(previousBar, null, 2))
  }
  
  // Calculate 89 SMA and EMA from closing prices (bars are already in chronological order)
  const closingPrices = bars.map((bar: any) => parseFloat(bar.Close))
  const sma89 = calculateSMA(closingPrices, 89)
  const ema89 = calculateEMA(closingPrices, 89)
  
  // Calculate daily change
  const change = previousBar ? ((parseFloat(latestBar.Close) - parseFloat(previousBar.Close)) / parseFloat(previousBar.Close)) * 100 : 0

  const result = {
    symbol,
    instrumentType: symbol as 'SPY' | 'SPX' | 'ES',
    price: parseFloat(latestBar.Close),
    change: parseFloat(change.toFixed(2)),
    volume: parseInt(latestBar.TotalVolume) || 0,
    timestamp: new Date().toISOString(),
    sma89: parseFloat(sma89.toFixed(2)),
    ema89: parseFloat(ema89.toFixed(2))
  }
  
  console.log(`🎯 Final transformed data for ${symbol}:`, JSON.stringify(result, null, 2))
  
  return result
}

// SMA calculation
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) {
    // If not enough data, return the average of available prices
    const sum = prices.reduce((a, b) => a + b, 0)
    return sum / prices.length
  }
  
  // Take the last 'period' number of prices
  const recentPrices = prices.slice(-period)
  const sum = recentPrices.reduce((a, b) => a + b, 0)
  return sum / period
}

// EMA calculation - corrected
function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0
  
  // For the first calculation, use SMA as the initial EMA value
  if (prices.length < period) {
    const sum = prices.reduce((a, b) => a + b, 0)
    return sum / prices.length
  }
  
  const multiplier = 2 / (period + 1)
  
  // Start with SMA of the first 'period' prices
  const initialSMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
  let ema = initialSMA
  
  // Calculate EMA for all remaining prices
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
  }
  
  return ema
}

// Generate mock data for testing
function generateMockData(symbol: string) {
  const basePrices = {
    'SPY': 450,
    'SPX': 4500,
    'ES': 4500
  }
  
  const basePrice = basePrices[symbol as keyof typeof basePrices] || 450
  const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
  const price = basePrice * (1 + variation)
  const change = (Math.random() - 0.5) * 4 // ±2% change
  const sma89 = price * (1 + (Math.random() - 0.5) * 0.05) // SMA close to price
  const ema89 = price * (1 + (Math.random() - 0.5) * 0.03) // EMA close to price

  return {
    symbol,
    instrumentType: symbol as 'SPY' | 'SPX' | 'ES',
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    volume: Math.floor(Math.random() * 100000000),
    timestamp: new Date().toISOString(),
    sma89: parseFloat(sma89.toFixed(2)),
    ema89: parseFloat(ema89.toFixed(2))
  }
}
