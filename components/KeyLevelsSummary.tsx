'use client'

import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Target, Shield, Zap, Filter, X, Info } from 'lucide-react'

interface KeyLevel {
  price: number
  type: 'BUY' | 'SELL'
  strength: 'STRONG' | 'MODERATE' | 'WEAK'
  source: string
  timeframe: string
  distance: number // Distance from current price in percentage
  originalDescription?: string // Store the original indicator description
  indicatorType?: string // Store the original indicator type
}

interface KeyLevelsSummaryProps {
  allConditions: any[]
  currentPrice: number
}

export default function KeyLevelsSummary({ allConditions, currentPrice }: KeyLevelsSummaryProps) {
  const [selectedTimeframes, setSelectedTimeframes] = useState<Set<string>>(new Set(['Daily', '2-Hour', 'Weekly', 'Monthly']))
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<KeyLevel | null>(null)
  const [showLevelModal, setShowLevelModal] = useState(false)
  const [buySignalsToShow, setBuySignalsToShow] = useState(3)
  const [sellSignalsToShow, setSellSignalsToShow] = useState(3)
  
  // Extract key levels from support/resistance indicators
  const extractKeyLevels = (): KeyLevel[] => {
    const levels: KeyLevel[] = []
    
    // Debug: Log all conditions to see what we're working with
    // console.log('KeyLevelsSummary - All conditions:', allConditions.length)
    // console.log('KeyLevelsSummary - Current price:', currentPrice)
    // console.log('KeyLevelsSummary - Fibonacci conditions:', allConditions.filter(c => c.label.includes('Fibonacci')))
    
    // Debug: Log all Fibonacci conditions with their details
    allConditions.filter(c => c.label.includes('Fibonacci')).forEach(fib => {
      // console.log('KeyLevelsSummary - Fibonacci condition:', {
      //   label: fib.label,
      //   description: fib.description,
      //   status: fib.status,
      //   strength: fib.strength
      // })
    })
    
    allConditions.forEach(condition => {
      // Include support/resistance indicators, Bollinger Bands, MML, and SMA indicators for key levels
      if ((condition.category === 'technical' && condition.subcategory === 'support-resistance') ||
          (condition.category === 'technical' && condition.subcategory === 'volatility' && 
           (condition.label.includes('BB') || condition.label.includes('MML'))) ||
          (condition.category === 'technical' && condition.subcategory === 'directional' && 
           condition.label.includes('SMA'))) {
        const description = condition.description
        
        // Intelligent price extraction based on indicator type
        const extractPricesByType = (text: string, indicatorType: string): number[] => {
          const prices: number[] = []
          
          if (indicatorType.includes('Swing')) {
            // For Swing High/Low - extract the specific swing levels mentioned
            const swingMatch = text.match(/High: \$([\d,]+\.\d+) \| Low: \$([\d,]+\.\d+)/)
            if (swingMatch) {
              prices.push(parseFloat(swingMatch[1].replace(',', ''))) // High
              prices.push(parseFloat(swingMatch[2].replace(',', ''))) // Low
            }
          } else if (indicatorType.includes('Fibonacci')) {
            // For Fibonacci - extract all levels regardless of distance
            // console.log('KeyLevelsSummary - Processing Fibonacci:', indicatorType, text)
            
            // Check for "Near" format first
            const nearLevelMatch = text.match(/Near (\d+\.?\d*%): \$([\d,]+\.\d+)/)
            if (nearLevelMatch) {
              // console.log('KeyLevelsSummary - Found Fibonacci level (Near):', nearLevelMatch[1], nearLevelMatch[2])
              prices.push(parseFloat(nearLevelMatch[2].replace(',', '')))
            } else {
              // Check for "At" format (when not near but still want to include)
              const atLevelMatch = text.match(/At (\d+\.?\d*%): \$([\d,]+\.\d+)/)
              if (atLevelMatch) {
                // console.log('KeyLevelsSummary - Found Fibonacci level (At):', atLevelMatch[1], atLevelMatch[2])
                prices.push(parseFloat(atLevelMatch[2].replace(',', '')))
              } else {
                // Fallback: extract the 0% and 100% levels (swing high/low)
                const allLevelsMatch = text.match(/0%\(\$([\d,]+\.\d+)\) .* 100%\(\$([\d,]+\.\d+)\)/)
                if (allLevelsMatch) {
                  prices.push(parseFloat(allLevelsMatch[1].replace(',', ''))) // 0% (swing low)
                  prices.push(parseFloat(allLevelsMatch[2].replace(',', ''))) // 100% (swing high)
                }
              }
            }
          } else if (indicatorType.includes('Pivot')) {
            // For Pivot Points - extract the specific level mentioned
            const pivotMatch = text.match(/Near (Support|Resistance) (S\d|R\d|PP): \$([\d,]+\.\d+)/)
            if (pivotMatch) {
              prices.push(parseFloat(pivotMatch[3].replace(',', '')))
            } else {
              // Extract PP level as fallback
              const ppMatch = text.match(/PP: \$([\d,]+\.\d+)/)
              if (ppMatch) {
                prices.push(parseFloat(ppMatch[1].replace(',', '')))
              }
            }
          } else if (indicatorType.includes('Horizontal')) {
            // For Horizontal S/R - extract the specific level mentioned
            const horizontalMatch = text.match(/Near (Support|Resistance): \$([\d,]+\.\d+)/)
            if (horizontalMatch) {
              prices.push(parseFloat(horizontalMatch[2].replace(',', '')))
            }
          } else if (indicatorType.includes('BB')) {
            // For Bollinger Bands - extract Upper and Lower bands
            const bbMatch = text.match(/Upper: \$([\d,]+\.\d+) \| .* \| Lower: \$([\d,]+\.\d+)/)
            if (bbMatch) {
              prices.push(parseFloat(bbMatch[1].replace(',', ''))) // Upper band
              prices.push(parseFloat(bbMatch[2].replace(',', ''))) // Lower band
            }
          } else if (indicatorType.includes('MML')) {
            // For Murrey Math Lines - extract the specific levels mentioned
            if (indicatorType.includes('Overshoot')) {
              // Extract +1/8 and +2/8 levels
              const mmlMatch = text.match(/\+2\/8: \$([\d,]+\.\d+) \| \+1\/8: \$([\d,]+\.\d+)/)
              if (mmlMatch) {
                prices.push(parseFloat(mmlMatch[1].replace(',', ''))) // +2/8
                prices.push(parseFloat(mmlMatch[2].replace(',', ''))) // +1/8
              }
            } else if (indicatorType.includes('Oversold')) {
              // Extract -1/8 and -2/8 levels
              const mmlMatch = text.match(/-1\/8: \$([\d,]+\.\d+) \| -2\/8: \$([\d,]+\.\d+)/)
              if (mmlMatch) {
                prices.push(parseFloat(mmlMatch[1].replace(',', ''))) // -1/8
                prices.push(parseFloat(mmlMatch[2].replace(',', ''))) // -2/8
              }
            }
          } else if (indicatorType.includes('SMA')) {
            // For SMA indicators - extract the SMA level mentioned
            // Look for patterns like "Daily Close ($123.45) > Daily 200 SMA ($120.00)"
            const smaMatch = text.match(/SMA \(\$([\d,]+\.\d+)\)/)
            if (smaMatch) {
              prices.push(parseFloat(smaMatch[1].replace(',', '')))
            } else {
              // Fallback for other SMA patterns
              const smaPriceMatch = text.match(/(\d+\.?\d*) SMA.*\$([\d,]+\.\d+)/)
              if (smaPriceMatch) {
                prices.push(parseFloat(smaPriceMatch[2].replace(',', '')))
              }
            }
          } else {
            // Fallback - extract first price found
            const priceMatch = text.match(/\$([\d,]+\.\d+)/)
            if (priceMatch) {
              prices.push(parseFloat(priceMatch[1].replace(',', '')))
            }
          }
          
          return prices
        }
        
        const prices = extractPricesByType(description, condition.label)
        
        prices.forEach(price => {
          if (price > 0) {
            const distance = Math.abs(currentPrice - price) / currentPrice * 100
            const type = price < currentPrice ? 'BUY' : 'SELL'
            
            // Determine strength based on indicator type and condition
            let strength: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK'
            if (condition.strength === 'STRONG') {
              strength = 'STRONG'
            } else if (condition.strength === 'MODERATE') {
              strength = 'MODERATE'
            }
            
            // Special handling for different indicator types
            let source = condition.label
            if (condition.label.includes('Swing')) {
              source = 'Swing Level'
            } else if (condition.label.includes('Fibonacci')) {
              source = 'Fib Level'
            } else if (condition.label.includes('Pivot')) {
              source = 'Pivot Level'
            } else if (condition.label.includes('Horizontal')) {
              source = 'S/R Level'
            } else if (condition.label.includes('BB')) {
              source = 'BB Level'
            } else if (condition.label.includes('MML')) {
              source = 'MML Level'
            } else if (condition.label.includes('SMA')) {
              source = 'SMA Level'
            }
            
            // Add timeframe info to source
            const timeframe = condition.id.split('-')[0]
            const timeframeName = timeframe === '2' ? '2-Hour' : timeframe
            
                         levels.push({
               price,
               type,
               strength,
               source: `${source} • ${timeframeName}`,
               timeframe: timeframeName,
               distance,
               originalDescription: description,
               indicatorType: condition.label
             })
          }
        })
      }
    })
    
    return levels
  }
  
  const allLevels = extractKeyLevels()
  
  // Debug: Log extracted levels
  // console.log('KeyLevelsSummary - All extracted levels:', allLevels.length)
  // console.log('KeyLevelsSummary - Fibonacci levels:', allLevels.filter(l => l.source.includes('Fib')))
  
  // Debug: Log all extracted levels with details
  allLevels.forEach(level => {
    // console.log('KeyLevelsSummary - Extracted level:', {
    //   price: level.price,
    //   type: level.type,
    //   source: level.source,
    //   timeframe: level.timeframe,
    //   distance: level.distance
    // })
  })
  
  // Filter levels by selected timeframes
  const filteredLevels = allLevels.filter(level => selectedTimeframes.has(level.timeframe))
  
  // Filter and sort buy zones (support levels below current price)
  const buyZones = filteredLevels
    .filter(level => level.type === 'BUY')
    .sort((a, b) => b.price - a.price) // Sort by price descending (closest first)
    .slice(0, buySignalsToShow)
  
  // Filter and sort sell zones (resistance levels above current price)
  const sellZones = filteredLevels
    .filter(level => level.type === 'SELL')
    .sort((a, b) => a.price - b.price) // Sort by price ascending (closest first)
    .slice(0, sellSignalsToShow)
  
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'STRONG': return 'text-red-600 bg-red-100'
      case 'MODERATE': return 'text-orange-600 bg-orange-100'
      case 'WEAK': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }
  
     const getStrengthIcon = (strength: string) => {
     switch (strength) {
       case 'STRONG': return <Zap className="h-4 w-4" />
       case 'MODERATE': return <Target className="h-4 w-4" />
       case 'WEAK': return <Shield className="h-4 w-4" />
       default: return <Shield className="h-4 w-4" />
     }
   }

   const handleLevelClick = (level: KeyLevel) => {
     setSelectedLevel(level)
     setShowLevelModal(true)
   }

   const closeLevelModal = () => {
     setShowLevelModal(false)
     setSelectedLevel(null)
   }
  
  return (
    <div className="card bg-gradient-to-r from-green-50 to-red-50 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Key Levels Summary</h3>
        </div>
        <div className="flex items-center space-x-4">
          {/* Timeframe Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-gray-700">Timeframes</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {selectedTimeframes.size}
            </span>
          </button>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-800">
              ${currentPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">Current Price</div>
          </div>
        </div>
      </div>
      
      {/* Timeframe Filter Panel */}
      {showFilters && (
        <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Filter by Timeframe</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedTimeframes(new Set(['Daily', '2-Hour', 'Weekly', 'Monthly']))}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
              >
                All
              </button>
              <button
                onClick={() => setSelectedTimeframes(new Set())}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['Daily', '2-Hour', 'Weekly', 'Monthly'].map(timeframe => (
              <label key={timeframe} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTimeframes.has(timeframe)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedTimeframes)
                    if (e.target.checked) {
                      newSelected.add(timeframe)
                    } else {
                      newSelected.delete(timeframe)
                    }
                    setSelectedTimeframes(newSelected)
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{timeframe}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Showing {filteredLevels.length} levels from {selectedTimeframes.size} timeframes
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buy Zones */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h4 className="text-lg font-semibold text-green-700">
              Next {buySignalsToShow} Buy Zones
              {filteredLevels.filter(level => level.type === 'BUY').length > buySignalsToShow && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (of {filteredLevels.filter(level => level.type === 'BUY').length})
                </span>
              )}
            </h4>
          </div>
          
          {buyZones.length > 0 ? (
            <div className="space-y-2">
                             {buyZones.map((level, index) => (
                 <div 
                   key={index} 
                   className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 shadow-sm cursor-pointer hover:bg-green-50 transition-colors"
                   onClick={() => handleLevelClick(level)}
                 >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded ${getStrengthColor(level.strength)}`}>
                      {getStrengthIcon(level.strength)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        ${level.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {level.source} • {level.timeframe}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      -{level.distance.toFixed(1)}%
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${getStrengthColor(level.strength)}`}>
                      {level.strength}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No buy zones identified
            </div>
          )}
          
          {/* Show More Buy Signals Button */}
          {filteredLevels.filter(level => level.type === 'BUY').length > buySignalsToShow && (
            <div className="text-center pt-2 space-x-2">
              <button
                onClick={() => setBuySignalsToShow(prev => prev + 5)}
                className="text-sm text-green-600 hover:text-green-700 font-medium px-3 py-1 rounded-lg border border-green-200 hover:bg-green-50 transition-colors"
              >
                Show {Math.min(5, filteredLevels.filter(level => level.type === 'BUY').length - buySignalsToShow)} More
              </button>
              <button
                onClick={() => setBuySignalsToShow(filteredLevels.filter(level => level.type === 'BUY').length)}
                className="text-sm text-green-700 hover:text-green-800 font-medium px-3 py-1 rounded-lg border border-green-300 hover:bg-green-100 transition-colors"
              >
                Show All ({filteredLevels.filter(level => level.type === 'BUY').length})
              </button>
            </div>
          )}
          {/* Reset Buy Signals Button */}
          {buySignalsToShow > 3 && (
            <div className="text-center pt-1">
              <button
                onClick={() => setBuySignalsToShow(3)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Show Only Top 3
              </button>
            </div>
          )}
        </div>
        
        {/* Sell Zones */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <h4 className="text-lg font-semibold text-red-700">
              Next {sellSignalsToShow} Sell Zones
              {filteredLevels.filter(level => level.type === 'SELL').length > sellSignalsToShow && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (of {filteredLevels.filter(level => level.type === 'SELL').length})
                </span>
              )}
            </h4>
          </div>
          
          {sellZones.length > 0 ? (
            <div className="space-y-2">
                             {sellZones.map((level, index) => (
                 <div 
                   key={index} 
                   className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 shadow-sm cursor-pointer hover:bg-red-50 transition-colors"
                   onClick={() => handleLevelClick(level)}
                 >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded ${getStrengthColor(level.strength)}`}>
                      {getStrengthIcon(level.strength)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        ${level.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {level.source} • {level.timeframe}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">
                      +{level.distance.toFixed(1)}%
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${getStrengthColor(level.strength)}`}>
                      {level.strength}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No sell zones identified
            </div>
          )}
          
          {/* Show More Sell Signals Button */}
          {filteredLevels.filter(level => level.type === 'SELL').length > sellSignalsToShow && (
            <div className="text-center pt-2 space-x-2">
              <button
                onClick={() => setSellSignalsToShow(prev => prev + 5)}
                className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
              >
                Show {Math.min(5, filteredLevels.filter(level => level.type === 'SELL').length - sellSignalsToShow)} More
              </button>
              <button
                onClick={() => setSellSignalsToShow(filteredLevels.filter(level => level.type === 'SELL').length)}
                className="text-sm text-red-700 hover:text-red-800 font-medium px-3 py-1 rounded-lg border border-red-300 hover:bg-red-100 transition-colors"
              >
                Show All ({filteredLevels.filter(level => level.type === 'SELL').length})
              </button>
            </div>
          )}
          {/* Reset Sell Signals Button */}
          {sellSignalsToShow > 3 && (
            <div className="text-center pt-1">
              <button
                onClick={() => setSellSignalsToShow(3)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Show Only Top 3
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-green-600">{buyZones.length}</div>
            <div className="text-gray-500">Buy Zones</div>
          </div>
          <div>
            <div className="font-semibold text-red-600">{sellZones.length}</div>
            <div className="text-gray-500">Sell Zones</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{filteredLevels.length}</div>
            <div className="text-gray-500">Filtered Levels</div>
          </div>
          <div>
            <div className="font-semibold text-gray-600">{allLevels.length}</div>
            <div className="text-gray-500">Total Levels</div>
          </div>
        </div>
      </div>

      {/* Level Details Modal */}
      {showLevelModal && selectedLevel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Info className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Level Details</h2>
              </div>
              <button
                onClick={closeLevelModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Level Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Price Level</div>
                      <div className="text-2xl font-bold text-gray-900">${selectedLevel.price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Type</div>
                      <div className={`text-lg font-semibold ${
                        selectedLevel.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedLevel.type}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Distance</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedLevel.type === 'BUY' ? '-' : '+'}{selectedLevel.distance.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Strength</div>
                      <div className={`text-lg font-semibold px-2 py-1 rounded ${getStrengthColor(selectedLevel.strength)}`}>
                        {selectedLevel.strength}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Source Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Source Information</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Indicator Type</div>
                      <div className="text-gray-900 font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                        {selectedLevel.indicatorType}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Timeframe</div>
                      <div className="text-gray-900">{selectedLevel.timeframe}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Source</div>
                      <div className="text-gray-900">{selectedLevel.source}</div>
                    </div>
                  </div>
                </div>

                {/* Original Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Original Indicator Data</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-700 font-mono whitespace-pre-wrap">
                      {selectedLevel.originalDescription}
                    </div>
                  </div>
                </div>

                {/* Extraction Analysis */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Extraction Analysis</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-800">
                      <p><strong>Extracted Price:</strong> ${selectedLevel.price.toFixed(2)}</p>
                      <p><strong>Current Price:</strong> ${currentPrice.toFixed(2)}</p>
                      <p><strong>Classification:</strong> {selectedLevel.price < currentPrice ? 'Support (BUY)' : 'Resistance (SELL)'}</p>
                      <p><strong>Distance Calculation:</strong> {Math.abs(currentPrice - selectedLevel.price).toFixed(2)} points ({selectedLevel.distance.toFixed(1)}%)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
