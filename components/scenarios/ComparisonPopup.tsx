'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'

/**
 * Format market data values to 2 decimal places
 */
function formatMarketDataValue(value: string): string {
  if (!value || value === 'Loading...') {
    return value
  }
  
  // Extract the numeric part from strings like "$6137.47224719101"
  const match = value.match(/\$?([\d,]+\.?\d*)/)
  if (match) {
    const numericValue = parseFloat(match[1])
    if (!isNaN(numericValue)) {
      return `$${numericValue.toFixed(2)}`
    }
  }
  return value
}

/**
 * Render condition analysis with pass/fail logic
 */
function renderConditionAnalysis(comparisonData: ComparisonData[], scenarioName: string) {
  // Group data by condition (current vs comparison values)
  const currentValues = comparisonData.filter(item => item.type === 'current')
  const comparisonValues = comparisonData.filter(item => item.type === 'comparison')
  const calculatedValues = comparisonData.filter(item => item.type === 'calculated')
  
  const conditions = []
  
  // Analyze each condition based on scenario type
  if (scenarioName.includes('Open Above Yesterday High')) {
    // For "Open Above Yesterday High" scenario
    const openValue = currentValues.find(v => v.label.includes('Open'))
    const highValue = comparisonValues.find(v => v.label.includes('High'))
    
    if (openValue && highValue) {
      const openNum = parseFloat(openValue.value.replace('$', ''))
      const highNum = parseFloat(highValue.value.replace('$', ''))
      const passed = openNum > highNum
      
      conditions.push({
        title: 'Open Above Previous Day High',
        description: 'Market opens above yesterday\'s high, indicating potential breakout',
        current: openValue,
        threshold: highValue,
        operator: '>',
        passed,
        result: passed ? '✅ PASS' : '❌ FAIL'
      })
    }
  } else if (scenarioName.includes('Daily & 2H SMA Alignment')) {
    // For SMA alignment scenario
    const closeValue = currentValues.find(v => v.label.includes('Close'))
    const dailySMA = comparisonValues.find(v => v.label.includes('SMA 89 (1D)'))
    const minSMA = calculatedValues.find(v => v.label.includes('* 0.99'))
    const maxSMA = calculatedValues.find(v => v.label.includes('* 1.01'))
    
    if (closeValue && dailySMA) {
      const closeNum = parseFloat(closeValue.value.replace('$', ''))
      const smaNum = parseFloat(dailySMA.value.replace('$', ''))
      const passed = closeNum > smaNum
      
      conditions.push({
        title: 'Price Above Daily SMA',
        description: 'Price must be above Daily 89 SMA',
        current: closeValue,
        threshold: dailySMA,
        operator: '>',
        passed,
        result: passed ? '✅ PASS' : '❌ FAIL'
      })
    }
    
    if (closeValue && minSMA && maxSMA) {
      const closeNum = parseFloat(closeValue.value.replace('$', ''))
      const minNum = parseFloat(minSMA.value.replace('$', ''))
      const maxNum = parseFloat(maxSMA.value.replace('$', ''))
      const passed = closeNum >= minNum && closeNum <= maxNum
      
      conditions.push({
        title: 'Price Within 2H SMA Range',
        description: 'Price must be within 1% of 2H 89 SMA',
        current: closeValue,
        threshold: { label: `${minSMA.label} - ${maxSMA.label}`, value: `${minSMA.value} - ${maxSMA.value}` },
        operator: 'between',
        passed,
        result: passed ? '✅ PASS' : '❌ FAIL'
      })
    }
  }
  
  // If no specific conditions found, show generic analysis
  if (conditions.length === 0) {
    return (
      <div className="space-y-3">
        {comparisonData.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                item.type === 'current' ? 'bg-green-400' :
                item.type === 'comparison' ? 'bg-yellow-400' :
                'bg-blue-400'
              }`}></div>
              <span className={`font-medium ${
                item.type === 'current' ? 'text-green-300' :
                item.type === 'comparison' ? 'text-yellow-300' :
                'text-blue-300'
              }`}>
                {item.label}
              </span>
            </div>
            <span className="text-white font-mono font-bold text-lg">
              {formatMarketDataValue(item.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {conditions.map((condition, index) => (
        <div key={index} className="p-4 bg-gray-800/30 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-lg font-semibold text-white">{condition.title}</h5>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              condition.passed ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
            }`}>
              {condition.result}
            </span>
          </div>
          
          <p className="text-gray-300 text-sm mb-3">{condition.description}</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-green-300 font-medium">Current: {condition.current.label}</span>
              <span className="text-white font-mono font-bold">{condition.current.value}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-yellow-300 font-medium">Threshold: {condition.threshold.label}</span>
              <span className="text-white font-mono font-bold">{condition.threshold.value}</span>
            </div>
            
            <div className="text-center text-gray-400 text-sm">
              {condition.current.value} {condition.operator} {condition.threshold.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface ComparisonData {
  label: string
  value: string
  type: 'current' | 'comparison' | 'calculated'
}

interface ComparisonPopupProps {
  isOpen: boolean
  onClose: () => void
  scenarioName: string
  comparisonData: ComparisonData[]
  evaluationResult?: any
}

export default function ComparisonPopup({ 
  isOpen, 
  onClose, 
  scenarioName, 
  comparisonData, 
  evaluationResult 
}: ComparisonPopupProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">
            📊 {scenarioName} - Market Data Analysis
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Evaluation Status */}
          {evaluationResult && (
            <div className={`mb-6 p-4 rounded-lg border ${
              evaluationResult.status === 'BULLISH' ? 'bg-green-900/20 border-green-600/50' :
              evaluationResult.status === 'BEARISH' ? 'bg-red-900/20 border-red-600/50' :
              'bg-gray-800/20 border-gray-600/50'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  evaluationResult.status === 'BULLISH' ? 'bg-green-500' :
                  evaluationResult.status === 'BEARISH' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}></div>
                <span className="text-white font-semibold">
                  Status: {evaluationResult.status || 'No Bias'}
                </span>
                {evaluationResult.confidence && (
                  <span className="text-gray-300 text-sm">
                    (Confidence: {evaluationResult.confidence.toFixed(1)}%)
                  </span>
                )}
              </div>
              {evaluationResult.message && (
                <p className="text-gray-300 text-sm mt-2">{evaluationResult.message}</p>
              )}
            </div>
          )}

          {/* Condition Analysis */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">Scenario Condition Analysis</h4>
            
            {comparisonData && comparisonData.length > 0 ? (
              <div className="space-y-4">
                {renderConditionAnalysis(comparisonData, scenarioName)}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg">No comparison data available</div>
                <div className="text-gray-500 text-sm mt-2">Market data is still loading...</div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <h5 className="text-sm font-semibold text-gray-300 mb-3">Legend:</h5>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-gray-300">Current Values</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="text-gray-300">Comparison Values</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-gray-300">Calculated Values</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
