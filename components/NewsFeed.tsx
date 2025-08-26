'use client'

import { Clock, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, Info } from 'lucide-react'
import { NewsItem } from '@/data/mockData'

interface NewsFeedProps {
  data: NewsItem[]
}

export default function NewsFeed({ data }: NewsFeedProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-success-600" />
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-danger-600" />
      case 'neutral':
        return <Minus className="h-4 w-4 text-gray-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Zap className="h-4 w-4 text-orange-600" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'low':
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800'
      case 'negative':
        return 'bg-red-100 text-red-800'
      case 'neutral':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Market News</h3>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {data.map((news) => (
          <div key={news.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getSentimentIcon(news.sentiment)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {news.title}
                  </h4>
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(news.sentiment)}`}>
                      {news.sentiment}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(news.impact)}`}>
                      {getImpactIcon(news.impact)}
                      {news.impact}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {news.summary}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span className="font-medium">{news.source}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(news.timestamp)}</span>
                    </div>
                  </div>
                  
                  <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Read More
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* News Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Positive</p>
            <p className="text-lg font-semibold text-success-600">3</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Neutral</p>
            <p className="text-lg font-semibold text-gray-600">1</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Negative</p>
            <p className="text-lg font-semibold text-danger-600">1</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800 font-medium">
              High impact news may affect market volatility
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
