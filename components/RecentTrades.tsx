'use client'

import { Clock, ArrowUpRight, ArrowDownLeft, CheckCircle, Clock as ClockIcon, XCircle } from 'lucide-react'
import { Trade } from '@/data/mockData'

interface RecentTradesProps {
  data: Trade[]
}

export default function RecentTrades({ data }: RecentTradesProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-warning-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-danger-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-success'
      case 'pending':
        return 'status-warning'
      case 'cancelled':
        return 'status-danger'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Recent Trades</h3>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {data.map((trade) => (
          <div key={trade.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                trade.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {trade.type === 'buy' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownLeft className="h-4 w-4 text-red-600" />
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{trade.symbol}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    trade.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {trade.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {trade.shares} shares @ {formatCurrency(trade.price)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                {getStatusIcon(trade.status)}
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(trade.status)}`}>
                  {trade.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {formatTime(trade.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Trade Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Today's Trades</p>
            <p className="text-lg font-semibold text-gray-900">12</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className="text-lg font-semibold text-success-600">91.7%</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800 font-medium">
              Next trade window opens in 2 hours
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
