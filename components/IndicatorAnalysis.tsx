'use client'

import { useState, useEffect } from 'react'
import { IndicatorAnalysisService, SignalAnalysis, CategoryAnalysis } from '../lib/indicatorAnalysis'
import { getConfig, getIndicatorCategories } from '../config/trading-config'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface IndicatorAnalysisProps {
  marketData: any
  timeframe?: string
}

export default function IndicatorAnalysis({ marketData, timeframe = 'daily' }: IndicatorAnalysisProps) {
  const [analysis, setAnalysis] = useState<SignalAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const analysisService = new IndicatorAnalysisService()
  const config = getConfig()

  useEffect(() => {
    if (marketData) {
      analyzeIndicators()
    }
  }, [marketData, timeframe])

  const analyzeIndicators = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await analysisService.analyzeIndicators(marketData, timeframe)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
      case 'BUY':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'STRONG_SELL':
      case 'SELL':
        return <TrendingDown className="w-5 h-5 text-red-500" />
      case 'HOLD':
        return <Minus className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'bg-green-100 border-green-500 text-green-800'
      case 'BUY':
        return 'bg-green-50 border-green-400 text-green-700'
      case 'STRONG_SELL':
        return 'bg-red-100 border-red-500 text-red-800'
      case 'SELL':
        return 'bg-red-50 border-red-400 text-red-700'
      case 'HOLD':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800'
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800'
    }
  }

  const getStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'STRONG':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'MODERATE':
        return <Minus className="w-4 h-4 text-yellow-500" />
      case 'WEAK':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const renderCategoryAnalysis = (categoryAnalysis: CategoryAnalysis) => {
    const { category, results, summary } = categoryAnalysis
    const isExpanded = expandedCategories.has(category)
    const categoryConfig = config.indicatorCategories[category as keyof typeof config.indicatorCategories]

    return (
      <div key={category} className="border rounded-lg mb-4">
        <div 
          className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
          onClick={() => toggleCategory(category)}
        >
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold capitalize">{category}</h3>
            <span className="text-sm text-gray-600">({results.length} indicators)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getSignalColor(summary.dominantSignal)}`}>
              {summary.dominantSignal}
            </span>
            <span className="text-sm text-gray-500">
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-3">{categoryConfig.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(summary).map(([key, value]) => {
                if (key === 'dominantSignal') return null
                return (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{value}</div>
                    <div className="text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-2">
              {results.map((result) => (
                <div key={result.indicator} className="flex items-center justify-between p-3 bg-white border rounded">
                  <div className="flex items-center space-x-3">
                    {getStrengthIcon(result.strength)}
                    <div>
                      <div className="font-medium capitalize">{result.indicator}</div>
                      <div className="text-sm text-gray-600">{result.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getSignalColor(result.status)}`}>
                      {result.status}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Value: {result.value.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Analyzing indicators...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No analysis available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Signal */}
      <div className={`p-6 rounded-lg border-2 ${getSignalColor(analysis.overallSignal)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getSignalIcon(analysis.overallSignal)}
            <div>
              <h2 className="text-xl font-bold">Overall Signal: {analysis.overallSignal}</h2>
              <p className="text-sm opacity-80">Confidence: {(analysis.confidence * 100).toFixed(1)}%</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {(analysis.confidence * 100).toFixed(0)}%
            </div>
            <div className="text-sm opacity-80">Confidence</div>
          </div>
        </div>
        
        {analysis.reasoning.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Reasoning:</h3>
            <ul className="space-y-1">
              {analysis.reasoning.map((reason, index) => (
                <li key={index} className="text-sm flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Timeframe Analysis */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Timeframe Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(analysis.timeframeAnalysis).map(([tf, data]) => (
            <div key={tf} className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm font-medium capitalize">{tf}</div>
              <div className="text-lg font-bold mt-1">{data.signal}</div>
              <div className="text-xs text-gray-600">
                Weight: {(data.weight * 100).toFixed(0)}% | 
                Confidence: {(data.confidence * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Analysis */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Category Analysis</h3>
        <div className="space-y-4">
          {analysis.categorySignals.map(renderCategoryAnalysis)}
        </div>
      </div>

      {/* Configuration Info */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Framework Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(config.indicatorCategories).map(([category, catConfig]) => (
            <div key={category} className="bg-white p-3 rounded border">
              <h4 className="font-medium capitalize mb-2">{category}</h4>
              <p className="text-sm text-gray-600 mb-2">{catConfig.description}</p>
              <div className="text-xs text-gray-500">
                <div>Indicators: {catConfig.indicators.length}</div>
                <div>Status Values: {catConfig.statusValues.join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
