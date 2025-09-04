'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, BarChart3 } from 'lucide-react'

interface SymbolDropdownProps {
  selectedSymbol: string
  onSymbolChange: (symbol: string) => void
  className?: string
}

interface SymbolConfig {
  value: string
  label: string
  description: string
}

export default function SymbolDropdown({ selectedSymbol, onSymbolChange, className = '' }: SymbolDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [symbols, setSymbols] = useState<SymbolConfig[]>([])
  const [loading, setLoading] = useState(true)

  // Load symbols from config file
  useEffect(() => {
    async function loadSymbols() {
      try {
        // console.log('🔄 Loading symbols from config...')
        const response = await fetch('/api/config/symbols')
        // console.log('📡 API response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          // console.log('📊 API response data:', data)
          
          // Ensure symbols is always an array
          const symbolsArray = Array.isArray(data.symbols) ? data.symbols : []
          // console.log('✅ Setting symbols:', symbolsArray)
          setSymbols(symbolsArray)
        } else {
          // console.error('❌ Failed to load symbols from config, status:', response.status)
          // Fallback to default symbols
          setSymbols([
            { value: 'SPX', label: 'SPX', description: 'S&P 500 Index' },
            { value: 'SPY', label: 'SPY', description: 'SPDR S&P 500 ETF' },
            { value: 'ES', label: 'ES', description: 'E-mini S&P 500 Futures' },
            { value: 'VIX', label: 'VIX', description: 'CBOE Volatility Index' },
            { value: 'GLD', label: 'GLD', description: 'SPDR Gold Trust' }
          ])
        }
      } catch (error) {
        // console.error('❌ Error loading symbols:', error)
        // Fallback to default symbols
        setSymbols([
          { value: 'SPX', label: 'SPX', description: 'S&P 500 Index' },
          { value: 'SPY', label: 'SPY', description: 'SPDR S&P 500 ETF' },
          { value: 'ES', label: 'ES', description: 'E-mini S&P 500 Futures' },
          { value: 'VIX', label: 'VIX', description: 'CBOE Volatility Index' },
          { value: 'GLD', label: 'GLD', description: 'SPDR Gold Trust' }
        ])
      } finally {
        setLoading(false)
      }
    }

    loadSymbols()
  }, [])

  // Ensure symbols is always an array
  const safeSymbols = Array.isArray(symbols) ? symbols : []
  // console.log('🔍 Current symbols state:', { symbols, safeSymbols, isArray: Array.isArray(symbols) })

  const selectedSymbolData = safeSymbols.find(s => s.value === selectedSymbol)

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange(symbol)
    setIsOpen(false)
  }

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <button
          disabled
          className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
        >
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <span>Loading symbols...</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{selectedSymbolData?.label || 'Select Symbol'}</span>
          {selectedSymbolData?.description && (
            <span className="text-xs text-gray-500 hidden md:inline">
              ({selectedSymbolData.description})
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="py-1">
            {safeSymbols.map((symbol) => (
              <button
                key={symbol.value}
                onClick={() => handleSymbolSelect(symbol.value)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  selectedSymbol === symbol.value 
                    ? 'bg-primary-50 text-primary-700 font-medium' 
                    : 'text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{symbol.label}</span>
                    <span className="ml-2 text-xs text-gray-500">{symbol.description}</span>
                  </div>
                  {selectedSymbol === symbol.value && (
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
