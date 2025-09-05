/**
 * Comprehensive Market Data Mapping System
 * 
 * This file provides a centralized mapping system for all market data fields
 * organized by timeframe for consistent structure and easy expansion of scenarios.
 */

export interface MarketDataField {
  label: string
  description?: string
  category: 'price' | 'indicator' | 'volume' | 'historical' | 'calculated'
  dataType: 'number' | 'string' | 'object' | 'array'
  format?: 'currency' | 'percentage' | 'number' | 'date'
  precision?: number
}

export interface TimeframeDataStructure {
  timeframe: string
  fields: {
    [fieldName: string]: MarketDataField
  }
}

export interface MarketDataMapping {
  timeframes: {
    [timeframe: string]: TimeframeDataStructure
  }
  global: {
    [fieldName: string]: MarketDataField
  }
}

/**
 * Comprehensive mapping of all market data fields organized by timeframe
 */
export const MARKET_DATA_MAPPINGS: MarketDataMapping = {
  timeframes: {
    // === 1 MINUTE TIMEFRAME ===
    '1m': {
      timeframe: '1m',
      fields: {
        'open': {
          label: 'Open',
          description: 'Opening price (1m)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'high': {
          label: 'High',
          description: 'Highest price (1m)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'low': {
          label: 'Low',
          description: 'Lowest price (1m)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'close': {
          label: 'Close',
          description: 'Closing price (1m)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'volume': {
          label: 'Volume',
          description: 'Trading volume (1m)',
          category: 'volume',
          dataType: 'number',
          format: 'number',
          precision: 0
        },
        'sma_20': {
          label: 'SMA 20',
          description: '20-Period SMA (1m)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_50': {
          label: 'SMA 50',
          description: '50-Period SMA (1m)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_89': {
          label: 'SMA 89',
          description: '89-Period SMA (1m)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_200': {
          label: 'SMA 200',
          description: '200-Period SMA (1m)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        }
      }
    },

    // === 2 HOUR TIMEFRAME ===
    '2h': {
      timeframe: '2h',
      fields: {
        'open': {
          label: 'Open',
          description: 'Opening price (2h)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'high': {
          label: 'High',
          description: 'Highest price (2h)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'low': {
          label: 'Low',
          description: 'Lowest price (2h)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'close': {
          label: 'Close',
          description: 'Closing price (2h)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'volume': {
          label: 'Volume',
          description: 'Trading volume (2h)',
          category: 'volume',
          dataType: 'number',
          format: 'number',
          precision: 0
        },
        'sma_20': {
          label: 'SMA 20',
          description: '20-Period SMA (2h)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_50': {
          label: 'SMA 50',
          description: '50-Period SMA (2h)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_89': {
          label: 'SMA 89',
          description: '89-Period SMA (2h)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_200': {
          label: 'SMA 200',
          description: '200-Period SMA (2h)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        }
      }
    },

    // === DAILY TIMEFRAME ===
    '1d': {
      timeframe: '1d',
      fields: {
        'open': {
          label: 'Open',
          description: 'Opening price (Daily)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'high': {
          label: 'High',
          description: 'Highest price (Daily)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'low': {
          label: 'Low',
          description: 'Lowest price (Daily)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'close': {
          label: 'Close',
          description: 'Closing price (Daily)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'volume': {
          label: 'Volume',
          description: 'Trading volume (Daily)',
          category: 'volume',
          dataType: 'number',
          format: 'number',
          precision: 0
        },
        'sma_20': {
          label: 'SMA 20',
          description: '20-Period SMA (Daily)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_50': {
          label: 'SMA 50',
          description: '50-Period SMA (Daily)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_89': {
          label: 'SMA 89',
          description: '89-Period SMA (Daily)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_200': {
          label: 'SMA 200',
          description: '200-Period SMA (Daily)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        }
      }
    },

    // === WEEKLY TIMEFRAME ===
    '1w': {
      timeframe: '1w',
      fields: {
        'open': {
          label: 'Open',
          description: 'Opening price (Weekly)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'high': {
          label: 'High',
          description: 'Highest price (Weekly)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'low': {
          label: 'Low',
          description: 'Lowest price (Weekly)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'close': {
          label: 'Close',
          description: 'Closing price (Weekly)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'volume': {
          label: 'Volume',
          description: 'Trading volume (Weekly)',
          category: 'volume',
          dataType: 'number',
          format: 'number',
          precision: 0
        },
        'sma_20': {
          label: 'SMA 20',
          description: '20-Period SMA (Weekly)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_50': {
          label: 'SMA 50',
          description: '50-Period SMA (Weekly)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_89': {
          label: 'SMA 89',
          description: '89-Period SMA (Weekly)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_200': {
          label: 'SMA 200',
          description: '200-Period SMA (Weekly)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        }
      }
    },

    // === MONTHLY TIMEFRAME ===
    '1M': {
      timeframe: '1M',
      fields: {
        'open': {
          label: 'Open',
          description: 'Opening price (Monthly)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'high': {
          label: 'High',
          description: 'Highest price (Monthly)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'low': {
          label: 'Low',
          description: 'Lowest price (Monthly)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'close': {
          label: 'Close',
          description: 'Closing price (Monthly)',
          category: 'price',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'volume': {
          label: 'Volume',
          description: 'Trading volume (Monthly)',
          category: 'volume',
          dataType: 'number',
          format: 'number',
          precision: 0
        },
        'sma_20': {
          label: 'SMA 20',
          description: '20-Period SMA (Monthly)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_50': {
          label: 'SMA 50',
          description: '50-Period SMA (Monthly)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_89': {
          label: 'SMA 89',
          description: '89-Period SMA (Monthly)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        },
        'sma_200': {
          label: 'SMA 200',
          description: '200-Period SMA (Monthly)',
          category: 'indicator',
          dataType: 'number',
          format: 'currency',
          precision: 2
        }
      }
    }
  },

  // === GLOBAL FIELDS (not timeframe-specific) ===
  global: {
    // === YESTERDAY DATA ===
    'yesterday_close': {
      label: 'PDC',
      description: 'Previous Day Close',
      category: 'price',
      dataType: 'number',
      format: 'currency',
      precision: 2
    },
    'yesterday_high': {
      label: 'PDH',
      description: 'Previous Day High',
      category: 'price',
      dataType: 'number',
      format: 'currency',
      precision: 2
    },
    'yesterday_low': {
      label: 'PDL',
      description: 'Previous Day Low',
      category: 'price',
      dataType: 'number',
      format: 'currency',
      precision: 2
    },
    'yesterday_volume': {
      label: 'PDV',
      description: 'Previous Day Volume',
      category: 'volume',
      dataType: 'number',
      format: 'number',
      precision: 0
    },

    // === DYNAMIC SMA OBJECTS ===
    'sma': {
      label: 'SMA',
      description: 'Dynamic SMA values by period',
      category: 'indicator',
      dataType: 'object',
      format: 'currency',
      precision: 2
    },
    'smaLow': {
      label: 'SMA Low',
      description: 'Dynamic SMA of Low values by period',
      category: 'indicator',
      dataType: 'object',
      format: 'currency',
      precision: 2
    },

    // === HISTORICAL DATA ===
    'dailyHistoricalPrices': {
      label: 'Daily Historical Prices',
      description: 'Array of daily historical prices',
      category: 'historical',
      dataType: 'array',
      format: 'currency',
      precision: 2
    },
    'hourlyHistoricalPrices': {
      label: 'Hourly Historical Prices',
      description: 'Array of hourly historical prices',
      category: 'historical',
      dataType: 'array',
      format: 'currency',
      precision: 2
    },
    'weeklyHistoricalPrices': {
      label: 'Weekly Historical Prices',
      description: 'Array of weekly historical prices',
      category: 'historical',
      dataType: 'array',
      format: 'currency',
      precision: 2
    },
    'monthlyHistoricalPrices': {
      label: 'Monthly Historical Prices',
      description: 'Array of monthly historical prices',
      category: 'historical',
      dataType: 'array',
      format: 'currency',
      precision: 2
    },

    // === HISTORICAL OHLC DATA ===
    'dailyHistoricalOHLC': {
      label: 'Daily Historical OHLC',
      description: 'Daily historical Open, High, Low, Close data',
      category: 'historical',
      dataType: 'object',
      format: 'currency',
      precision: 2
    },
    'hourlyHistoricalOHLC': {
      label: 'Hourly Historical OHLC',
      description: 'Hourly historical Open, High, Low, Close data',
      category: 'historical',
      dataType: 'object',
      format: 'currency',
      precision: 2
    },
    'weeklyHistoricalOHLC': {
      label: 'Weekly Historical OHLC',
      description: 'Weekly historical Open, High, Low, Close data',
      category: 'historical',
      dataType: 'object',
      format: 'currency',
      precision: 2
    },
    'monthlyHistoricalOHLC': {
      label: 'Monthly Historical OHLC',
      description: 'Monthly historical Open, High, Low, Close data',
      category: 'historical',
      dataType: 'object',
      format: 'currency',
      precision: 2
    },

    // === CALCULATED FIELDS ===
    'change': {
      label: 'Change',
      description: 'Price change from previous period',
      category: 'calculated',
      dataType: 'number',
      format: 'currency',
      precision: 2
    },
    'changePercent': {
      label: 'Change %',
      description: 'Percentage change from previous period',
      category: 'calculated',
      dataType: 'number',
      format: 'percentage',
      precision: 2
    },
    'timestamp': {
      label: 'Timestamp',
      description: 'Data timestamp',
      category: 'calculated',
      dataType: 'string',
      format: 'date'
    }
  }
}

/**
 * Get a formatted label for any market data field
 */
export function getMarketDataLabel(fieldName: string, timeframe?: string, period?: number): string {
  // Handle expressions like "sma_89 * 0.99" or "sma_89 * 1.01"
  if (fieldName && fieldName.includes('*')) {
    const parts = fieldName.split('*').map(p => p.trim())
    if (parts.length === 2) {
      const baseField = parts[0]
      const multiplier = parseFloat(parts[1])
      
      if (!isNaN(multiplier)) {
        const baseLabel = getMarketDataLabel(baseField, timeframe, period)
        const percentage = Math.round((multiplier - 1) * 100)
        return `${baseLabel} ${percentage > 0 ? '+' : ''}${percentage}%`
      }
    }
  }

  // First check if it's a timeframe-specific field
  if (timeframe && MARKET_DATA_MAPPINGS.timeframes[timeframe]) {
    const timeframeData = MARKET_DATA_MAPPINGS.timeframes[timeframe]
    const fieldMapping = timeframeData.fields[fieldName]
    if (fieldMapping) {
      return fieldMapping.label
    }
  }

  // Check global fields
  const globalMapping = MARKET_DATA_MAPPINGS.global[fieldName]
  if (globalMapping) {
    let label = globalMapping.label

    // Handle dynamic SMA periods
    if (fieldName === 'sma' && period) {
      label = `SMA ${period}`
      if (timeframe) {
        label = `${label} (${timeframe})`
      }
    }

    if (fieldName === 'smaLow' && period) {
      label = `SMA ${period} Low`
      if (timeframe) {
        label = `${label} (${timeframe})`
      }
    }

    return label
  }

  // Fallback: convert field name to readable format
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

/**
 * Get the value of a market data field with proper formatting
 */
export function getMarketDataValue(marketData: any, fieldName: string, timeframe?: string, period?: number): string | number | null {
  if (!marketData) return null

  let value: any = null
  let mapping: MarketDataField | null = null

  // Handle nested field access (e.g., yesterday.close)
  if (fieldName.includes('.')) {
    const parts = fieldName.split('.')
    value = parts.reduce((obj, part) => obj?.[part], marketData)
    // Get mapping for the base field name
    mapping = MARKET_DATA_MAPPINGS.global[parts[0]]
  } else {
    // First try timeframe-specific data
    if (timeframe && MARKET_DATA_MAPPINGS.timeframes[timeframe]) {
      const timeframeData = MARKET_DATA_MAPPINGS.timeframes[timeframe]
      mapping = timeframeData.fields[fieldName]
      
      // Try to get value from timeframe-specific data structure
      if (marketData[timeframe]) {
        const timeframeMarketData = marketData[timeframe]
        value = timeframeMarketData[fieldName]
      }
    }

    // If not found in timeframe-specific, try global fields
    if (value === null || value === undefined) {
      mapping = MARKET_DATA_MAPPINGS.global[fieldName]
      value = marketData[fieldName]
    }

    // Handle dynamic SMA access
    if (fieldName === 'sma' && period && marketData.sma) {
      value = marketData.sma[period]
      mapping = MARKET_DATA_MAPPINGS.global['sma']
    }

    if (fieldName === 'smaLow' && period && marketData.smaLow) {
      value = marketData.smaLow[period]
      mapping = MARKET_DATA_MAPPINGS.global['smaLow']
    }

    // Handle SMA field mapping (sma_89 -> actual data structure)
    if (fieldName === 'sma_89') {
      if (timeframe === '2h' || timeframe === '2hour') {
        // For 2H timeframe, use sma2h field
        value = marketData.sma2h
      } else if (timeframe === '1w' || timeframe === 'weekly') {
        // For weekly timeframe, use weeklySMA field
        value = marketData.weeklySMA
      } else if (timeframe === '1M' || timeframe === 'monthly') {
        // For monthly timeframe, use monthlySMA field
        value = marketData.monthlySMA
      } else {
        // For daily timeframe, use sma89 field
        value = marketData.sma89
      }
      
      // Also try dynamic SMA access as fallback
      if ((value === null || value === undefined || value === 0) && marketData.sma && marketData.sma[89]) {
        value = marketData.sma[89]
      }
    }

    if (fieldName === 'sma_200') {
      if (timeframe === '2h' || timeframe === '2hour') {
        // For 2H timeframe, try dynamic SMA
        value = marketData.sma && marketData.sma[200] ? marketData.sma[200] : 0
      } else {
        // For other timeframes, use sma200 field
        value = marketData.sma200
      }
    }

    // Handle expressions like "sma_89 * 0.99" or "sma_89 * 1.01"
    if (fieldName && fieldName.includes('*')) {
      const parts = fieldName.split('*').map(p => p.trim())
      if (parts.length === 2) {
        const baseField = parts[0]
        const multiplier = parseFloat(parts[1])
        
        if (!isNaN(multiplier)) {
          // Get the base field value
          let baseValue = null
          if (baseField === 'sma_89') {
            if (timeframe === '2h' || timeframe === '2hour') {
              baseValue = marketData.sma2h
            } else if (timeframe === '1w' || timeframe === 'weekly') {
              baseValue = marketData.weeklySMA
            } else if (timeframe === '1M' || timeframe === 'monthly') {
              baseValue = marketData.monthlySMA
            } else {
              baseValue = marketData.sma89
            }
            
            // Fallback to dynamic SMA
            if ((baseValue === null || baseValue === undefined || baseValue === 0) && marketData.sma && marketData.sma[89]) {
              baseValue = marketData.sma[89]
            }
          }
          
          if (baseValue !== null && baseValue !== undefined) {
            value = baseValue * multiplier
          }
        }
      }
    }
  }

  if (value === null || value === undefined) {
    return null
  }

  // Format the value based on the mapping
  if (mapping && mapping.format) {
    return formatMarketDataValue(value, mapping.format, mapping.precision)
  }

  return value
}

/**
 * Format a market data value based on its type
 */
function formatMarketDataValue(value: any, format: string, precision?: number): string | number {
  if (value === null || value === undefined) return 'N/A'

  switch (format) {
    case 'currency':
      return typeof value === 'number' ? value.toFixed(precision || 2) : value
    case 'percentage':
      return typeof value === 'number' ? `${value.toFixed(precision || 2)}%` : value
    case 'number':
      return typeof value === 'number' ? value.toFixed(precision || 0) : value
    case 'date':
      return new Date(value).toLocaleDateString()
    default:
      return value
  }
}

/**
 * Get all available market data fields for a given category
 */
export function getMarketDataFieldsByCategory(category: string): string[] {
  const fields: string[] = []
  
  // Check timeframe-specific fields
  Object.values(MARKET_DATA_MAPPINGS.timeframes).forEach(timeframeData => {
    Object.keys(timeframeData.fields).forEach(fieldName => {
      if (timeframeData.fields[fieldName].category === category) {
        fields.push(fieldName)
      }
    })
  })
  
  // Check global fields
  Object.keys(MARKET_DATA_MAPPINGS.global).forEach(fieldName => {
    if (MARKET_DATA_MAPPINGS.global[fieldName].category === category) {
      fields.push(fieldName)
    }
  })
  
  return Array.from(new Set(fields)) // Remove duplicates
}

/**
 * Get all available market data fields for a given timeframe
 */
export function getMarketDataFieldsByTimeframe(timeframe: string): string[] {
  if (MARKET_DATA_MAPPINGS.timeframes[timeframe]) {
    return Object.keys(MARKET_DATA_MAPPINGS.timeframes[timeframe].fields)
  }
  return []
}

/**
 * Check if a market data field exists
 */
export function hasMarketDataField(fieldName: string, timeframe?: string): boolean {
  // Check timeframe-specific fields first
  if (timeframe && MARKET_DATA_MAPPINGS.timeframes[timeframe]) {
    if (MARKET_DATA_MAPPINGS.timeframes[timeframe].fields[fieldName]) {
      return true
    }
  }
  
  // Check global fields
  return fieldName in MARKET_DATA_MAPPINGS.global
}

/**
 * Get market data field metadata
 */
export function getMarketDataFieldInfo(fieldName: string, timeframe?: string): MarketDataField | null {
  // Check timeframe-specific fields first
  if (timeframe && MARKET_DATA_MAPPINGS.timeframes[timeframe]) {
    const timeframeData = MARKET_DATA_MAPPINGS.timeframes[timeframe]
    if (timeframeData.fields[fieldName]) {
      return timeframeData.fields[fieldName]
    }
  }
  
  // Check global fields
  return MARKET_DATA_MAPPINGS.global[fieldName] || null
}

/**
 * Get all available timeframes
 */
export function getAvailableTimeframes(): string[] {
  return Object.keys(MARKET_DATA_MAPPINGS.timeframes)
}

/**
 * Get all fields for a specific timeframe
 */
export function getTimeframeFields(timeframe: string): { [fieldName: string]: MarketDataField } | null {
  if (MARKET_DATA_MAPPINGS.timeframes[timeframe]) {
    return MARKET_DATA_MAPPINGS.timeframes[timeframe].fields
  }
  return null
}
