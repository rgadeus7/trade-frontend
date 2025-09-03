'use client'

import { useState } from 'react'
import { ChevronDown, BarChart3 } from 'lucide-react'

interface SymbolDropdownProps {
  selectedSymbol: string
  onSymbolChange: (symbol: string) => void
  className?: string
}

const SYMBOLS = [
  { value: 'SPX', label: 'SPX', description: 'S&P 500 Index' },
  { value: 'SPY', label: 'SPY', description: 'SPDR S&P 500 ETF' },
  { value: 'ES', label: 'ES', description: 'E-mini S&P 500 Futures' },
  { value: 'VIX', label: 'VIX', description: 'Volatility Index' }
]

export default function SymbolDropdown({ selectedSymbol, onSymbolChange, className = '' }: SymbolDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedSymbolData = SYMBOLS.find(s => s.value === selectedSymbol)

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange(symbol)
    setIsOpen(false)
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
            {SYMBOLS.map((symbol) => (
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
