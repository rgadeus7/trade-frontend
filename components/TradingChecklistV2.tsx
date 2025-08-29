'use client'

import React, { useState } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { TechnicalAnalysis } from '../lib/technicalAnalysis'
import { 
  getSMAStrengthThreshold, 
  getBollingerBandsStrengthThreshold, 
  getPriceActionStrengthThreshold, 
  getGapAnalysisStrengthThreshold,
  getIndicatorCategorization,
  getSubcategoriesByCategory,
  getVWAPLookbackPeriod,
  getVolumeProfileLookbackPeriod
} from '../config/trading-config'
import { MarketData } from '../types/market'
import { timeframeDataService, type TimeframeData as ServiceTimeframeData } from '../lib/timeframeDataService'

interface TradingChecklistProps {
  marketData: MarketData[]
}

interface ChecklistItem {
  id: string
  label: string
  status: 'BULLISH' | 'BEARISH' | 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS'
  strength?: 'STRONG' | 'MODERATE' | 'WEAK'
  description: string
  category: string
  subcategory: string
}

interface TimeframeData {
  name: string
  price: number
  sma: number
  smaLow: number
  historicalPrices?: number[]
  historicalOHLC?: { high: number[], low: number[], close: number[], open: number[] }
  historicalVolume?: number[]
  previousClose?: number
  previousHigh?: number
}

// ===== INDICATOR DEFINITIONS =====
// Each indicator is defined once with its logic and parameters

