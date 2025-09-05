'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useScenarioConfig } from '../../lib/scenarios/scenarioConfig'
import ScenarioMindMap from '../../components/scenarios/ScenarioMindMap'
import SymbolSelector from '../../components/scenarios/SymbolSelector'
import { parseMarketData, ParsedMarketData } from '../../lib/marketDataParser'

export default function ScenariosPage() {
  const { session } = useAuth()
  const { getCategories, getMindMap } = useScenarioConfig()
  const [selectedCategory, setSelectedCategory] = useState('day-trading-simple')
  const [selectedSymbol, setSelectedSymbol] = useState<string>('SPX')
  const [mindMapData, setMindMapData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [marketData, setMarketData] = useState<ParsedMarketData | null>(null)
  const [isLoadingMarketData, setIsLoadingMarketData] = useState(false)
  const fetchedSymbols = useRef<Set<string>>(new Set())

  // Load default symbol from trading config
  useEffect(() => {
    const loadDefaultSymbol = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/config/trading-config')
        if (response.ok) {
          const config = await response.json()
          if (!selectedSymbol && config.symbols?.default) {
            setSelectedSymbol(config.symbols.default)
          }
        }
      } catch (error) {
        console.error('Failed to load trading config:', error)
        // Fallback to SPX if config fails to load
        if (!selectedSymbol) {
          setSelectedSymbol('SPX')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDefaultSymbol()
  }, [selectedSymbol])

  // Fetch market data when symbol changes (only once per symbol)
  useEffect(() => {
    if (selectedSymbol && session?.access_token && !fetchedSymbols.current.has(selectedSymbol)) {
      console.log(`📊 Fetching market data for symbol: ${selectedSymbol}`)
      fetchMarketData(selectedSymbol)
      fetchedSymbols.current.add(selectedSymbol)
    }
  }, [selectedSymbol, session?.access_token])

  const fetchMarketData = async (symbol: string) => {
    setIsLoadingMarketData(true)
    try {
      const apiUrl = `/api/market-data?symbol=${symbol}`
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const rawData = await response.json()
        console.log('📊 Raw market data from API:', rawData)
        console.log('📊 Raw data type:', typeof rawData, Array.isArray(rawData) ? 'array' : 'object')
        console.log('📊 Raw data length/keys:', Array.isArray(rawData) ? rawData.length : Object.keys(rawData))
        
        // Check if we have the expected historical OHLC data
        if (Array.isArray(rawData) && rawData.length > 0) {
          const firstItem = rawData[0]
          console.log('📊 First item keys:', Object.keys(firstItem))
          console.log('📊 Has dailyHistoricalOHLC:', !!firstItem.dailyHistoricalOHLC)
          console.log('📊 Has hourlyHistoricalOHLC:', !!firstItem.hourlyHistoricalOHLC)
          console.log('📊 Daily OHLC sample:', firstItem.dailyHistoricalOHLC)
        }
        
        // Parse the raw data into P0-P5 structure
        const parsedData = parseMarketData(rawData)
        console.log('📊 Parsed market data:', parsedData)
        setMarketData(parsedData)
      } else {
        console.error('Failed to fetch market data:', response.status)
        // Remove from fetched symbols if fetch failed so we can retry
        fetchedSymbols.current.delete(symbol)
      }
    } catch (error) {
      console.error('Error fetching market data:', error)
      // Remove from fetched symbols if fetch failed so we can retry
      fetchedSymbols.current.delete(symbol)
    } finally {
      setIsLoadingMarketData(false)
    }
  }

  useEffect(() => {
    const category = getCategories().find(c => c.id === selectedCategory)
    console.log('📊 Selected category:', selectedCategory)
    console.log('📊 Found category:', category)
    if (category) {
      const mindMap = getMindMap(selectedCategory)
      console.log('📊 Loaded mind map:', mindMap)
      setMindMapData(mindMap)
    }
  }, [selectedCategory, getCategories, getMindMap])

  const categories = getCategories()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Trading Scenarios</h1>
            <p className="text-white/60">Interactive mind map analysis for different trading strategies</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-64">
              <SymbolSelector
                selectedSymbol={selectedSymbol}
                onSymbolChange={setSelectedSymbol}
              />
            </div>
            <div className="text-right">
              <div className="text-sm text-white/60">Selected Symbol</div>
              <div className="text-lg font-semibold text-white">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  selectedSymbol || 'No symbol selected'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)] min-h-0 max-h-[calc(100vh-140px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white/5 backdrop-blur-md border-r border-white/10 p-6 flex-shrink-0">
          {/* Category Selector */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-4">Trading Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs opacity-80">{category.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Category Info */}
          {mindMapData && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-4">Category Info</h3>
              <div className="p-3 bg-white/10 rounded-lg">
                <div className="text-white font-medium mb-2">{mindMapData.name}</div>
                <div className="text-white/60 text-sm mb-2">{mindMapData.description}</div>
                <div className="text-xs text-white/40 space-y-1">
                  <div>Scenarios: {mindMapData.nodes?.length || 0}</div>
                  <div>Connections: {mindMapData.connections?.length || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Auto-Evaluation Status */}
          {selectedSymbol && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-4">Auto-Evaluation</h3>
              <div className="p-3 bg-green-900/20 border border-green-600/50 rounded-lg">
                <div className="text-green-300 text-sm mb-2">✓ Active</div>
                <div className="text-green-200 text-xs">
                  All scenarios automatically evaluate when symbol changes
                </div>
                <div className="text-green-200 text-xs mt-1">
                  Current symbol: <span className="font-medium">{selectedSymbol}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 relative min-w-0 overflow-hidden h-full">
          {mindMapData ? (
            <ScenarioMindMap
              data={mindMapData}
              selectedSymbol={selectedSymbol}
              session={session}
              marketData={marketData}
              isLoadingMarketData={isLoadingMarketData}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-white/60">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p>Loading scenarios...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
