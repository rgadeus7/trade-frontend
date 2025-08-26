'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3 } from 'lucide-react'
import { PortfolioData, PortfolioPosition } from '@/data/mockData'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface PortfolioOverviewProps {
  data: PortfolioData
}

export default function PortfolioOverview({ data }: PortfolioOverviewProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'positions'>('overview')

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

  // Prepare data for pie chart
  const pieChartData = data.positions.map(position => ({
    name: position.symbol,
    value: position.marketValue,
    color: position.gainLoss >= 0 ? '#22c55e' : '#ef4444'
  }))

  const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Portfolio Overview</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'overview'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView('positions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'positions'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Positions
          </button>
        </div>
      </div>

      {selectedView === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Summary Cards */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Value</h3>
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(data.totalValue)}
            </p>
            <div className="flex items-center space-x-2">
              {data.dailyChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger-600" />
              )}
              <span className={`text-sm font-medium ${
                data.dailyChange >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                {formatCurrency(data.dailyChange)} ({formatPercent(data.dailyChangePercent)})
              </span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total P&L</h3>
              <Percent className="h-6 w-6 text-primary-600" />
            </div>
            <p className={`text-3xl font-bold mb-2 ${
              data.totalGainLoss >= 0 ? 'text-success-600' : 'text-danger-600'
            }`}>
              {formatCurrency(data.totalGainLoss)}
            </p>
            <p className={`text-sm font-medium ${
              data.totalGainLossPercent >= 0 ? 'text-success-600' : 'text-danger-600'
            }`}>
              {formatPercent(data.totalGainLossPercent)} return
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Allocation</h3>
              <BarChart3 className="h-6 w-6 text-primary-600" />
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `${label} (${((data.positions.find(pos => pos.symbol === label)?.marketValue || 0) / data.totalValue * 100).toFixed(1)}%)`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        /* Positions Table */
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Positions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Symbol</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Shares</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Current Price</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Market Value</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">P&L</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">P&L %</th>
                </tr>
              </thead>
              <tbody>
                {data.positions.map((position) => (
                  <tr key={position.symbol} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{position.symbol}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{position.name}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{position.shares}</td>
                    <td className="py-3 px-4 text-right">
                      <div>
                        <p className="font-medium text-gray-900">{formatCurrency(position.currentPrice)}</p>
                        <p className={`text-sm ${
                          position.change >= 0 ? 'text-success-600' : 'text-danger-600'
                        }`}>
                          {formatCurrency(position.change)} ({formatPercent(position.changePercent)})
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(position.marketValue)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-medium ${
                        position.gainLoss >= 0 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {formatCurrency(position.gainLoss)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-medium ${
                        position.gainLossPercent >= 0 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {formatPercent(position.gainLossPercent)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
