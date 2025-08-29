'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ChecklistItem {
  id: string
  label: string
  status: 'BULLISH' | 'BEARISH' | 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS'
  strength?: 'STRONG' | 'MODERATE' | 'WEAK'
  description: string
  category: string
  subcategory: string
}

interface IndicatorVisualizationProps {
  allConditions: ChecklistItem[]
}

interface SubcategoryPerformance {
  subcategory: string
  timeframes: {
    [timeframe: string]: {
      dominantStatus: 'BULLISH' | 'BEARISH' | 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS'
      counts: {
        BULLISH: number
        BEARISH: number
        OVERBOUGHT: number
        OVERSOLD: number
        NO_BIAS: number
      }
      total: number
    }
  }
  overall: {
    dominantStatus: 'BULLISH' | 'BEARISH' | 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS'
    counts: {
      BULLISH: number
      BEARISH: number
      OVERBOUGHT: number
      OVERSOLD: number
      NO_BIAS: number
    }
    total: number
  }
}

const STATUS_COLORS = {
  BULLISH: '#10B981',
  BEARISH: '#EF4444',
  OVERBOUGHT: '#F97316',
  OVERSOLD: '#8B5CF6',
  NO_BIAS: '#6B7280'
}

const STATUS_LABELS = {
  BULLISH: 'Bullish',
  BEARISH: 'Bearish',
  OVERBOUGHT: 'Overbought',
  OVERSOLD: 'Oversold',
  NO_BIAS: 'No Bias'
}

const STATUS_ICONS = {
  BULLISH: TrendingUp,
  BEARISH: TrendingDown,
  OVERBOUGHT: TrendingUp,
  OVERSOLD: TrendingDown,
  NO_BIAS: Minus
}

