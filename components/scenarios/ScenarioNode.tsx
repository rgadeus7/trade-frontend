'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDownIcon, ChevronRightIcon, Cog6ToothIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import ConditionBuilder, { TradingCondition } from './ConditionBuilder'
import TradeZones from './TradeZones'
import ComparisonPopup from './ComparisonPopup'
import { TradeZone } from '../../types/scenarios'
import { useScenarioEngine } from '../../lib/scenarios/scenarioEngine'
import { getMarketDataLabel, getMarketDataValue } from '../../lib/marketDataMappings'
import { ParsedMarketData, getMarketDataValue as getParsedMarketDataValue, getMarketDataLabel as getParsedMarketDataLabel } from '../../lib/marketDataParser'

/**
 * Parse timeframe field format: "1D_P0_open" -> { timeframe: "1D", field: "open", period: "P0" }
 */
function parseTimeframeField(fieldName: any): { timeframe: string; field: string; period: string } | null {
  // Ensure fieldName is a string
  if (!fieldName || typeof fieldName !== 'string') {
    return null
  }
  
  // Match patterns like "1D_P0_open", "2H_P1_high", "1D_P0_sma_89"
  const match = fieldName.match(/^(\d+[DHWM]?)_(P\d+)_(.+)$/)
  if (match) {
    const [, timeframe, period, field] = match
    return { timeframe, field, period }
  }
  return null
}

/**
 * Resolve trade zone values with support for multiplication expressions
 * Examples: "2H_P0_sma_89 * 0.99" -> actual SMA value * 0.99
 */
function resolveTradeZoneValue(expression: string, data: any, parsedData?: ParsedMarketData): number {
  if (!expression || typeof expression !== 'string') {
    return 0
  }

  try {
    // Check if it's a multiplication expression
    if (expression.includes(' * ')) {
      const [baseField, multiplier] = expression.split(' * ').map(s => s.trim())
      const multiplierValue = parseFloat(multiplier)
      
      if (isNaN(multiplierValue)) {
        console.log(`❌ Invalid multiplier in expression: ${expression}`)
        return 0
      }

      // Parse the base field
      const parsedField = parseTimeframeField(baseField)
      if (!parsedField) {
        console.log(`❌ Could not parse base field: ${baseField}`)
        return 0
      }

      // Get the base value
      let baseValue = 0
      if (parsedData) {
        const value = getParsedMarketDataValue(parsedData, parsedField.field, parsedField.timeframe, parsedField.period)
        baseValue = typeof value === 'number' ? value : parseFloat(String(value || '0')) || 0
      } else {
        // Fallback to legacy data structure
        const value = getMarketDataValue(data, parsedField.field, parsedField.timeframe)
        baseValue = typeof value === 'number' ? value : parseFloat(String(value || '0')) || 0
      }

      const result = baseValue * multiplierValue
      console.log(`🔢 Multiplication: ${baseValue} * ${multiplierValue} = ${result} (from ${expression})`)
      return result
    }

    // Handle simple field references
    const parsedField = parseTimeframeField(expression)
    if (parsedField) {
      let value = 0
      if (parsedData) {
        const rawValue = getParsedMarketDataValue(parsedData, parsedField.field, parsedField.timeframe, parsedField.period)
        value = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue || '0')) || 0
      } else {
        const rawValue = getMarketDataValue(data, parsedField.field, parsedField.timeframe)
        value = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue || '0')) || 0
      }
      console.log(`🔢 Simple field: ${expression} = ${value}`)
      return value
    }

    // Try to parse as a direct number
    const directValue = parseFloat(expression)
    if (!isNaN(directValue)) {
      console.log(`🔢 Direct value: ${expression} = ${directValue}`)
      return directValue
    }

    console.log(`❌ Could not resolve expression: ${expression}`)
    return 0
  } catch (error) {
    console.log(`❌ Error resolving expression "${expression}":`, error)
    return 0
  }
}

/**
 * Format market data value to 2 decimal places
 */
function formatMarketDataValue(value: any): string {
  if (!value || value === 'Loading...') {
    return value
  }
  
  const numericValue = parseFloat(value.toString())
  if (isNaN(numericValue)) {
    return value
  }
  
  return `$${numericValue.toFixed(2)}`
}

