'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Activity, BarChart3, RefreshCw } from 'lucide-react'
import TradingChecklist from './TradingChecklistV2'
import SymbolDropdown from './SymbolDropdown'
import { MarketData } from '../types/market'

interface SignalDashboardProps {
  watchlist?: string[]
  apiToken?: string
}

export default function SignalDashboard({ 
  watchlist = ['SPY', 'SPX', 'ES', 'VIX'],
  apiToken
}: SignalDashboardProps) {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedInstrument, setSelectedInstrument] = useState<string>('SPX')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showChecklist, setShowChecklist] = useState(true)
  const hasLoadedRef = useRef(false)

  const fetchMarketData = useCallback(async (forceRefresh = false) => {
    // Don't fetch if already loading
    if (loading && !forceRefresh) return

    try {
      if (forceRefresh) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }

      // Always fetch the currently selected symbol
      const apiUrl = `/api/market-data?symbol=${selectedInstrument}`
      
      // Fetch data from our database API
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
              const data = await response.json()
        
        // getDashboardData already returns an array, so use data directly
        setMarketData(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch market data:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [loading, selectedInstrument])

  // Handle symbol change
  const handleSymbolChange = useCallback((symbol: string) => {
    setSelectedInstrument(symbol)
    // Fetch data for the new symbol
    fetchMarketData(false)
  }, [fetchMarketData])

  // Initial load
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      fetchMarketData()
    }
  }, [fetchMarketData])

  // Manual refresh function
  const handleRefresh = () => {
    fetchMarketData(true)
  }

  const getInstrumentColor = (instrumentType: string) => {
    switch (instrumentType) {
      case 'SPY':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SPX':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'ES':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'VIX':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const filteredData = marketData

  // Show loading state
  if (loading && !isRefreshing) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Activity className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-lg text-gray-600">
            Loading market data from database...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Symbol Selection and Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Market Signal Dashboard</h2>
            <p className="text-gray-600">Select a symbol to view detailed market analysis and trading signals</p>
          </div>
          <div className="flex items-center space-x-4">
            <SymbolDropdown
              selectedSymbol={selectedInstrument}
              onSymbolChange={handleSymbolChange}
              className="w-48"
            />
            <button
              onClick={() => setShowChecklist(!showChecklist)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>{showChecklist ? 'Show Details' : 'Show Checklist'}</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        
        {/* Last Updated Info */}
        {lastUpdated && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
            <Activity className="h-4 w-4" />
            <span>Last updated: {formatTime(lastUpdated)}</span>
          </div>
        )}
      </div>

      {/* Symbol Summary */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${getInstrumentColor(selectedInstrument)}`}></div>
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedInstrument} - Market Overview
          </h3>
        </div>
        
        {filteredData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {filteredData[0].daily && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-700 mb-2">Daily Price</h4>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(filteredData[0].daily.price)}
                </p>
                <p className={`text-sm font-medium ${
                  filteredData[0].daily.change >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {formatPercent(filteredData[0].daily.change)}
                </p>
              </div>
            )}
            
            {filteredData[0].hourly && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-700 mb-2">2-Hour Price</h4>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(filteredData[0].hourly.price)}
                </p>
                <p className={`text-sm font-medium ${
                  filteredData[0].hourly.change >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {formatPercent(filteredData[0].hourly.change)}
                </p>
              </div>
            )}
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-700 mb-2">89 SMA</h4>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(filteredData[0].sma89)}
              </p>
              {filteredData[0].daily && filteredData[0].sma89 > 0 && (
                <p className={`text-sm font-medium ${
                  filteredData[0].daily.price > filteredData[0].sma89 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {filteredData[0].daily.price > filteredData[0].sma89 ? 'Above SMA' : 'Below SMA'}
                </p>
              )}
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-orange-700 mb-2">200 SMA</h4>
              <p className="text-2xl font-bold text-orange-900">
                {formatCurrency(filteredData[0].sma200)}
              </p>
              {filteredData[0].daily && filteredData[0].sma200 > 0 && (
                <p className={`text-sm font-medium ${
                  filteredData[0].daily.price > filteredData[0].sma200 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {filteredData[0].daily.price > filteredData[0].sma200 ? 'Above SMA' : 'Below SMA'}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No data available for {selectedInstrument}</p>
          </div>
        )}
      </div>

      {/* Conditional Content Display */}
      {showChecklist ? (
        <TradingChecklist marketData={filteredData} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredData.length === 0 ? (
            <div className="col-span-full">
              <div className="card">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-gray-600">No market data found for the selected instruments.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            filteredData.map((data) => (
              <div key={data.symbol} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-gray-900">{data.symbol}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInstrumentColor(data.instrumentType)}`}>
                        {data.instrumentType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Last updated: {data.daily ? new Date(data.daily.timestamp).toLocaleTimeString() : 'No data available'}
                    </p>
                  </div>
                </div>

                {/* Daily Data */}
                {data.daily ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Daily Data</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Daily Price</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(data.daily.price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Daily Change</p>
                        <p className={`text-lg font-semibold ${
                          data.daily.change >= 0 ? 'text-success-600' : 'text-danger-600'
                        }`}>
                          {formatPercent(data.daily.change)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Daily Data</h4>
                    <p className="text-sm text-gray-500">No daily data available</p>
                  </div>
                )}

                {/* 2-Hour Data */}
                {data.hourly ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-purple-700 mb-2">2-Hour Data</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">2-Hour Price</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(data.hourly.price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">2-Hour Change</p>
                        <p className={`text-lg font-semibold ${
                          data.hourly.change >= 0 ? 'text-success-600' : 'text-danger-600'
                        }`}>
                          {formatPercent(data.hourly.change)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-purple-700 mb-2">2-Hour Data</h4>
                    <p className="text-sm text-gray-500">No 2-hour data available</p>
                  </div>
                )}

                {/* 89 SMA */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-green-700 mb-2">89-Day Simple Moving Average</h4>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(data.sma89)}
                  </p>
                  {data.daily && data.sma89 > 0 ? (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">
                        {data.daily.price > data.sma89 ? 'Above SMA' : 'Below SMA'}
                      </p>
                      <p className="text-xs text-green-500">
                        Distance: {formatCurrency(Math.abs(data.daily.price - data.sma89))}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">No daily data available for calculation</p>
                    </div>
                  )}
                </div>

                {/* 89 EMA */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">89-Day Exponential Moving Average</h4>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(data.ema89)}
                  </p>
                  {data.daily && data.ema89 > 0 ? (
                    <div className="mt-2">
                      <p className="text-sm text-blue-600">
                        {data.daily.price > data.ema89 ? 'Above EMA' : 'Below EMA'}
                      </p>
                      <p className="text-xs text-blue-500">
                        Distance: {formatCurrency(Math.abs(data.daily.price - data.ema89))}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">No daily data available for calculation</p>
                    </div>
                  )}
                </div>

                {/* 2-Hour SMA - Always show, but indicate if no data */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-purple-700 mb-2">2-Hour Simple Moving Average (89-period)</h4>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(data.sma2h)}
                  </p>
                  {data.hourly && data.sma2h > 0 ? (
                    <div className="mt-2">
                      <p className="text-sm text-purple-600">
                        {data.hourly.price > data.sma2h ? 'Above 2H SMA' : 'Below 2H SMA'}
                      </p>
                      <p className="text-xs text-purple-500">
                        Distance: {formatCurrency(Math.abs(data.hourly.price - data.sma2h))}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">No 2-hour data available for calculation</p>
                    </div>
                  )}
                </div>

                {/* Volume */}
                {data.daily ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Volume (Daily)</h4>
                    <p className="text-lg font-semibold text-gray-900">
                      {data.daily.volume.toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Volume (Daily)</h4>
                    <p className="text-sm text-gray-500">No volume data available</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
