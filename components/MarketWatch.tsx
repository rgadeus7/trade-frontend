'use client'

import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { MarketData } from '@/data/mockData'

interface MarketWatchProps {
  data: MarketData
}

export default function MarketWatch({ data }: MarketWatchProps) {
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

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Market Watch</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="h-4 w-4 animate-pulse" />
          <span>Live Data</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Market Indices */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Major Indices</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.indices.map((index) => (
              <div key={index.symbol} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{index.name}</span>
                  <span className="text-xs text-gray-500">{index.symbol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">
                    {index.value.toLocaleString()}
                  </span>
                  <div className="flex items-center space-x-1">
                    {index.change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-success-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-danger-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      index.change >= 0 ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className={`text-sm font-medium ${
                  index.changePercent >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {formatPercent(index.changePercent)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Gainers and Losers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Gainers */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-success-600" />
              <span>Top Gainers</span>
            </h4>
            <div className="space-y-3">
              {data.topGainers.map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{stock.symbol}</p>
                    <p className="text-sm text-gray-600">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(stock.price)}</p>
                    <p className="text-sm text-success-600 font-medium">
                      +{stock.change.toFixed(2)} ({formatPercent(stock.changePercent)})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-danger-600" />
              <span>Top Losers</span>
            </h4>
            <div className="space-y-3">
              {data.topLosers.map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{stock.symbol}</p>
                    <p className="text-sm text-gray-600">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(stock.price)}</p>
                    <p className="text-sm text-danger-600 font-medium">
                      {stock.change.toFixed(2)} ({formatPercent(stock.changePercent)})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Summary */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-primary-900">Market Summary</h4>
              <p className="text-sm text-primary-700">
                Markets are showing mixed signals with technology stocks leading gains while defensive sectors lag.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-600">Last Updated</p>
              <p className="text-sm font-medium text-primary-900">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