interface ScenarioNodeProps {
  node: {
    id: string
    name: string
    description: string
    probability: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    timeHorizon: string
    category: string
    filters?: any[]
    tradeZones?: TradeZone[]
  }
  isSelected: boolean
  onSelect: () => void
  className?: string
  selectedSymbol?: string
  session?: any
  marketData?: any
  isLoadingMarketData?: boolean
  onEvaluationResult?: (result: any) => void
}

export default function ScenarioNode({ node, isSelected, onSelect, className = '', selectedSymbol, session, marketData, isLoadingMarketData, onEvaluationResult }: ScenarioNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<any>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [showComparisonPopup, setShowComparisonPopup] = useState(false)
  const { evaluateScenario } = useScenarioEngine()
  const evaluationInProgress = useRef(false)
  const lastEvaluationResult = useRef<any>(null)

  // Notify parent component when evaluation result changes
  useEffect(() => {
    if (evaluationResult && onEvaluationResult && evaluationResult !== lastEvaluationResult.current) {
      lastEvaluationResult.current = evaluationResult
      onEvaluationResult(evaluationResult)
    }
  }, [evaluationResult])

  // Extract comparison values for display (memoized to prevent unnecessary recalculations)
  const comparisonValues = useMemo(() => {
    // Use the original market data for comparison values since it has all the SMA values
    const data = marketData
    
    console.log('🔍 ScenarioNode comparisonValues - data:', data)
    console.log('🔍 ScenarioNode comparisonValues - node.filters:', node.filters)
    
    // If no data available, return null to show loading state
    if (!data) {
      console.log('🔍 No market data available')
      return null
    }
    
    const values: Array<{ label: string; value: string; type: 'current' | 'comparison' | 'calculated' }> = []

    // Extract values from the scenario filters using new timeframe format
    if (node.filters && node.filters.length > 0) {
      node.filters.forEach(filter => {
        // Check if it's parsed market data (new structure)
        if ('timeframes' in data) {
          const parsedData = data as ParsedMarketData
          
          // Show the field being compared (e.g., 1D_P0_open)
          if (filter.field) {
            const parsedField = parseTimeframeField(filter.field)
            if (parsedField) {
              const { timeframe, field, period } = parsedField
              const fieldLabel = getParsedMarketDataLabel(field, timeframe, period)
              const fieldValue = getParsedMarketDataValue(parsedData, field, timeframe, period)
              values.push({
                label: fieldLabel,
                value: formatMarketDataValue(fieldValue),
                type: 'current'
              })
            }
          }
          
          if (filter.value) {
            const parsedValue = parseTimeframeField(filter.value)
            if (parsedValue) {
              const { timeframe, field, period } = parsedValue
              const comparisonLabel = getParsedMarketDataLabel(field, timeframe, period)
              const comparisonValue = getParsedMarketDataValue(parsedData, field, timeframe, period)
              values.push({
                label: comparisonLabel,
                value: formatMarketDataValue(comparisonValue),
                type: 'comparison'
              })
            }
          }

          if (filter.minValue) {
            // Use resolveTradeZoneValue to handle multiplication expressions
            const minValue = resolveTradeZoneValue(filter.minValue, data, parsedData)
            const minLabel = `${filter.minValue}`
            values.push({
              label: minLabel,
              value: formatMarketDataValue(minValue),
              type: 'calculated'
            })
          }
          
          if (filter.maxValue) {
            // Use resolveTradeZoneValue to handle multiplication expressions
            const maxValue = resolveTradeZoneValue(filter.maxValue, data, parsedData)
            const maxLabel = `${filter.maxValue}`
            values.push({
              label: maxLabel,
              value: formatMarketDataValue(maxValue),
              type: 'calculated'
            })
          }
        } else {
          // Legacy market data structure
          if (filter.field) {
            const fieldLabel = getMarketDataLabel(filter.field, filter.timeframe)
            const fieldValue = getMarketDataValue(data, filter.field, filter.timeframe)
            values.push({
              label: fieldLabel,
              value: formatMarketDataValue(fieldValue),
              type: 'current'
            })
          }
          
          if (filter.value) {
            const comparisonLabel = getMarketDataLabel(filter.value, filter.timeframe)
            const comparisonValue = getMarketDataValue(data, filter.value, filter.timeframe)
            values.push({
              label: comparisonLabel,
              value: formatMarketDataValue(comparisonValue),
              type: 'comparison'
            })
          }
        }
      })
    }

    
    return values.length > 0 ? values : null
  }, [marketData, node.filters])

  const getStatusColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'from-green-500 to-green-700'
      case 'MEDIUM':
        return 'from-yellow-500 to-yellow-700'
      case 'HIGH':
        return 'from-red-500 to-red-700'
      default:
        return 'from-gray-500 to-gray-700'
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'text-green-400'
      case 'MEDIUM':
        return 'text-yellow-400'
      case 'HIGH':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  // Auto-evaluate scenario when market data changes
  useEffect(() => {
    // Only evaluate if we have all required data and aren't already evaluating
    if (selectedSymbol && node.filters && node.filters.length > 0 && marketData && !evaluationInProgress.current) {
      console.log(`🔄 Auto-evaluating scenario ${node.name} for symbol ${selectedSymbol}`)
      // Pass marketData directly to avoid timing issues
      evaluateScenarioAutomatically(marketData)
    }
  }, [selectedSymbol, node.id, node.filters, marketData])

  const evaluateScenarioAutomatically = async (dataToUse?: any) => {
    const data = dataToUse || marketData
    if (!selectedSymbol || !data || evaluationInProgress.current) {
      return
    }

    console.log(`🚀 Starting evaluation for ${node.name} with symbol ${selectedSymbol}`)
    evaluationInProgress.current = true
    setIsEvaluating(true)
    try {
      // Use the same comparison data logic that works in the popup
      const comparisonData = comparisonValues
      console.log(`✅ Using comparison data for evaluation:`, comparisonData)
      
      if (comparisonData && comparisonData.length > 0) {
        // Use the same simple logic as ComparisonPopup
        const currentValues = comparisonData.filter(item => item.type === 'current')
        const comparisonValues = comparisonData.filter(item => item.type === 'comparison')
        const calculatedValues = comparisonData.filter(item => item.type === 'calculated')
        
        let status: 'BULLISH' | 'BEARISH' | 'NO_BIAS' = 'NO_BIAS'
        let confidence = 0
        
        // Dynamic evaluation based on scenario filters - no hardcoding!
        if (node.filters && node.filters.length > 0) {
          let passedFilters = 0
          let totalFilters = node.filters.length
          
          // Get parsed data for multiplication calculations
          const parsedData = 'timeframes' in data ? data as ParsedMarketData : undefined
          
          console.log(`🔍 Evaluating ${totalFilters} filters for scenario: ${node.name}`)
          console.log(`🔍 Available data:`, {
            current: currentValues.map(v => ({ label: v.label, value: v.value })),
            comparison: comparisonValues.map(v => ({ label: v.label, value: v.value })),
            calculated: calculatedValues.map(v => ({ label: v.label, value: v.value }))
          })
          
          for (const filter of node.filters) {
            console.log(`🔍 Processing filter:`, filter)
            
            // Better field matching - use the same logic as ComparisonPopup
            const fieldValue = currentValues.find(v => {
              if (filter.field === '1D_P0_open') return v.label.includes('Open')
              if (filter.field === '1D_P1_high') return v.label.includes('High')
              if (filter.field === '1D_P1_low') return v.label.includes('Low')
              if (filter.field === '1D_P0_close') return v.label.includes('Close')
              return v.label.includes(filter.field?.split('_').pop() || '')
            })
            
            const comparisonValue = comparisonValues.find(v => {
              if (filter.value === '1D_P1_high') return v.label.includes('High')
              if (filter.value === '1D_P1_low') return v.label.includes('Low')
              if (filter.value === '1D_P0_sma_89') return v.label.includes('SMA 89 (1D)')
              return v.label.includes(filter.value?.split('_').pop() || '')
            })
            
            // Use resolveTradeZoneValue to get proper calculated values
            const minValue = filter.minValue ? {
              label: filter.minValue,
              value: `$${resolveTradeZoneValue(filter.minValue, data, parsedData).toFixed(2)}`
            } : null
            const maxValue = filter.maxValue ? {
              label: filter.maxValue,
              value: `$${resolveTradeZoneValue(filter.maxValue, data, parsedData).toFixed(2)}`
            } : null
            
            console.log(`🔍 Found values:`, {
              fieldValue: fieldValue ? { label: fieldValue.label, value: fieldValue.value } : null,
              comparisonValue: comparisonValue ? { label: comparisonValue.label, value: comparisonValue.value } : null,
              minValue: minValue ? { label: minValue.label, value: minValue.value } : null,
              maxValue: maxValue ? { label: maxValue.label, value: maxValue.value } : null
            })
            
            if (fieldValue && fieldValue.value) {
              const fieldNum = parseFloat(fieldValue.value.replace('$', ''))
              let passed = false
              
              if (filter.operator === 'gt' && comparisonValue && comparisonValue.value) {
                const compareNum = parseFloat(comparisonValue.value.replace('$', ''))
                passed = fieldNum > compareNum
                console.log(`🔍 GT comparison: ${fieldNum} > ${compareNum} = ${passed}`)
              } else if (filter.operator === 'lt' && comparisonValue && comparisonValue.value) {
                const compareNum = parseFloat(comparisonValue.value.replace('$', ''))
                passed = fieldNum < compareNum
                console.log(`🔍 LT comparison: ${fieldNum} < ${compareNum} = ${passed}`)
              } else if (filter.operator === 'between' && minValue && maxValue && minValue.value && maxValue.value) {
                const minNum = parseFloat(minValue.value.replace('$', ''))
                const maxNum = parseFloat(maxValue.value.replace('$', ''))
                passed = fieldNum >= minNum && fieldNum <= maxNum
                console.log(`🔍 BETWEEN comparison: ${fieldNum} between ${minNum}-${maxNum} = ${passed}`)
              }
              
              if (passed) {
                passedFilters++
                console.log(`✅ Filter passed: ${filter.description}`)
              } else {
                console.log(`❌ Filter failed: ${filter.description}`)
              }
            } else {
              console.log(`❌ No field value found for filter: ${filter.field}`)
            }
          }
          
          // Determine status based on filter pass rate
          const passRate = passedFilters / totalFilters
          console.log(`🎯 Filter results: ${passedFilters}/${totalFilters} passed (${Math.round(passRate * 100)}%)`)
          
          if (passRate >= 0.8) {
            status = 'BULLISH' // Most filters passed
            confidence = Math.round(passRate * 100)
          } else if (passRate >= 0.3) {
            status = 'BULLISH' // Some filters passed
            confidence = Math.round(passRate * 100)
          } else {
            status = 'NO_BIAS' // Few or no filters passed
            confidence = 0
          }
          
          console.log(`🎯 Final status: ${status} (${confidence}% confidence)`)
        }
        
        // Create evaluation result
        const result = {
          scenarioId: node.id,
          status,
          confidence,
          timestamp: new Date(),
          marketData: data,
          indicators: {},
          filters: { condition: status !== 'NO_BIAS' },
          probability: node.probability || 50,
          risk: { 
            level: node.riskLevel || 'MEDIUM', 
            factors: [], 
            score: 50, 
            recommendations: [] 
          }
        }
        
        console.log(`🎯 Simple scenario evaluation result:`, result)
        setEvaluationResult(result)
        return // Exit early with our simple result
      }
      
      // Fallback to old logic if no comparison data available
      const symbolData = Array.isArray(data) ? data[0] : data
      if (symbolData && symbolData.dailyHistoricalOHLC) {
        // Use the historical data arrays for scenario evaluation
        const dailyData = symbolData.dailyHistoricalOHLC
        const volumeData = symbolData.dailyHistoricalVolume || []
        
        
        // Get historical data (need more than just today/yesterday for lookback calculations)
        if (dailyData.open && dailyData.open.length >= 2) { // Need at least 2 days for basic evaluation
          // Historical data is in reverse chronological order (oldest at index 0, newest at the end)
          // So the most recent data is at the last index
          const lastIndex = dailyData.open.length - 1;
          const secondLastIndex = dailyData.open.length - 2;
          
          const today = {
            open: dailyData.open[lastIndex] || 0,
            high: dailyData.high[lastIndex] || 0,
            low: dailyData.low[lastIndex] || 0,
            close: dailyData.close[lastIndex] || 0,
            volume: volumeData[lastIndex] || 1000000,
            timestamp: new Date().toISOString()
          }
          const yesterday = {
            open: dailyData.open[secondLastIndex] || 0,
            high: dailyData.high[secondLastIndex] || 0,
            low: dailyData.low[secondLastIndex] || 0,
            close: dailyData.close[secondLastIndex] || 0,
            volume: volumeData[secondLastIndex] || 1000000,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
          
          
          // Calculate derived values that the scenario engine expects
          const yesterday_high = yesterday.high || 0
          const yesterday_low = yesterday.low || 0
          const yesterday_close = yesterday.close || 0
          const yesterday_open = yesterday.open || 0
          const yesterday_volume = yesterday.volume || 0
          
          // Calculate average volume with available data (last 5 days)
          const availableVolumes = [yesterday_volume]
          const startIndex = Math.max(0, volumeData.length - 5); // Get last 5 days
          for (let i = startIndex; i < volumeData.length - 1; i++) { // Exclude today's volume
            if (volumeData[i]) availableVolumes.push(volumeData[i])
          }
          const average_volume = availableVolumes.reduce((sum, vol) => sum + vol, 0) / availableVolumes.length
          
          // Create a market data object for evaluation with proper structure
          const evaluationData = {
            symbol: selectedSymbol,
            instrumentType: selectedSymbol as any,
            timestamp: today.timestamp || new Date().toISOString(),
            
            // Historical data arrays for lookback calculations
            dailyHistoricalPrices: dailyData.close,
            dailyHistoricalOHLC: {
              open: dailyData.open,
              high: dailyData.high,
              low: dailyData.low,
              close: dailyData.close
            },
            dailyHistoricalVolume: volumeData,
            
            // Legacy structure for compatibility
            daily: {
              price: today?.close || 0,
              change: (today?.close || 0) - (yesterday_close || 0),
              volume: today?.volume || 0,
              timestamp: today?.timestamp || new Date().toISOString()
            },
            hourly: null,
            weekly: null,
            monthly: null,
            yesterday: {
              close: yesterday_close,
              high: yesterday_high,
              low: yesterday_low,
              volume: yesterday_volume,
              timestamp: yesterday.timestamp || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            },
            sma: {},
            smaLow: {},
            sma200: 0,
            sma2h: 0,
            weeklySMA: 0,
            monthlySMA: 0,
            sma89Low: 0,
            sma200Low: 0,
            weeklySMALow: 0,
            monthlySMALow: 0,
            hourlyHistoricalPrices: [],
            weeklyHistoricalPrices: [],
            monthlyHistoricalPrices: [],
            hourlyHistoricalOHLC: { open: [], high: [], low: [], close: [] },
            weeklyHistoricalOHLC: { open: [], high: [], low: [], close: [] },
            monthlyHistoricalOHLC: { open: [], high: [], low: [], close: [] }
          }
          
          // Prepare evaluation data with market data
          const evaluationDataWithMarket = {
            ...evaluationData,
            // Current day data
            open: today.open,
            high: today.high,
            low: today.low,
            close: today.close,
            volume: today.volume,
            
            // Yesterday data
            yesterday_high: yesterday_high,
            yesterday_low: yesterday_low,
            yesterday_close: yesterday_close,
            yesterday_open: yesterday_open,
            yesterday_volume: yesterday_volume,
            
            // Average volume
            average_volume: average_volume,
            
            // Indicators from the market data (use actual values from symbolData)
            sma89: symbolData.sma89 || symbolData.sma?.sma89 || 0,
            ema89: symbolData.ema89 || symbolData.ema?.ema89 || 0,
            rsi: symbolData.rsi || 0,
            
            // Add the raw market data for comparison values
            marketData: symbolData
          }
          
          // Evaluate the scenario using the scenario engine
          const result = await evaluateScenario(node.id, evaluationDataWithMarket)
          console.log(`🎯 Scenario evaluation result:`, result)
          setEvaluationResult(result)
        } else {
          console.log(`❌ Insufficient historical data for evaluation (need at least 2 days, got ${dailyData.open?.length || 0})`)
          setEvaluationResult({ 
            status: 'NO_BIAS', 
            probability: 0, 
            risk: { level: 'MEDIUM' },
            message: `Not enough data for bias evaluation. Need at least 2 days of historical data, got ${dailyData.open?.length || 0} days.`
          })
        }
      } else {
        console.log(`❌ No historical data available in market data`)
        setEvaluationResult({ 
          status: 'NO_BIAS', 
          probability: 0, 
          risk: { level: 'MEDIUM' },
          message: 'No historical data available for evaluation. Cannot determine market bias.'
        })
      }
    } catch (error) {
      console.error('❌ Error auto-evaluating scenario:', error)
      setEvaluationResult({ 
        status: 'NO_BIAS', 
        probability: 0, 
        risk: { level: 'MEDIUM' },
        message: `Error evaluating scenario: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      evaluationInProgress.current = false
      setIsEvaluating(false)
    }
  }

  // Get status indicator based on evaluation result
  const getStatusIndicator = () => {
    if (!evaluationResult) return null
    
    // Check for bullish/positive status
    if (evaluationResult.status === 'BULLISH' || evaluationResult.status === 'ACTIVE') {
      return (
        <div className="absolute -top-3 -right-3 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
          <span className="text-white text-xl font-bold">✓</span>
        </div>
      )
    } else if (evaluationResult.status === 'BEARISH' || evaluationResult.status === 'INACTIVE') {
      return (
        <div className="absolute -top-3 -right-3 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
          <span className="text-white text-xl font-bold">✗</span>
        </div>
      )
    } else if (evaluationResult.status === 'OVERBOUGHT' || evaluationResult.status === 'OVERSOLD') {
      return (
        <div className="absolute -top-3 -right-3 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
          <span className="text-white text-xl font-bold">⚠</span>
        </div>
      )
    }
    return null
  }

  // Get status text based on evaluation result
  const getStatusText = () => {
    if (!evaluationResult) return 'Status: Pending'
    
    // Check for bullish/positive status
    if (evaluationResult.status === 'BULLISH' || evaluationResult.status === 'ACTIVE') {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-green-400 font-bold">Status: Bullish ✓</span>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      )
    } else if (evaluationResult.status === 'BEARISH' || evaluationResult.status === 'INACTIVE') {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-red-400 font-bold">Status: Bearish ✗</span>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )
    } else if (evaluationResult.status === 'OVERBOUGHT') {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-yellow-400 font-bold">Status: Overbought ⚠</span>
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
        </div>
      )
    } else if (evaluationResult.status === 'OVERSOLD') {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-yellow-400 font-bold">Status: Oversold ⚠</span>
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
        </div>
      )
    } else if (evaluationResult.status === 'NO_BIAS') {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-red-400 font-bold">Status: No Bias -</span>
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      )
    }
    
    return (
      <div className="flex items-center space-x-2">
        <span className="text-blue-400 font-bold">Status: {evaluationResult.status || 'Unknown'}</span>
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-sm ${className}`}>
      {/* Main Scenario Card */}
      <div
        className={`h-48 bg-gradient-to-br ${getStatusColor(node.riskLevel)} rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-105 relative ${
          isSelected ? 'ring-2 ring-blue-400 shadow-lg' : 'ring-1 ring-gray-600'
        }`}
        onClick={onSelect}
      >
        {/* Expand Button - Move to very top */}
        <div className="flex justify-end mb-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="text-white/80 hover:text-white transition-colors"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Status Indicator */}
        {getStatusIndicator()}

        <div className="flex items-start justify-between mb-1">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{node.name}</h3>
            <p className="text-sm text-white/90 line-clamp-2">{node.description}</p>
          </div>
          <div className="text-right ml-3">
            <div className="text-xs text-white/80">Probability</div>
            <div className="text-lg font-bold text-white">{node.probability}%</div>
          </div>
        </div>

        {/* Market Data Button */}
        <div className="mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowComparisonPopup(true)
            }}
            className="w-full flex items-center justify-center space-x-2 p-2 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-colors"
          >
            <ChartBarIcon className="w-4 h-4 text-white/80" />
            <span className="text-sm text-white/80 font-medium">
              {comparisonValues && comparisonValues.length > 0 
                ? `View ${comparisonValues.length} Market Data Points` 
                : 'View Market Data'
              }
            </span>
          </button>
        </div>


        <div className="flex items-center justify-start">
          <div className="flex items-center space-x-2">
            {isEvaluating ? (
              <div className="flex items-center space-x-2 text-white/80">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm">Evaluating...</span>
              </div>
                        ) : (
              getStatusText()
            )}
          </div>
        </div>
      </div>


      {/* Expanded Configuration Panel */}
      {isExpanded && (
        <div className="mt-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
          <div className="space-y-6">
            {/* Evaluation Result - Only show for active scenarios */}
            {evaluationResult && (evaluationResult.status === 'BULLISH' || evaluationResult.status === 'BEARISH' || evaluationResult.status === 'ACTIVE') && (
              <div className={`p-3 border rounded-lg ${
                evaluationResult.message ? 
                  'bg-red-900/20 border-red-600/50' : 
                  'bg-blue-900/20 border-blue-600/50'
              }`}>
                <h4 className={`text-md font-semibold mb-2 ${
                  evaluationResult.message ? 'text-red-300' : 'text-blue-300'
                }`}>
                  Real-Time Status
                </h4>
                <div className="text-sm text-blue-200">
                  <div>Status: {evaluationResult.status}</div>
                  <div>Confidence: {evaluationResult.confidence?.toFixed(2) || 'N/A'}</div>
                  <div>Probability: {evaluationResult.probability?.toFixed(2) || 'N/A'}</div>
                  {evaluationResult.risk && (
                    <div>Risk Level: {evaluationResult.risk.level}</div>
                  )}
                  {evaluationResult.message && (
                    <div className="mt-2 p-2 bg-red-800/30 border border-red-600/50 rounded text-red-200 text-xs">
                      ⚠️ {evaluationResult.message}
                    </div>
                  )}
                  {evaluationResult.filters && (
                    <div className="mt-2">
                      <div className="text-xs text-blue-300 mb-1">Condition Results:</div>
                      {Object.entries(evaluationResult.filters).map(([filterId, result]) => (
                        <div key={filterId} className="text-xs">
                          {filterId}: {result ? '✅' : '❌'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pre-configured Conditions Display - Only show for active scenarios */}
            {node.filters && node.filters.length > 0 && (evaluationResult?.status === 'BULLISH' || evaluationResult?.status === 'BEARISH' || evaluationResult?.status === 'ACTIVE') && (
              <div>
                <h4 className="text-md font-semibold text-white mb-3 flex items-center">
                  <Cog6ToothIcon className="w-5 h-5 mr-2" />
                  Trading Conditions
                </h4>
                <ConditionBuilder
                  conditions={node.filters}
                  showEvaluation={true}
                />
              </div>
            )}

            {/* Pre-configured Trade Zones Display */}
            {node.tradeZones && node.tradeZones.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-white mb-3 flex items-center">
                  <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                  Trade Zones
                </h4>
                <TradeZones
                  zones={node.tradeZones}
                  onZonesChange={() => {}} // Read-only, no changes allowed
                  readOnly={true}
                />
              </div>
            )}

            {(!node.filters || node.filters.length === 0) && 
             (!node.tradeZones || node.tradeZones.length === 0) && (
              <div className="text-center py-6 text-gray-400">
                <Cog6ToothIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No configuration available for this scenario.</p>
                <p className="text-sm">Configuration is defined in the scenario JSON files.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparison Popup */}
      <ComparisonPopup
        isOpen={showComparisonPopup}
        onClose={() => setShowComparisonPopup(false)}
        scenarioName={node.name}
        comparisonData={comparisonValues || []}
        evaluationResult={evaluationResult}
      />
    </div>
  )
}