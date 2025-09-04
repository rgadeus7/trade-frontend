import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  // console.log('🚀 /api/config/symbols called')
  
  try {
    // Read the trading config file
    const configPath = path.join(process.cwd(), 'config', 'trading-config.json')
    // console.log('📁 Config path:', configPath)
    
    const configContent = fs.readFileSync(configPath, 'utf-8')
    // console.log('📄 Config file read, length:', configContent.length)
    
    const config = JSON.parse(configContent)
    // console.log('🔧 Parsed config keys:', Object.keys(config))
    
    // Extract symbols from the config
    let symbols = []
    if (config.symbols) {
      if (Array.isArray(config.symbols)) {
        // Direct array format
        symbols = config.symbols
      } else if (config.symbols.available && Array.isArray(config.symbols.available)) {
        // Nested format: symbols.available
        symbols = config.symbols.available.map((symbol: any) => ({
          value: symbol.display || symbol.value,
          label: symbol.display || symbol.label,
          description: symbol.description || '',
          database: symbol.database,
          type: symbol.type,
          color: symbol.color
        }))
      }
    }
    
    // console.log('📊 Extracted symbols:', symbols)
    // console.log('📊 Symbols is array:', Array.isArray(symbols))
    // console.log('📊 Symbols length:', symbols.length)

    return NextResponse.json({ 
      success: true, 
      symbols,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    // console.error('Error reading symbols config:', error)
    
    // Return fallback symbols if config file cannot be read
    return NextResponse.json({
      success: false,
      symbols: [
        { value: 'SPX', label: 'SPX', description: 'S&P 500 Index' },
        { value: 'SPY', label: 'SPY', description: 'SPDR S&P 500 ETF' },
        { value: 'ES', label: 'ES', description: 'E-mini S&P 500 Futures' },
        { value: 'VIX', label: 'VIX', description: 'CBOE Volatility Index' },
        { value: 'GLD', label: 'GLD', description: 'SPDR Gold Trust' }
      ],
      error: 'Failed to read config file, using fallback symbols',
      timestamp: new Date().toISOString()
    })
  }
}