const INDICATORS = {
  // SMA-based indicators
  sma: {
    id: 'sma',
    label: 'Close > 89 SMA',
    getCategory: () => getIndicatorCategorization('sma') || { category: 'technical', subcategory: 'directional' },
    calculate: (timeframe: TimeframeData): ChecklistItem | null => {
      if (!timeframe.sma) return null
      
      const status = timeframe.price > timeframe.sma ? 'BULLISH' : 'BEARISH'
      const strength = Math.abs(timeframe.price - timeframe.sma) / timeframe.sma > getSMAStrengthThreshold() ? 'STRONG' : 'MODERATE'
      
      return {
        id: `${timeframe.name}-sma`,
        label: `${timeframe.name} Close > ${timeframe.name} 89 SMA`,
        status,
        strength,
        description: `SPX: $${timeframe.price.toFixed(2)} | 89 SMA: $${timeframe.sma.toFixed(2)}`,
        category: INDICATORS.sma.getCategory().category,
        subcategory: INDICATORS.sma.getCategory().subcategory
      }
    }
  },

  smaLow: {
    id: 'sma-low',
    label: 'Close > 89 SMA Low',
    getCategory: () => getIndicatorCategorization('sma-low') || { category: 'technical', subcategory: 'directional' },
    calculate: (timeframe: TimeframeData): ChecklistItem | null => {
      if (!timeframe.smaLow) return null
      
      const status = timeframe.price > timeframe.smaLow ? 'BULLISH' : 'BEARISH'
      const strength = Math.abs(timeframe.price - timeframe.smaLow) / timeframe.smaLow > getSMAStrengthThreshold() ? 'STRONG' : 'MODERATE'
      
      return {
        id: `${timeframe.name}-sma-low`,
        label: `${timeframe.name} Close > ${timeframe.name} 89 SMA Low`,
        status,
        strength,
        description: `SPX: $${timeframe.price.toFixed(2)} | 89 SMA Low: $${timeframe.smaLow.toFixed(2)}`,
        category: INDICATORS.smaLow.getCategory().category,
        subcategory: INDICATORS.smaLow.getCategory().subcategory
      }
    }
  },

  // RSI indicator
  rsi: {
    id: 'rsi',
    label: 'RSI Signal',
    getCategory: () => getIndicatorCategorization('rsi') || { category: 'technical', subcategory: 'momentum' },
    calculate: (timeframe: TimeframeData): ChecklistItem | null => {
      if (!timeframe.historicalPrices || timeframe.historicalPrices.length < 15) return null
      
      const rsi = TechnicalAnalysis.calculateRSI(timeframe.historicalPrices, 14)
      let status: 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS'
      let strength: 'STRONG' | 'MODERATE' | 'WEAK'
      
      // 2-level RSI logic
      if (rsi > 75) {
        status = 'OVERBOUGHT'
        strength = 'STRONG'
      } else if (rsi > 65) {
        status = 'OVERBOUGHT'
        strength = 'MODERATE'
      } else if (rsi < 25) {
        status = 'OVERSOLD'
        strength = 'STRONG'
      } else if (rsi < 40) {
        status = 'OVERSOLD'
        strength = 'MODERATE'
      } else {
        status = 'NO_BIAS'
        strength = 'WEAK'
      }
      
      return {
        id: `${timeframe.name}-rsi`,
        label: `${timeframe.name} RSI Signal`,
        status,
        strength,
        description: `SPX: RSI ${rsi.toFixed(1)} | ${status === 'OVERBOUGHT' ? 'Sell Signal' : status === 'OVERSOLD' ? 'Buy Signal' : 'No Bias'}`,
        category: INDICATORS.rsi.getCategory().category,
        subcategory: INDICATORS.rsi.getCategory().subcategory
      }
    }
  },

  // Bollinger Bands indicators
  bollingerBands: {
    id: 'bb',
    label: 'Bollinger Bands Position',
    getCategory: () => getIndicatorCategorization('bollingerBands') || { category: 'technical', subcategory: 'volatility' },
    calculate: (timeframe: TimeframeData, period: number = 20): ChecklistItem | null => {
      if (!timeframe.historicalPrices || timeframe.historicalPrices.length < period) return null
      
      const bb = TechnicalAnalysis.calculateBollingerBands(timeframe.historicalPrices, period)
      const position = timeframe.price > bb.upper ? 'Above Upper Band' :
                      timeframe.price < bb.lower ? 'Below Lower Band' : 'Between Bands'
      
             let status: 'BULLISH' | 'BEARISH' | 'NO_BIAS' | 'OVERBOUGHT' | 'OVERSOLD'
       let strength: 'STRONG' | 'MODERATE' | 'WEAK'
       
       if (timeframe.price > bb.upper) {
         status = 'OVERBOUGHT'
         strength = (timeframe.price - bb.upper) / bb.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
       } else if (timeframe.price < bb.lower) {
         status = 'OVERSOLD'
         strength = (bb.lower - timeframe.price) / bb.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
       } else {
         status = 'NO_BIAS'
         strength = 'WEAK'
       }
      
      return {
        id: `${timeframe.name}-bb-${period}`,
        label: `${timeframe.name} BB ${period}-Position`,
        status,
        strength,
        description: `SPX: $${timeframe.price.toFixed(2)} | ${position} | Upper: $${bb.upper.toFixed(2)} | Middle: $${bb.middle.toFixed(2)} | Lower: $${bb.lower.toFixed(2)}`,
        category: INDICATORS.bollingerBands.getCategory().category,
        subcategory: INDICATORS.bollingerBands.getCategory().subcategory
      }
    }
  },

  // ATR indicator
  atr: {
    id: 'atr',
    label: 'ATR Volatility',
    getCategory: () => getIndicatorCategorization('atr') || { category: 'technical', subcategory: 'volatility' },
    calculate: (timeframe: TimeframeData): ChecklistItem | null => {
      if (!timeframe.historicalOHLC || timeframe.historicalOHLC.close.length < 15) return null
      
      const { high, low, close } = timeframe.historicalOHLC
      const atr14 = TechnicalAnalysis.calculateATR(high, low, close, 14)
      const atr20 = TechnicalAnalysis.calculateATR(high, low, close, 20)
      
      const atrConditions = TechnicalAnalysis.checkATRConditions(atr14, atr20)
      
             let status: 'BULLISH' | 'BEARISH' | 'NO_BIAS' | 'OVERBOUGHT' | 'OVERSOLD'
       let strength: 'STRONG' | 'MODERATE' | 'WEAK'
       
       if (atrConditions.isHighVolatility) {
         status = 'OVERBOUGHT'
         strength = 'STRONG'
       } else if (atrConditions.isLowVolatility) {
         status = 'OVERSOLD'
         strength = 'MODERATE'
       } else {
         status = 'NO_BIAS'
         strength = 'WEAK'
       }
      
      return {
        id: `${timeframe.name}-atr`,
        label: `${timeframe.name} ATR 14-Volatility`,
        status,
        strength,
        description: `SPX: ATR ${atr14.toFixed(2)} | 20-period Avg: ${atr20.toFixed(2)} | ${atrConditions.isHighVolatility ? 'High Volatility' : atrConditions.isLowVolatility ? 'Low Volatility' : 'Normal Volatility'}`,
        category: INDICATORS.atr.getCategory().category,
        subcategory: INDICATORS.atr.getCategory().subcategory
      }
    }
  },

  // PSAR indicator
  psar: {
    id: 'psar',
    label: 'PSAR Trend',
    getCategory: () => getIndicatorCategorization('psar') || { category: 'technical', subcategory: 'directional' },
    calculate: (timeframe: TimeframeData): ChecklistItem | null => {
      if (!timeframe.historicalOHLC || timeframe.historicalOHLC.close.length < 10) return null
      
      const { high, low } = timeframe.historicalOHLC
      const psar = TechnicalAnalysis.calculatePSAR(high, low)
      const psarConditions = TechnicalAnalysis.checkPSARConditions(timeframe.price, psar)
      
      const status = psarConditions.isBullish ? 'BULLISH' : 'BEARISH'
      const strength = Math.abs(timeframe.price - psar) / psar > 0.02 ? 'STRONG' : 'MODERATE'
      
      return {
        id: `${timeframe.name}-psar`,
        label: `${timeframe.name} PSAR Trend`,
        status,
        strength,
        description: `SPX: $${timeframe.price.toFixed(2)} | PSAR: $${psar.toFixed(2)} | ${psarConditions.isBullish ? 'Above PSAR (Bullish)' : 'Below PSAR (Bearish)'}`,
        category: INDICATORS.psar.getCategory().category,
        subcategory: INDICATORS.psar.getCategory().subcategory
      }
    }
  },

  // VWAP indicator
  vwap: {
    id: 'vwap',
    label: 'VWAP Analysis',
    getCategory: () => getIndicatorCategorization('vwap') || { category: 'technical', subcategory: 'volume' },
         calculate: (timeframe: TimeframeData): ChecklistItem | null => {
       const lookbackPeriod = getVWAPLookbackPeriod()
       if (!timeframe.historicalOHLC || timeframe.historicalOHLC.close.length < lookbackPeriod) return null
       if (!timeframe.historicalVolume || timeframe.historicalVolume.length < lookbackPeriod) return null
       
       const { high, low, close } = timeframe.historicalOHLC
       const volume = timeframe.historicalVolume
       
       // Use only the last N periods for VWAP calculation
       const recentHigh = high.slice(-lookbackPeriod)
       const recentLow = low.slice(-lookbackPeriod)
       const recentClose = close.slice(-lookbackPeriod)
       const recentVolume = volume.slice(-lookbackPeriod)
      
      const vwap = TechnicalAnalysis.calculateVWAP(recentHigh, recentLow, recentClose, recentVolume)
      
      if (vwap === 0) return null
      
      let status: 'BULLISH' | 'BEARISH' | 'NO_BIAS'
      let strength: 'STRONG' | 'MODERATE' | 'WEAK'
      
      const priceDistance = Math.abs(timeframe.price - vwap) / vwap
      
      if (timeframe.price > vwap) {
        status = 'BULLISH'
        strength = priceDistance > 0.01 ? 'STRONG' : 'MODERATE'
      } else if (timeframe.price < vwap) {
        status = 'BEARISH'
        strength = priceDistance > 0.01 ? 'STRONG' : 'MODERATE'
      } else {
        status = 'NO_BIAS'
        strength = 'WEAK'
      }
      
      return {
        id: `${timeframe.name}-vwap`,
        label: `${timeframe.name} VWAP Analysis`,
        status,
        strength,
        description: `SPX: $${timeframe.price.toFixed(2)} | VWAP: $${vwap.toFixed(2)} | ${status === 'BULLISH' ? 'Above VWAP' : status === 'BEARISH' ? 'Below VWAP' : 'At VWAP'}`,
        category: INDICATORS.vwap.getCategory().category,
        subcategory: INDICATORS.vwap.getCategory().subcategory
      }
    }
  },

  // Volume Profile indicator
  volumeProfile: {
    id: 'volume-profile',
    label: 'Volume Profile',
    getCategory: () => getIndicatorCategorization('volumeProfile') || { category: 'technical', subcategory: 'volume' },
         calculate: (timeframe: TimeframeData): ChecklistItem | null => {
       const lookbackPeriod = getVolumeProfileLookbackPeriod()
       if (!timeframe.historicalOHLC || timeframe.historicalOHLC.close.length < lookbackPeriod) return null
       if (!timeframe.historicalVolume || timeframe.historicalVolume.length < lookbackPeriod) return null
       
       const { high, low, close } = timeframe.historicalOHLC
       const volume = timeframe.historicalVolume
       
       // Use only the last N periods for Volume Profile calculation
       const recentHigh = high.slice(-lookbackPeriod)
       const recentLow = low.slice(-lookbackPeriod)
       const recentClose = close.slice(-lookbackPeriod)
       const recentVolume = volume.slice(-lookbackPeriod)
      
      const volumeProfile = TechnicalAnalysis.calculateVolumeProfile(recentHigh, recentLow, recentClose, recentVolume)
      
      if (volumeProfile.poc === 0) return null
      
      let status: 'BULLISH' | 'BEARISH' | 'NO_BIAS'
      let strength: 'STRONG' | 'MODERATE' | 'WEAK'
      
      const priceDistance = Math.abs(timeframe.price - volumeProfile.poc) / volumeProfile.poc
      const inValueArea = timeframe.price >= volumeProfile.valueArea.lower && timeframe.price <= volumeProfile.valueArea.upper
      
      if (timeframe.price > volumeProfile.poc) {
        status = 'BULLISH'
        strength = priceDistance > 0.02 ? 'STRONG' : 'MODERATE'
      } else if (timeframe.price < volumeProfile.poc) {
        status = 'BEARISH'
        strength = priceDistance > 0.02 ? 'STRONG' : 'MODERATE'
      } else {
        status = 'NO_BIAS'
        strength = 'WEAK'
      }
      
      return {
        id: `${timeframe.name}-volume-profile`,
        label: `${timeframe.name} Volume Profile`,
        status,
        strength,
        description: `SPX: $${timeframe.price.toFixed(2)} | POC: $${volumeProfile.poc.toFixed(2)} | ${inValueArea ? 'In Value Area' : 'Outside Value Area'}`,
        category: INDICATORS.volumeProfile.getCategory().category,
        subcategory: INDICATORS.volumeProfile.getCategory().subcategory
      }
    }
  },

  // Price Action indicators
  priceAction: {
    id: 'price-action',
    label: 'Price Action',
    getCategory: () => getIndicatorCategorization('price-action') || { category: 'price-action', subcategory: 'price-action-v1' },
    calculate: (timeframe: TimeframeData): ChecklistItem[] => {
      const items: ChecklistItem[] = []
      
      if (!timeframe.previousClose) return items
      
      // Above previous close
      const aboveClose = timeframe.price > timeframe.previousClose
      items.push({
        id: `${timeframe.name}-above-close`,
        label: `${timeframe.name} Close > Previous Close`,
        status: aboveClose ? 'BULLISH' : 'BEARISH',
        strength: Math.abs(timeframe.price - timeframe.previousClose) / timeframe.previousClose > getPriceActionStrengthThreshold() ? 'STRONG' : 'MODERATE',
        description: `SPX: $${timeframe.price.toFixed(2)} | Previous: $${timeframe.previousClose.toFixed(2)}`,
        category: INDICATORS.priceAction.getCategory().category,
        subcategory: INDICATORS.priceAction.getCategory().subcategory
      })
      
      // Gap analysis
      const gapAnalysis = TechnicalAnalysis.analyzeGap(timeframe.price, timeframe.previousClose)
      items.push({
        id: `${timeframe.name}-gap`,
        label: `${timeframe.name} Gap Analysis`,
        status: gapAnalysis.isGapUp ? 'BULLISH' : 'BEARISH',
        strength: gapAnalysis.gapPercentage > getGapAnalysisStrengthThreshold() * 100 ? 'STRONG' : 'MODERATE',
        description: `SPX: ${gapAnalysis.isGapUp ? 'Gap Up' : 'No Gap'} | Size: ${gapAnalysis.gapPercentage.toFixed(2)}%`,
        category: INDICATORS.priceAction.getCategory().category,
        subcategory: INDICATORS.priceAction.getCategory().subcategory
      })
      
      return items
    }
  },

  // Open vs Previous Close indicator
  openVsPreviousClose: {
    id: 'open-vs-previous-close',
    label: 'Open vs Previous Close',
    getCategory: () => getIndicatorCategorization('openVsPreviousClose') || { category: 'price-action', subcategory: 'price-action' },
    calculate: (timeframe: TimeframeData): ChecklistItem | null => {
      if (!timeframe.historicalOHLC || timeframe.historicalOHLC.open.length < 2) return null
      
      const currentOpen = timeframe.historicalOHLC.open[timeframe.historicalOHLC.open.length - 1]
      const previousClose = timeframe.historicalOHLC.close[timeframe.historicalOHLC.close.length - 2]
      
      if (!currentOpen || !previousClose) return null
      
      const status = currentOpen > previousClose ? 'BULLISH' : 'BEARISH'
      const strength = Math.abs(currentOpen - previousClose) / previousClose > getPriceActionStrengthThreshold() ? 'STRONG' : 'MODERATE'
      
      return {
        id: `${timeframe.name}-open-vs-previous-close`,
        label: `${timeframe.name} Open vs Previous Close`,
        status,
        strength,
        description: `Open: $${currentOpen.toFixed(2)} | Previous Close: $${previousClose.toFixed(2)}`,
        category: INDICATORS.openVsPreviousClose.getCategory().category,
        subcategory: INDICATORS.openVsPreviousClose.getCategory().subcategory
      }
    }
  },

  // Close vs Previous High indicator
  closeVsPreviousHigh: {
    id: 'close-vs-previous-high',
    label: 'Close vs Previous High',
    getCategory: () => getIndicatorCategorization('closeVsPreviousHigh') || { category: 'price-action', subcategory: 'price-action' },
    calculate: (timeframe: TimeframeData): ChecklistItem | null => {
      if (!timeframe.historicalOHLC || timeframe.historicalOHLC.high.length < 2) return null
      
      const currentClose = timeframe.price
      const previousHigh = timeframe.historicalOHLC.high[timeframe.historicalOHLC.high.length - 2]
      
      if (!currentClose || !previousHigh) return null
      
      const status = currentClose > previousHigh ? 'BULLISH' : 'BEARISH'
      const strength = Math.abs(currentClose - previousHigh) / previousHigh > getPriceActionStrengthThreshold() ? 'STRONG' : 'MODERATE'
      
      return {
        id: `${timeframe.name}-close-vs-previous-high`,
        label: `${timeframe.name} Close vs Previous High`,
        status,
        strength,
        description: `Close: $${currentClose.toFixed(2)} | Previous High: $${previousHigh.toFixed(2)}`,
        category: INDICATORS.closeVsPreviousHigh.getCategory().category,
        subcategory: INDICATORS.closeVsPreviousHigh.getCategory().subcategory
      }
    }
  }
}