export default function IndicatorVisualization({ allConditions }: IndicatorVisualizationProps) {
  const [selectedCell, setSelectedCell] = useState<{ subcategory: string; timeframe: string } | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Process data for subcategory performance matrix
  const processSubcategoryData = (): SubcategoryPerformance[] => {
    const subcategoryMap = new Map<string, SubcategoryPerformance>()
    const timeframes = ['Daily', '2-Hour', 'Weekly', 'Monthly']

    // Initialize subcategories
    const subcategories = new Set<string>()
    allConditions.forEach(condition => {
      subcategories.add(condition.subcategory)
    })

    subcategories.forEach(subcategory => {
      subcategoryMap.set(subcategory, {
        subcategory,
        timeframes: {},
        overall: {
          dominantStatus: 'NO_BIAS',
          counts: { BULLISH: 0, BEARISH: 0, OVERBOUGHT: 0, OVERSOLD: 0, NO_BIAS: 0 },
          total: 0
        }
      })

      // Initialize timeframes for this subcategory
      timeframes.forEach(timeframe => {
        subcategoryMap.get(subcategory)!.timeframes[timeframe] = {
          dominantStatus: 'NO_BIAS',
          counts: { BULLISH: 0, BEARISH: 0, OVERBOUGHT: 0, OVERSOLD: 0, NO_BIAS: 0 },
          total: 0
        }
      })
    })

    // Process conditions
    allConditions.forEach(condition => {
      const timeframe = condition.id.split('-')[0]
      const timeframeName = timeframe === '2' ? '2-Hour' : timeframe
      
      if (subcategoryMap.has(condition.subcategory) && subcategoryMap.get(condition.subcategory)!.timeframes[timeframeName]) {
        const subcategoryData = subcategoryMap.get(condition.subcategory)!
        const timeframeData = subcategoryData.timeframes[timeframeName]
        
        // Update timeframe counts
        timeframeData.counts[condition.status]++
        timeframeData.total++
        
        // Update overall counts
        subcategoryData.overall.counts[condition.status]++
        subcategoryData.overall.total++
      }
    })

    // Calculate dominant status for each timeframe and overall
    subcategoryMap.forEach(subcategoryData => {
      // Calculate dominant status for each timeframe
      Object.keys(subcategoryData.timeframes).forEach(timeframe => {
        const timeframeData = subcategoryData.timeframes[timeframe]
        timeframeData.dominantStatus = getDominantStatus(timeframeData.counts)
      })
      
      // Calculate dominant status for overall
      subcategoryData.overall.dominantStatus = getDominantStatus(subcategoryData.overall.counts)
    })

    return Array.from(subcategoryMap.values()).sort((a, b) => a.subcategory.localeCompare(b.subcategory))
  }

  const getDominantStatus = (counts: { [key: string]: number }): 'BULLISH' | 'BEARISH' | 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS' => {
    const maxCount = Math.max(...Object.values(counts))
    const dominantStatuses = Object.entries(counts).filter(([_, count]) => count === maxCount)
    
    if (dominantStatuses.length === 1) {
      return dominantStatuses[0][0] as 'BULLISH' | 'BEARISH' | 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS'
    }
    
    // If tied, prioritize in this order: BULLISH > BEARISH > OVERBOUGHT > OVERSOLD > NO_BIAS
    const priority = ['BULLISH', 'BEARISH', 'OVERBOUGHT', 'OVERSOLD', 'NO_BIAS']
    for (const status of priority) {
      if (dominantStatuses.some(([s, _]) => s === status)) {
        return status as 'BULLISH' | 'BEARISH' | 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS'
      }
    }
    
    return 'NO_BIAS'
  }

  const subcategoryData = processSubcategoryData()
  const timeframes = ['Daily', '2-Hour', 'Weekly', 'Monthly']

  const handleCellClick = (subcategory: string, timeframe: string) => {
    setSelectedCell({ subcategory, timeframe })
    setShowDetails(true)
  }

  const handleOverallCellClick = (subcategory: string) => {
    setSelectedCell({ subcategory, timeframe: 'Overall' })
    setShowDetails(true)
  }

  const renderCell = (subcategory: string, timeframe: string) => {
    const data = subcategoryData.find(s => s.subcategory === subcategory)?.timeframes[timeframe]
    if (!data || data.total === 0) {
      return (
        <div className="p-2 text-center text-gray-400 text-xs border border-gray-200 bg-gray-50">
          -
        </div>
      )
    }

    const dominantStatus = data.dominantStatus
    const IconComponent = STATUS_ICONS[dominantStatus]
    const color = STATUS_COLORS[dominantStatus]
    const count = data.counts[dominantStatus]
    const percentage = Math.round((count / data.total) * 100)

    return (
      <div 
        className="p-2 text-center border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => handleCellClick(subcategory, timeframe)}
        title={`${subcategory} - ${timeframe}: ${count} ${STATUS_LABELS[dominantStatus]} (${percentage}%)`}
      >
        <div className="flex items-center justify-center space-x-1 mb-1">
          <IconComponent className="h-3 w-3" style={{ color }} />
          <span 
            className="text-xs font-semibold cursor-pointer hover:underline" 
            style={{ color }}
            onClick={(e) => {
              e.stopPropagation()
              handleCellClick(subcategory, timeframe)
            }}
          >
            {count}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          {percentage}%
        </div>
      </div>
    )
  }

  const renderOverallCell = (subcategory: string) => {
    const data = subcategoryData.find(s => s.subcategory === subcategory)?.overall
    if (!data || data.total === 0) {
      return (
        <div className="p-2 text-center text-gray-400 text-xs border border-gray-200 bg-gray-50 font-semibold">
          -
        </div>
      )
    }

    const dominantStatus = data.dominantStatus
    const IconComponent = STATUS_ICONS[dominantStatus]
    const color = STATUS_COLORS[dominantStatus]
    const count = data.counts[dominantStatus]
    const percentage = Math.round((count / data.total) * 100)

    return (
      <div className="p-2 text-center border border-gray-200 bg-gray-100 font-semibold">
        <div className="flex items-center justify-center space-x-1 mb-1">
          <IconComponent className="h-4 w-4" style={{ color }} />
          <span 
            className="text-sm font-bold cursor-pointer hover:underline" 
            style={{ color }}
            onClick={() => handleOverallCellClick(subcategory)}
          >
            {count}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          {percentage}%
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {STATUS_LABELS[dominantStatus]}
        </div>
      </div>
    )
  }

  const renderDetailsModal = () => {
    if (!selectedCell || !showDetails) return null

    // Get the actual indicator data for this subcategory and timeframe
    const relevantConditions = allConditions.filter(condition => {
      const conditionTimeframe = condition.id.split('-')[0]
      const conditionTimeframeName = conditionTimeframe === '2' ? '2-Hour' : conditionTimeframe
      
      if (selectedCell.timeframe === 'Overall') {
        return condition.subcategory === selectedCell.subcategory
      } else {
        return condition.subcategory === selectedCell.subcategory && conditionTimeframeName === selectedCell.timeframe
      }
    })

    if (relevantConditions.length === 0) return null

    // Group by status
    const groupedByStatus = relevantConditions.reduce((acc, condition) => {
      if (!acc[condition.status]) {
        acc[condition.status] = []
      }
      acc[condition.status].push(condition)
      return acc
    }, {} as { [key: string]: ChecklistItem[] })

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {selectedCell.subcategory.replace('-', ' ')} - {selectedCell.timeframe} ({relevantConditions.length} indicators)
            </h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {Object.entries(groupedByStatus)
              .sort(([a], [b]) => {
                // Sort by status priority: BULLISH > BEARISH > OVERBOUGHT > OVERSOLD > NO_BIAS
                const priority = ['BULLISH', 'BEARISH', 'OVERBOUGHT', 'OVERSOLD', 'NO_BIAS']
                return priority.indexOf(a) - priority.indexOf(b)
              })
              .map(([status, conditions]) => {
                const IconComponent = STATUS_ICONS[status as keyof typeof STATUS_ICONS]
                const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS]
                
                return (
                  <div key={status} className="mb-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <IconComponent className="h-5 w-5" style={{ color }} />
                      <h4 className="text-lg font-semibold text-gray-900">
                        {STATUS_LABELS[status as keyof typeof STATUS_LABELS]} ({conditions.length})
                      </h4>
                    </div>
                    
                    <div className="space-y-2">
                      {conditions.map(condition => (
                        <div key={condition.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {condition.label}
                              </div>
                              <div className="text-xs text-gray-600 font-mono">
                                {condition.description}
                              </div>
                            </div>
                            <div className="ml-4">
                              {condition.strength && (
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  condition.strength === 'STRONG' ? 'bg-yellow-100 text-yellow-800' :
                                  condition.strength === 'MODERATE' ? 'bg-gray-100 text-gray-800' :
                                  'bg-gray-50 text-gray-600'
                                }`}>
                                  {condition.strength}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Subcategory Performance Matrix</h3>
        <p className="text-sm text-gray-600">
          Performance breakdown by subcategory across timeframes. Click cells for detailed breakdown.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(STATUS_COLORS).map(([status, color]) => {
          const IconComponent = STATUS_ICONS[status as keyof typeof STATUS_ICONS]
          return (
            <div
              key={status}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white border border-gray-200"
            >
              <IconComponent className="h-4 w-4" style={{ color }} />
              <span className="text-sm font-medium text-gray-700">
                {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 bg-white rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left font-semibold text-gray-900 border border-gray-200">
                Subcategory
              </th>
              {timeframes.map(timeframe => (
                <th key={timeframe} className="p-3 text-center font-semibold text-gray-900 border border-gray-200">
                  {timeframe}
                </th>
              ))}
              <th className="p-3 text-center font-semibold text-gray-900 border border-gray-200 bg-gray-100">
                Overall
              </th>
            </tr>
          </thead>
          <tbody>
            {subcategoryData.map((subcategory, index) => (
              <tr key={subcategory.subcategory} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-3 font-medium text-gray-900 border border-gray-200 capitalize">
                  {subcategory.subcategory.replace('-', ' ')}
                </td>
                {timeframes.map(timeframe => (
                  <td key={timeframe} className="border border-gray-200">
                    {renderCell(subcategory.subcategory, timeframe)}
                  </td>
                ))}
                <td className="border border-gray-200">
                  {renderOverallCell(subcategory.subcategory)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insights Section */}
      <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Key Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Strongest Subcategories:</h5>
            <ul className="space-y-1 text-gray-600">
              {subcategoryData
                .filter(s => s.overall.total > 0)
                .sort((a, b) => {
                  const aStrength = a.overall.counts[a.overall.dominantStatus] / a.overall.total
                  const bStrength = b.overall.counts[b.overall.dominantStatus] / b.overall.total
                  return bStrength - aStrength
                })
                .slice(0, 3)
                .map(subcategory => {
                  const strength = Math.round((subcategory.overall.counts[subcategory.overall.dominantStatus] / subcategory.overall.total) * 100)
                  return (
                    <li key={subcategory.subcategory} className="flex items-center space-x-2">
                      <span className="capitalize">{subcategory.subcategory.replace('-', ' ')}</span>
                      <span className="text-gray-400">•</span>
                      <span className="font-medium" style={{ color: STATUS_COLORS[subcategory.overall.dominantStatus] }}>
                        {strength}% {STATUS_LABELS[subcategory.overall.dominantStatus]}
                      </span>
                    </li>
                  )
                })}
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Timeframe Patterns:</h5>
            <ul className="space-y-1 text-gray-600">
              {timeframes.map(timeframe => {
                const timeframeData = subcategoryData
                  .map(s => s.timeframes[timeframe])
                  .filter(t => t.total > 0)
                
                if (timeframeData.length === 0) return null
                
                const dominantStatuses = timeframeData.map(t => t.dominantStatus)
                const mostCommon = dominantStatuses.reduce((acc, status) => {
                  acc[status] = (acc[status] || 0) + 1
                  return acc
                }, {} as { [key: string]: number })
                
                const topStatus = Object.entries(mostCommon).sort((a, b) => b[1] - a[1])[0]
                
                return (
                  <li key={timeframe} className="flex items-center space-x-2">
                    <span className="font-medium">{timeframe}</span>
                    <span className="text-gray-400">•</span>
                    <span style={{ color: STATUS_COLORS[topStatus[0] as keyof typeof STATUS_COLORS] }}>
                      {topStatus[1]} subcategories {STATUS_LABELS[topStatus[0] as keyof typeof STATUS_LABELS]}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {renderDetailsModal()}
    </div>
  )
}
