'use client'

import { useState, useEffect } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface TradingSymbol {
  display: string
  database: string
  type: string
  description: string
  color: string
}

interface SymbolSelectorProps {
  selectedSymbol: string
  onSymbolChange: (symbol: string) => void
  className?: string
}

export default function SymbolSelector({ selectedSymbol, onSymbolChange, className = '' }: SymbolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [symbols, setSymbols] = useState<TradingSymbol[]>([])
  const [filteredSymbols, setFilteredSymbols] = useState<TradingSymbol[]>([])

  useEffect(() => {
    // Load symbols from trading config
    const loadSymbols = async () => {
      try {
        const response = await fetch('/api/config/trading-config')
        if (response.ok) {
          const config = await response.json()
          setSymbols(config.symbols?.available || [])
          setFilteredSymbols(config.symbols?.available || [])
        }
      } catch (error) {
        console.error('Failed to load trading config:', error)
        // Fallback to empty array
        setSymbols([])
        setFilteredSymbols([])
      }
    }

    loadSymbols()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSymbols(symbols)
    } else {
      const filtered = symbols.filter(symbol =>
        symbol.display.toLowerCase().includes(searchTerm.toLowerCase()) ||
        symbol.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        symbol.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredSymbols(filtered)
    }
  }, [searchTerm, symbols])

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange(symbol)
    setIsOpen(false)
    setSearchTerm('')
  }

  const selectedSymbolData = symbols.find(s => s.display === selectedSymbol)

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'stock':
        return 'bg-blue-500/20 text-blue-400'
      case 'etf':
        return 'bg-green-500/20 text-green-400'
      case 'futures':
        return 'bg-purple-500/20 text-purple-400'
      case 'forex':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'crypto':
        return 'bg-orange-500/20 text-orange-400'
      case 'index':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (symbols.length === 0) {
    return (
      <div className={`${className} p-4 bg-gray-800 border border-gray-600 rounded-lg`}>
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
          <p className="text-sm">Loading symbols...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-start">
            <span className="text-white font-semibold text-lg">
              {selectedSymbol || 'Select Symbol'}
            </span>
            {selectedSymbolData && (
              <span className="text-gray-400 text-sm">
                {selectedSymbolData.description}
              </span>
            )}
          </div>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
          <div className="p-3 border-b border-gray-600">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search symbols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {filteredSymbols.map((symbol) => (
              <button
                key={symbol.display}
                onClick={() => handleSymbolSelect(symbol.display)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700 focus:outline-none focus:bg-gray-700"
              >
                <div className="flex flex-col items-start">
                  <span className="text-white font-semibold">{symbol.display}</span>
                  <span className="text-gray-400 text-sm">{symbol.description}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-gray-400 text-xs">{symbol.database}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(symbol.type)}`}>
                    {symbol.type.toUpperCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {filteredSymbols.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              <p>No symbols found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
