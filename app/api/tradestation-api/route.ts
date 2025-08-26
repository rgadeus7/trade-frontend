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

// Real Trade Station API integration - fetch both daily and 2-hour data
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
    
    // Fetch both daily and 2-hour (120-minute) data
    const dailyUrl = `https://api.tradestation.com/v3/marketdata/barcharts/${apiSymbol}?barsback=1000&interval=1&unit=Daily`
    const hourlyUrl = `https://api.tradestation.com/v3/marketdata/barcharts/${apiSymbol}?barsback=1000&interval=120&unit=Minute`
    
    console.log(`🔍 Making API calls for ${symbol}:`)
    console.log(`📅 Daily:`, dailyUrl)
    console.log(`⏰ 2-Hour (120min):`, hourlyUrl)
    console.log(`🔑 Using token:`, accessToken.substring(0, 20) + '...')
    
    // Fetch both datasets in parallel
    const [dailyResponse, hourlyResponse] = await Promise.all([
      fetch(dailyUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(hourlyUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
    ])
    
    //console.log(`📡 Daily response status for ${symbol}:`, dailyResponse.status)
    //console.log(`📡 2-Hour (120min) response status for ${symbol}:`, hourlyResponse.status)
    
    if (!dailyResponse.ok) {
      const errorText = await dailyResponse.text()
      console.error(`❌ Trade Station daily API error for ${symbol}:`, dailyResponse.status, errorText)
      throw new Error(`Trade Station daily API error: ${dailyResponse.status} - ${errorText}`)
    }
    
    if (!hourlyResponse.ok) {
      const errorText = await hourlyResponse.text()
      console.error(`❌ Trade Station 2-hour (120min) API error for ${symbol}:`, hourlyResponse.status, errorText)
      throw new Error(`Trade Station 2-hour (120min) API error: ${hourlyResponse.status} - ${errorText}`)
    }
    
    const dailyData = await dailyResponse.json()
    const hourlyData = await hourlyResponse.json()
    
    //console.log(`✅ Raw daily response for ${symbol}:`, JSON.stringify(dailyData, null, 2))
    //console.log(`✅ Raw 2-hour (120min) response for ${symbol}:`, JSON.stringify(hourlyData, null, 2))
    
    return transformTradeStationData(dailyData, hourlyData, symbol)
  } catch (error) {
    console.error('❌ Failed to fetch real Trade Station data:', error)
    throw error
  }
}

// Transform Trade Station data to our format
function transformTradeStationData(dailyData: any, hourlyData: any, symbol: string) {
      //console.log(`🔄 Transforming data for ${symbol}:`)
      //console.log(`📅 Daily data:`, JSON.stringify(dailyData, null, 2))
      //console.log(`⏰ 2-Hour (120min) data:`, JSON.stringify(hourlyData, null, 2))
    
    if (!dailyData.Bars || dailyData.Bars.length === 0) {
    console.error(`❌ No daily bars data for ${symbol}:`, dailyData)
    throw new Error('No daily data received from Trade Station')
  }
  
  if (!hourlyData.Bars || hourlyData.Bars.length === 0) {
    console.error(`❌ No 2-hour (120min) bars data for ${symbol}:`, hourlyData)
    throw new Error('No 2-hour (120min) data received from Trade Station')
  }

  const dailyBars = dailyData.Bars
  const hourlyBars = hourlyData.Bars
  
  // Get most recent data (last element in arrays)
  const latestDailyBar = dailyBars[dailyBars.length - 1]
  const previousDailyBar = dailyBars.length > 1 ? dailyBars[dailyBars.length - 2] : null
  
  const latestHourlyBar = hourlyBars[hourlyBars.length - 1]
  const previousHourlyBar = hourlyBars.length > 1 ? hourlyBars[hourlyBars.length - 2] : null
  
  console.log(`📊 Latest daily bar for ${symbol}:`, JSON.stringify(latestDailyBar, null, 2))
  console.log(`📊 Latest 2-hour (120min) bar for ${symbol}:`, JSON.stringify(latestHourlyBar, null, 2))
  
  // Calculate indicators from daily data (for consistency)
  const dailyClosingPrices = dailyBars.map((bar: any) => parseFloat(bar.Close))
  const sma89 = calculateSMA(dailyClosingPrices, 89)
  const ema89 = calculateEMA(dailyClosingPrices, 89)
  
  // Calculate 2-hour SMA (using 2-hour data)
  const hourlyClosingPrices = hourlyBars.map((bar: any) => parseFloat(bar.Close))
  const sma2h = calculateSMA(hourlyClosingPrices, 89) // 89-period SMA on 2-hour data
  
  // Calculate changes
  const dailyChange = previousDailyBar ? ((parseFloat(latestDailyBar.Close) - parseFloat(previousDailyBar.Close)) / parseFloat(previousDailyBar.Close)) * 100 : 0
  const hourlyChange = previousHourlyBar ? ((parseFloat(latestHourlyBar.Close) - parseFloat(previousHourlyBar.Close)) / parseFloat(previousHourlyBar.Close)) * 100 : 0

  const result = {
    symbol,
    instrumentType: symbol as 'SPY' | 'SPX' | 'ES',
    daily: {
      price: parseFloat(latestDailyBar.Close),
      change: parseFloat(dailyChange.toFixed(2)),
      volume: parseInt(latestDailyBar.TotalVolume) || 0,
      timestamp: latestDailyBar.TimeStamp || new Date().toISOString()
    },
    hourly: {
      price: parseFloat(latestHourlyBar.Close),
      change: parseFloat(hourlyChange.toFixed(2)),
      volume: parseInt(latestHourlyBar.TotalVolume) || 0,
      timestamp: latestHourlyBar.TimeStamp || new Date().toISOString()
    },
    sma89: parseFloat(sma89.toFixed(2)),
    ema89: parseFloat(ema89.toFixed(2)),
    sma2h: parseFloat(sma2h.toFixed(2)) // 2-hour SMA
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
  const dailyPrice = basePrice * (1 + variation)
  const hourlyPrice = dailyPrice * (1 + (Math.random() - 0.5) * 0.02) // Slight variation for hourly
  
  const dailyChange = (Math.random() - 0.5) * 4 // ±2% change
  const hourlyChange = (Math.random() - 0.5) * 2 // ±1% change for hourly
  
  const sma89 = dailyPrice * (1 + (Math.random() - 0.5) * 0.05) // SMA close to price
  const ema89 = dailyPrice * (1 + (Math.random() - 0.5) * 0.03) // EMA close to price
  const sma2h = hourlyPrice * (1 + (Math.random() - 0.5) * 0.04) // 2-hour SMA close to hourly price

  return {
    symbol,
    instrumentType: symbol as 'SPY' | 'SPX' | 'ES',
    daily: {
      price: parseFloat(dailyPrice.toFixed(2)),
      change: parseFloat(dailyChange.toFixed(2)),
      volume: Math.floor(Math.random() * 100000000),
      timestamp: new Date().toISOString()
    },
    hourly: {
      price: parseFloat(hourlyPrice.toFixed(2)),
      change: parseFloat(hourlyChange.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000),
      timestamp: new Date().toISOString()
    },
    sma89: parseFloat(sma89.toFixed(2)),
    ema89: parseFloat(ema89.toFixed(2)),
    sma2h: parseFloat(sma2h.toFixed(2)) // 2-hour SMA
  }
}
