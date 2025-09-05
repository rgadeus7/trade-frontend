'use client'

import { Cog6ToothIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

export interface TradingCondition {
  id: string
  field: string
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne' | 'between' | 'above' | 'below' | 'crosses_above' | 'crosses_below'
  value: number | string
  secondaryValue?: number | string
  timeframe: string
  lookback: number
  description: string
  weight: number
  isRequired: boolean
  isActive: boolean
  currentValue?: number | string
  isMet?: boolean
  lastChecked?: Date
}

interface ConditionBuilderProps {
  conditions: TradingCondition[]
  className?: string
  showEvaluation?: boolean
}

const fieldLabels: Record<string, string> = {
  'price': 'Price',
  'open': 'Open Price',
  'high': 'High Price',
  'low': 'Low Price',
  'close': 'Close Price',
  'volume': 'Volume',
  'rsi': 'RSI',
  'sma_20': 'SMA 20',
  'sma_50': 'SMA 50',
  'ema_12': 'EMA 12',
  'ema_26': 'EMA 26',
  'bb_upper': 'Bollinger Upper',
  'bb_lower': 'Bollinger Lower',
  'bb_middle': 'Bollinger Middle',
  'atr': 'ATR',
  'vwap': 'VWAP',
  'macd': 'MACD',
  'macd_signal': 'MACD Signal',
  'stoch_k': 'Stochastic %K',
  'stoch_d': 'Stochastic %D',
  'adx': 'ADX',
  'cci': 'CCI',
  'williams_r': 'Williams %R',
  'time': 'Time',
  'session': 'Trading Session',
  'day_of_week': 'Day of Week',
  'month': 'Month',
  'correlation_spy': 'Correlation with SPY',
  'correlation_qqq': 'Correlation with QQQ',
  'correlation_vix': 'Correlation with VIX'
}

const operatorLabels: Record<string, string> = {
  'gt': 'Greater Than (>)',
  'lt': 'Less Than (<)',
  'gte': 'Greater Than or Equal (≥)',
  'lte': 'Less Than or Equal (≤)',
  'eq': 'Equal (=)',
  'ne': 'Not Equal (≠)',
  'between': 'Between',
  'above': 'Above',
  'below': 'Below',
  'crosses_above': 'Crosses Above',
  'crosses_below': 'Crosses Below'
}

const timeframeLabels: Record<string, string> = {
  '1m': '1 Minute',
  '5m': '5 Minutes',
  '15m': '15 Minutes',
  '30m': '30 Minutes',
  '1h': '1 Hour',
  '4h': '4 Hours',
  '1d': '1 Day',
  '1w': '1 Week',
  '1M': '1 Month'
}

export default function ConditionBuilder({ conditions, className = '', showEvaluation = true }: ConditionBuilderProps) {
  const getFieldLabel = (field: string) => fieldLabels[field] || field
  const getOperatorLabel = (operator: string) => operatorLabels[operator] || operator
  const getTimeframeLabel = (timeframe: string) => timeframeLabels[timeframe] || timeframe

  const getConditionStatus = (condition: TradingCondition) => {
    if (!showEvaluation || condition.isMet === undefined) {
      return 'pending'
    }
    return condition.isMet ? 'met' : 'not-met'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'met':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />
      case 'not-met':
        return <XCircleIcon className="w-5 h-5 text-red-400" />
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'met':
        return 'border-green-500/50 bg-green-900/20'
      case 'not-met':
        return 'border-red-500/50 bg-red-900/20'
      default:
        return 'border-gray-600 bg-gray-800'
    }
  }

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toFixed(2)
    }
    return String(value)
  }

  const getConditionText = (condition: TradingCondition) => {
    const field = getFieldLabel(condition.field)
    const operator = getOperatorLabel(condition.operator)
    
    if (condition.operator === 'between') {
      return `${field} between ${formatValue(condition.value)} and ${formatValue(condition.secondaryValue)}`
    }
    
    return `${field} ${operator} ${formatValue(condition.value)}`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Trading Conditions</h3>
        <div className="text-sm text-gray-400">
          {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3">
        {conditions.map((condition) => {
          const status = getConditionStatus(condition)
          
          return (
            <div
              key={condition.id}
              className={`p-4 border rounded-lg transition-all ${getStatusColor(status)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {showEvaluation && getStatusIcon(status)}
                  <div>
                    <span className="text-sm font-medium text-white">
                      {condition.description || getConditionText(condition)}
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        condition.isRequired ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {condition.isRequired ? 'Required' : 'Optional'}
                      </span>
                      <span className="text-xs text-gray-400">Weight: {condition.weight}x</span>
                    </div>
                  </div>
                </div>
                
                {showEvaluation && condition.currentValue !== undefined && (
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Current Value</div>
                    <div className="text-sm font-medium text-white">
                      {formatValue(condition.currentValue)}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Field:</span>
                  <span className="ml-2 text-white">{getFieldLabel(condition.field)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Operator:</span>
                  <span className="ml-2 text-white">{getOperatorLabel(condition.operator)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Timeframe:</span>
                  <span className="ml-2 text-white">{getTimeframeLabel(condition.timeframe)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Lookback:</span>
                  <span className="ml-2 text-white">{condition.lookback}</span>
                </div>
              </div>

              {showEvaluation && condition.lastChecked && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="text-xs text-gray-400">
                    Last checked: {condition.lastChecked.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {conditions.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Cog6ToothIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No conditions configured for this scenario.</p>
            <p className="text-sm">Conditions are defined in the scenario configuration files.</p>
          </div>
        )}
      </div>
    </div>
  )
}
