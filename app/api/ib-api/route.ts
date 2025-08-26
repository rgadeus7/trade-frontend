import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to avoid static generation issues with search params
export const dynamic = 'force-dynamic'

// Interactive Brokers Cloud API Integration for SPY, SPX, ES
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const symbol = searchParams.get('symbol')
    const action = searchParams.get('action')

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter required' }, { status: 400 })
    }

    // Validate symbol is one of our supported instruments
    const supportedSymbols = ['SPY', 'SPX', 'ES']
    if (!supportedSymbols.includes(symbol)) {
      return NextResponse.json({ error: 'Unsupported symbol. Only SPY, SPX, ES are supported.' }, { status: 400 })
    }

    // For now, return mock data - replace with real IB Cloud API calls
    // TODO: Replace with actual IB Client Portal API or Cloud Gateway
    const mockData = {
      symbol,
      instrumentType: symbol as 'SPY' | 'SPX' | 'ES',
      price: getMockPrice(symbol),
      change: getMockChange(symbol),
      volume: getMockVolume(symbol),
      timestamp: new Date().toISOString(),
      signals: generateSignals(symbol)
    }

    return NextResponse.json(mockData)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

// Mock price generation based on instrument type
function getMockPrice(symbol: string): number {
  const basePrices = {
    'SPY': 450,
    'SPX': 4500,
    'ES': 4500
  }
  
  const basePrice = basePrices[symbol as keyof typeof basePrices] || 450
  const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
  return basePrice * (1 + variation)
}

// Mock change generation
function getMockChange(symbol: string): number {
  const baseChange = (Math.random() - 0.5) * 4 // ±2% change
  return parseFloat(baseChange.toFixed(2))
}

// Mock volume generation
function getMockVolume(symbol: string): number {
  const baseVolumes = {
    'SPY': 50000000, // 50M shares
    'SPX': 0, // Index has no volume
    'ES': 200000 // 200K contracts
  }
  
  const baseVolume = baseVolumes[symbol as keyof typeof baseVolumes] || 50000000
  const variation = 0.8 + Math.random() * 0.4 // 80-120% of base volume
  return Math.floor(baseVolume * variation)
}

// Enhanced signal generation for S&P instruments
function generateSignals(symbol: string) {
  // Generate realistic technical indicators
  const rsi = 30 + Math.random() * 40 // 30-70 range, more realistic
  const macd = (Math.random() - 0.5) * 3 // -1.5 to +1.5
  const bbPosition = Math.random() // 0-1, position within Bollinger Bands
  const vix = 15 + Math.random() * 20 // 15-35 VIX range
  
  let signal = 'HOLD'
  let confidence = 0.5
  
  // RSI signals with market context
  if (rsi < 25) {
    signal = 'BUY'
    confidence = 0.85
  } else if (rsi > 75) {
    signal = 'SELL'
    confidence = 0.85
  } else if (rsi < 35) {
    signal = 'BUY'
    confidence = 0.7
  } else if (rsi > 65) {
    signal = 'SELL'
    confidence = 0.7
  }
  
  // MACD confirmation
  if (Math.abs(macd) > 1.5) {
    confidence += 0.15
  } else if (Math.abs(macd) > 0.8) {
    confidence += 0.1
  }
  
  // Bollinger Bands position
  if (bbPosition < 0.05 || bbPosition > 0.95) {
    confidence += 0.1
  } else if (bbPosition < 0.15 || bbPosition > 0.85) {
    confidence += 0.05
  }
  
  // VIX impact on confidence
  if (vix > 30) {
    confidence += 0.1 // High VIX increases signal confidence
  } else if (vix < 20) {
    confidence -= 0.05 // Low VIX decreases signal confidence
  }
  
  // Market hours adjustment (higher confidence during market hours)
  const now = new Date()
  const hour = now.getHours()
  if (hour >= 9 && hour <= 16) {
    confidence += 0.05
  }
  
  // Cap confidence at 1.0
  confidence = Math.min(confidence, 1.0)
  
  return {
    signal,
    confidence,
    indicators: {
      rsi: rsi.toFixed(1),
      macd: macd.toFixed(2),
      bbPosition: bbPosition.toFixed(2),
      vix: vix.toFixed(1)
    },
    reasoning: getSignalReasoning(signal, rsi, macd, bbPosition, vix, symbol)
  }
}

function getSignalReasoning(signal: string, rsi: number, macd: number, bbPosition: number, vix: number, symbol: string) {
  const reasons = []
  
  // RSI reasoning
  if (rsi < 25) reasons.push('RSI indicates extreme oversold conditions')
  if (rsi < 35) reasons.push('RSI indicates oversold conditions')
  if (rsi > 75) reasons.push('RSI indicates extreme overbought conditions')
  if (rsi > 65) reasons.push('RSI indicates overbought conditions')
  
  // MACD reasoning
  if (Math.abs(macd) > 1.5) reasons.push('Strong MACD momentum')
  if (Math.abs(macd) > 0.8) reasons.push('Moderate MACD momentum')
  
  // Bollinger Bands reasoning
  if (bbPosition < 0.05) reasons.push('Price at lower Bollinger Band')
  if (bbPosition > 0.95) reasons.push('Price at upper Bollinger Band')
  if (bbPosition < 0.15) reasons.push('Price near lower Bollinger Band')
  if (bbPosition > 0.85) reasons.push('Price near upper Bollinger Band')
  
  // VIX reasoning
  if (vix > 30) reasons.push('High VIX suggests increased volatility')
  if (vix < 20) reasons.push('Low VIX suggests market complacency')
  
  // Market context
  if (symbol === 'ES') reasons.push('Futures market - 24/7 trading')
  if (symbol === 'SPX') reasons.push('Cash index - no trading costs')
  if (symbol === 'SPY') reasons.push('ETF - high liquidity')
  
  return reasons.join(', ')
}

// TODO: Replace mock data with real IB Cloud API calls
// Example of how to implement real IB API integration:

/*
// Real IB Client Portal API integration
async function getRealIBData(symbol: string) {
  try {
    // First, authenticate with IB
    const authResponse = await fetch('https://www.interactivebrokers.com/portal_proxy/v1/iserver/auth/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.IB_ACCESS_TOKEN}`
      }
    })

    if (!authResponse.ok) {
      throw new Error('IB authentication failed')
    }

    // Get contract ID for the symbol
    const contractId = await getContractId(symbol)
    
    // Request market data
    const marketDataResponse = await fetch('https://www.interactivebrokers.com/portal_proxy/v1/iserver/marketdata/snapshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.IB_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        conids: [contractId]
      })
    })

    const marketData = await marketDataResponse.json()
    return marketData
  } catch (error) {
    console.error('Failed to fetch real IB data:', error)
    // Fall back to mock data
    return null
  }
}

// Get contract ID for symbol
async function getContractId(symbol: string): Promise<number> {
  const contractIds = {
    'SPY': 756733, // Example conid - you'll need to get the real ones
    'SPX': 138930718,
    'ES': 138930718
  }
  return contractIds[symbol as keyof typeof contractIds] || 756733
}
*/
