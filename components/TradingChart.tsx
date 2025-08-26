'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { TrendingUp, TrendingDown, BarChart3, Activity, Calendar } from 'lucide-react'

// Mock data for the chart
const chartData = [
  { time: '09:30', price: 175.20, volume: 1250000, change: 0.15 },
  { time: '10:00', price: 175.85, volume: 980000, change: 0.65 },
  { time: '10:30', price: 176.40, volume: 1450000, change: 1.20 },
  { time: '11:00', price: 175.90, volume: 1120000, change: 0.70 },
  { time: '11:30', price: 176.80, volume: 890000, change: 1.60 },
  { time: '12:00', price: 177.20, volume: 1560000, change: 2.00 },
  { time: '12:30', price: 176.60, volume: 1340000, change: 1.40 },
  { time: '13:00', price: 177.80, volume: 1780000, change: 2.60 },
  { time: '13:30', price: 178.40, volume: 1670000, change: 3.20 },
  { time: '14:00', price: 177.90, volume: 1450000, change: 2.70 },
  { time: '14:30', price: 178.60, volume: 1890000, change: 3.40 },
  { time: '15:00', price: 179.20, volume: 2340000, change: 4.00 },
  { time: '15:30', price: 178.80, volume: 1980000, change: 3.60 },
  { time: '16:00', price: 179.50, volume: 2670000, change: 4.30 },
]

export default function TradingChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
  const [selectedChart, setSelectedChart] = useState('line')

  const timeframes = ['1H', '1D', '1W', '1M', '3M', '1Y']
  const chartTypes = [
    { id: 'line', label: 'Line', icon: TrendingUp },
    { id: 'area', label: 'Area', icon: BarChart3 },
    { id: 'candlestick', label: 'Candlestick', icon: Activity }
  ]

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatVolume = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-bold text-gray-900">AAPL - Apple Inc.</h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900">$179.50</span>
            <span className="text-lg font-medium text-success-600">+$4.30 (+2.45%)</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Volume</p>
            <p className="text-sm font-medium text-gray-900">
              {formatVolume(2670000)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Market Cap</p>
            <p className="text-sm font-medium text-gray-900">$2.8T</p>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {chartTypes.map((chartType) => {
            const Icon = chartType.icon
            return (
              <button
                key={chartType.id}
                onClick={() => setSelectedChart(chartType.id)}
                className={`p-2 rounded-md transition-colors ${
                  selectedChart === chartType.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={chartType.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          {selectedChart === 'area' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number, name: string) => [
                  formatPrice(value),
                  name === 'price' ? 'Price' : name
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number, name: string) => [
                  formatPrice(value),
                  name === 'price' ? 'Price' : name
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Technical Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">RSI (14)</p>
          <p className="text-lg font-semibold text-gray-900">68.5</p>
          <p className="text-xs text-gray-600">Neutral</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">MACD</p>
          <p className="text-lg font-semibold text-success-600">+2.34</p>
          <p className="text-xs text-success-600">Bullish</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Bollinger Bands</p>
          <p className="text-lg font-semibold text-gray-900">Upper</p>
          <p className="text-xs text-gray-600">$182.50</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Moving Average</p>
          <p className="text-lg font-semibold text-gray-900">50-day</p>
          <p className="text-xs text-gray-600">$175.20</p>
        </div>
      </div>
    </div>
  )
}
