'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Target, Shield, Zap } from 'lucide-react'

interface KeyLevel {
  price: number
  type: 'BUY' | 'SELL'
  strength: 'STRONG' | 'MODERATE' | 'WEAK'
  source: string
  timeframe: string
  distance: number // Distance from current price in percentage
}

interface KeyLevelsSummaryProps {
  allConditions: any[]
  currentPrice: number
}

export default function KeyLevelsSummary({ allConditions, currentPrice }: KeyLevelsSummaryProps) {
  // Extract key levels from support/resistance indicators
  const extractKeyLevels = (): KeyLevel[] => {
    const levels: KeyLevel[] = []
    
    allConditions.forEach(condition => {
      // Include support/resistance indicators and also Bollinger Bands and MML for key levels
      if ((condition.category === 'technical' && condition.subcategory === 'support-resistance') ||
          (condition.category === 'technical' && condition.subcategory === 'volatility' && 
           (condition.label.includes('BB') || condition.label.includes('MML')))) {
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
            // For Fibonacci - extract the specific level mentioned (e.g., "Near 23.6%: $6447.02")
            const nearLevelMatch = text.match(/Near (\d+\.?\d*%): \$([\d,]+\.\d+)/)
            if (nearLevelMatch) {
              prices.push(parseFloat(nearLevelMatch[2].replace(',', '')))
            } else {
              // If not near any level, extract the 0% and 100% levels (swing high/low)
              const allLevelsMatch = text.match(/0%\(\$([\d,]+\.\d+)\) .* 100%\(\$([\d,]+\.\d+)\)/)
              if (allLevelsMatch) {
                prices.push(parseFloat(allLevelsMatch[1].replace(',', ''))) // 0% (swing low)
                prices.push(parseFloat(allLevelsMatch[2].replace(',', ''))) // 100% (swing high)
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
              distance
            })
          }
        })
      }
    })
    
    return levels
  }
  
  const allLevels = extractKeyLevels()
  
  // Filter and sort buy zones (support levels below current price)
  const buyZones = allLevels
    .filter(level => level.type === 'BUY')
    .sort((a, b) => b.price - a.price) // Sort by price descending (closest first)
    .slice(0, 3)
  
  // Filter and sort sell zones (resistance levels above current price)
  const sellZones = allLevels
    .filter(level => level.type === 'SELL')
    .sort((a, b) => a.price - b.price) // Sort by price ascending (closest first)
    .slice(0, 3)
  
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
  
  return (
    <div className="card bg-gradient-to-r from-green-50 to-red-50 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Key Levels Summary</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-800">
            ${currentPrice.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">Current Price</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buy Zones */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h4 className="text-lg font-semibold text-green-700">Next 3 Buy Zones</h4>
          </div>
          
          {buyZones.length > 0 ? (
            <div className="space-y-2">
              {buyZones.map((level, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 shadow-sm">
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
        </div>
        
        {/* Sell Zones */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <h4 className="text-lg font-semibold text-red-700">Next 3 Sell Zones</h4>
          </div>
          
          {sellZones.length > 0 ? (
            <div className="space-y-2">
              {sellZones.map((level, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 shadow-sm">
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
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-green-600">{buyZones.length}</div>
            <div className="text-gray-500">Buy Zones</div>
          </div>
          <div>
            <div className="font-semibold text-red-600">{sellZones.length}</div>
            <div className="text-gray-500">Sell Zones</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{allLevels.length}</div>
            <div className="text-gray-500">Total Levels</div>
          </div>
        </div>
      </div>
    </div>
  )
}