// ===== TIMEFRAME CONFIGURATION =====
const TIMEFRAMES = [
  {
    name: 'Daily',
    serviceTimeframe: 'daily' as const,
    getData: (serviceData: Record<string, ServiceTimeframeData | null>): TimeframeData | null => {
      const data = serviceData['daily']
      if (!data) return null
      
             return {
         name: 'Daily',
         price: data.currentPrice,
         sma: data.sma89,
         smaLow: data.sma89Low,
         historicalPrices: data.historicalPrices,
         historicalOHLC: data.historicalOHLC,
         historicalVolume: data.historicalVolume,
         previousClose: data.previousPrice,
         previousHigh: data.historicalOHLC.high[data.historicalOHLC.high.length - 2] || data.previousPrice
       }
    }
  },
  {
    name: '2-Hour',
    serviceTimeframe: '2hour' as const,
    getData: (serviceData: Record<string, ServiceTimeframeData | null>): TimeframeData | null => {
      const data = serviceData['2hour']
      if (!data) return null
      
             return {
         name: '2-Hour',
         price: data.currentPrice,
         sma: data.sma89,
         smaLow: data.sma89Low,
         historicalPrices: data.historicalPrices,
         historicalOHLC: data.historicalOHLC,
         historicalVolume: data.historicalVolume,
         previousClose: data.previousPrice,
         previousHigh: data.historicalOHLC.high[data.historicalOHLC.high.length - 2] || data.previousPrice
       }
    }
  },
  {
    name: 'Weekly',
    serviceTimeframe: 'weekly' as const,
    getData: (serviceData: Record<string, ServiceTimeframeData | null>): TimeframeData | null => {
      const data = serviceData['weekly']
      if (!data) return null
      
             return {
         name: 'Weekly',
         price: data.currentPrice,
         sma: data.sma89,
         smaLow: data.sma89Low,
         historicalPrices: data.historicalPrices,
         historicalOHLC: data.historicalOHLC,
         historicalVolume: data.historicalVolume,
         previousClose: data.previousPrice,
         previousHigh: data.historicalOHLC.high[data.historicalOHLC.high.length - 2] || data.previousPrice
       }
    }
  },
  {
    name: 'Monthly',
    serviceTimeframe: 'monthly' as const,
    getData: (serviceData: Record<string, ServiceTimeframeData | null>): TimeframeData | null => {
      const data = serviceData['monthly']
      if (!data) return null
      
             return {
         name: 'Monthly',
         price: data.currentPrice,
         sma: data.sma89,
         smaLow: data.sma89Low,
         historicalPrices: data.historicalPrices,
         historicalOHLC: data.historicalOHLC,
         historicalVolume: data.historicalVolume,
         previousClose: data.previousPrice,
         previousHigh: data.historicalOHLC.high[data.historicalOHLC.high.length - 2] || data.previousPrice
       }
    }
  }
]

// ===== MAIN COMPONENT =====
export default function TradingChecklistV2({ marketData }: TradingChecklistProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['technical', 'price-action']))
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(['BULLISH', 'BEARISH', 'NO_BIAS', 'OVERBOUGHT', 'OVERSOLD']))
  const [selectedTimeframes, setSelectedTimeframes] = useState<Set<string>>(new Set(['Daily', '2-Hour', 'Weekly', 'Monthly']))
  const [timeframeData, setTimeframeData] = useState<Record<string, ServiceTimeframeData | null> | null>(null)
  const [loading, setLoading] = useState(true)

  // Get SPX data and fetch timeframe-specific data
  const spxData = marketData.find(d => d.symbol === 'SPX')
  
  // Fetch timeframe data when component mounts or SPX data changes
  React.useEffect(() => {
    async function fetchTimeframeData() {
      if (!spxData) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log('Fetching timeframe-specific data for SPX...')
        const data = await timeframeDataService.getAllTimeframesData('SPX', 500)
        setTimeframeData(data)
        console.log('Timeframe data fetched:', Object.keys(data).filter(k => data[k as keyof typeof data]))
      } catch (error) {
        console.error('Error fetching timeframe data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTimeframeData()
  }, [spxData])

  if (!spxData) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No SPX Data</h3>
              <p className="text-gray-600">SPX data not available for analysis.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Timeframe Data</h3>
              <p className="text-gray-600">Fetching data for all timeframes...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!timeframeData) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeframe Data</h3>
              <p className="text-gray-600">Failed to fetch timeframe-specific data.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate all indicators for all timeframes
  const allConditions: ChecklistItem[] = []
  
  TIMEFRAMES.forEach(timeframeConfig => {
    const timeframeDataItem = timeframeConfig.getData(timeframeData)
    if (!timeframeDataItem) return
    
          // Apply all indicators to this timeframe
      Object.values(INDICATORS).forEach(indicator => {
        if (indicator.id === 'price-action') {
          // Price action returns multiple items
          const items = indicator.calculate(timeframeDataItem) as ChecklistItem[]
          allConditions.push(...items)
        } else if (indicator.id === 'bb') {
          // Bollinger Bands - add for different periods
          [20, 50, 89].forEach(period => {
            const bbItem = indicator.calculate(timeframeDataItem, period) as ChecklistItem | null
            if (bbItem) allConditions.push(bbItem)
          })
        } else {
          // Other indicators return single item
          const item = indicator.calculate(timeframeDataItem) as ChecklistItem | null
          if (item) allConditions.push(item)
        }
      })
  })

  // Filter conditions based on user selections
  const filteredConditions = allConditions.filter(condition => {
    const categoryMatch = selectedCategories.has(condition.category)
    const statusMatch = selectedStatuses.has(condition.status)
    
    // Fix timeframe matching for "2-Hour" and other timeframes
    const conditionTimeframe = condition.id.split('-')[0]
    const timeframeMatch = selectedTimeframes.has(conditionTimeframe) || 
                          (conditionTimeframe === '2' && selectedTimeframes.has('2-Hour'))
    
    return categoryMatch && statusMatch && timeframeMatch
  })

  // Group conditions by timeframe
  const conditionsByTimeframe = TIMEFRAMES.reduce((acc, timeframe) => {
    acc[timeframe.name] = filteredConditions.filter(c => {
      const conditionTimeframe = c.id.split('-')[0]
      // Handle "2-Hour" special case
      if (timeframe.name === '2-Hour') {
        return conditionTimeframe === '2'
      }
      // Handle other timeframes
      return conditionTimeframe === timeframe.name
    })
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  // Debug logging
  console.log('All conditions:', allConditions.length)
  console.log('Filtered conditions:', filteredConditions.length)
  console.log('Selected timeframes:', Array.from(selectedTimeframes))
  console.log('Conditions by timeframe:', conditionsByTimeframe)
  console.log('All conditions details:', allConditions.map(c => ({ id: c.id, category: c.category, status: c.status })))
  console.log('Price action conditions:', allConditions.filter(c => c.category === 'price-action'))

  // Calculate summary statistics
  const technicalConditions = allConditions.filter(c => c.category === 'technical')
  const priceActionConditions = allConditions.filter(c => c.category === 'price-action')
  
  // Get all subcategories dynamically
  const technicalSubcategories = getSubcategoriesByCategory('technical')
  const priceActionSubcategories = getSubcategoriesByCategory('price-action')
  
  // Calculate counts for each subcategory
  const subcategoryCounts: { [key: string]: { [status: string]: number } } = {}
  
     // Initialize counts for all subcategories
   technicalSubcategories.forEach(sub => {
     subcategoryCounts[sub] = { BULLISH: 0, BEARISH: 0, NO_BIAS: 0, OVERBOUGHT: 0, OVERSOLD: 0 }
   })
   priceActionSubcategories.forEach(sub => {
     subcategoryCounts[sub] = { BULLISH: 0, BEARISH: 0, NO_BIAS: 0, OVERBOUGHT: 0, OVERSOLD: 0 }
   })
  
  // Count conditions by subcategory and status
  allConditions.forEach(condition => {
    if (subcategoryCounts[condition.subcategory]) {
      subcategoryCounts[condition.subcategory][condition.status] = 
        (subcategoryCounts[condition.subcategory][condition.status] || 0) + 1
    }
  })
  
  // Calculate totals
  const bullishCount = Object.values(subcategoryCounts).reduce((sum, counts) => sum + (counts.BULLISH || 0), 0)
  const bearishCount = Object.values(subcategoryCounts).reduce((sum, counts) => sum + (counts.BEARISH || 0), 0)
  const overboughtCount = Object.values(subcategoryCounts).reduce((sum, counts) => sum + (counts.OVERBOUGHT || 0), 0)
  const oversoldCount = Object.values(subcategoryCounts).reduce((sum, counts) => sum + (counts.OVERSOLD || 0), 0)

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">SPX Analysis Summary</h3>
            <p className="text-sm text-gray-600">
              {filteredConditions.length} conditions across {selectedTimeframes.size} timeframes
            </p>
          </div>
                     <div className="text-right">
             <div className="text-2xl font-bold text-blue-800">
               ${timeframeData.daily?.currentPrice.toFixed(2) || 'N/A'}
             </div>
             <div className="text-xs text-gray-500">Current Price</div>
           </div>
        </div>
        
                 <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
           <div className="text-center">
             <div className="font-semibold text-green-600">{bullishCount}</div>
             <div className="text-gray-600">Bullish</div>
           </div>
           <div className="text-center">
             <div className="font-semibold text-red-600">{bearishCount}</div>
             <div className="text-gray-600">Bearish</div>
           </div>
           <div className="text-center">
             <div className="font-semibold text-orange-600">{overboughtCount}</div>
             <div className="text-gray-600">Overbought</div>
           </div>
           <div className="text-center">
             <div className="font-semibold text-purple-600">{oversoldCount}</div>
             <div className="text-gray-600">Oversold</div>
           </div>
                                   <div className="text-center">
              <div className="font-semibold text-blue-600">{Object.values(subcategoryCounts).reduce((sum, counts) => sum + (counts.NO_BIAS || 0), 0)}</div>
              <div className="text-gray-600">No Bias</div>
            </div>
         </div>
      </div>

      {/* Timeframe Analysis */}
      {TIMEFRAMES.filter(tf => selectedTimeframes.has(tf.name)).map(timeframe => {
        const conditions = conditionsByTimeframe[timeframe.name] || []
        const sectionId = timeframe.name.toLowerCase()
        const isExpanded = expandedSections.has(sectionId)
        
        return (
          <div key={timeframe.name} className="card">
            <div 
              className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg border"
              onClick={() => {
                const newExpanded = new Set(expandedSections)
                if (newExpanded.has(sectionId)) {
                  newExpanded.delete(sectionId)
                } else {
                  newExpanded.add(sectionId)
                }
                setExpandedSections(newExpanded)
              }}
            >
                             <div className="flex items-center space-x-3">
                 {isExpanded ? (
                   <ChevronDown className="h-5 w-5 text-gray-500" />
                 ) : (
                   <ChevronRight className="h-5 w-5 text-gray-500" />
                 )}
                 <div>
                   <h4 className="text-xl font-bold text-gray-900">{timeframe.name} Analysis</h4>
                   <p className="text-sm text-gray-600">{conditions.length} conditions</p>
                 </div>
               </div>
               
                               {/* Readable summary stats in collapsed view */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">
                      {conditions.filter(c => c.status === 'BULLISH').length}
                    </div>
                    <div className="text-gray-500 text-xs">Bullish</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">
                      {conditions.filter(c => c.status === 'BEARISH').length}
                    </div>
                    <div className="text-gray-500 text-xs">Bearish</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-orange-600">
                      {conditions.filter(c => c.status === 'OVERBOUGHT').length}
                    </div>
                    <div className="text-gray-500 text-xs">Overbought</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">
                      {conditions.filter(c => c.status === 'OVERSOLD').length}
                    </div>
                    <div className="text-gray-500 text-xs">Oversold</div>
                  </div>
                                     <div className="text-center">
                     <div className="font-semibold text-blue-600">
                       {conditions.filter(c => c.status === 'NO_BIAS').length}
                     </div>
                     <div className="text-gray-500 text-xs">No Bias</div>
                   </div>
                </div>
            </div>
            
                         {isExpanded && (
               <div className="mt-4 space-y-4">
                 {/* Group by category and subcategory */}
                 {['technical', 'price-action'].map(category => {
                   const categoryConditions = conditions.filter(c => c.category === category)
                   if (categoryConditions.length === 0) return null
                   
                   const subcategories = getSubcategoriesByCategory(category)
                   
                   return subcategories.map(subcategory => {
                     const subcategoryConditions = categoryConditions.filter(c => c.subcategory === subcategory)
                     if (subcategoryConditions.length === 0) return null
                     
                     return (
                       <div key={`${category}-${subcategory}`} className="border border-gray-200 rounded-lg p-4">
                         <h5 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                           {subcategory} Indicators ({subcategoryConditions.length})
                         </h5>
                         <div className="space-y-2">
                           {subcategoryConditions.map(condition => (
                             <div 
                               key={condition.id}
                                                               className={`flex items-start space-x-3 p-3 rounded-lg border ${
                                  condition.status === 'BULLISH' || condition.status === 'NO_BIAS'
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-red-50 border-red-200'
                                }`}
                             >
                                                               {condition.status === 'BULLISH' || condition.status === 'NO_BIAS' ? (
                                 <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                               ) : (
                                 <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                               )}
                               <div className="flex-1">
                                 <div className="text-sm font-medium text-gray-900">{condition.label}</div>
                                 <div className="text-xs text-gray-600 mt-1 font-mono">{condition.description}</div>
                               </div>
                               <div className="flex flex-col items-end space-y-1">
                                 <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                   condition.status === 'BULLISH' ? 'bg-green-100 text-green-800' :
                                   condition.status === 'BEARISH' ? 'bg-red-100 text-red-800' :
                                   condition.status === 'OVERBOUGHT' ? 'bg-orange-100 text-orange-800' :
                                   condition.status === 'OVERSOLD' ? 'bg-purple-100 text-purple-800' :
                                   condition.status === 'NO_BIAS' ? 'bg-gray-100 text-gray-800' :
                                   'bg-blue-100 text-blue-800'
                                 }`}>
                                   {condition.status}
                                 </div>
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
                           ))}
                         </div>
                       </div>
                     )
                   })
                 })}
               </div>
             )}
          </div>
        )
      })}
    </div>
  )
}
