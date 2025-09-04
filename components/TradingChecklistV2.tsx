'use client'

import React, { useState } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronRight, X } from 'lucide-react'
import { TechnicalAnalysis } from '../lib/technicalAnalysis'
import { 
  getSMAStrengthThreshold, 
  getBollingerBandsStrengthThreshold, 
  getBollingerBandsPeriods,
  getPriceActionStrengthThreshold, 
  getIndicatorCategorization,
  getSubcategoriesByCategory,
  getVWAPLookbackPeriod,
  getVolumeProfileLookbackPeriod,
  getMMLOvershootLookbackPeriod,
  getMMLOversoldLookbackPeriod,
  getMMLOvershootFrame,
  getMMLOversoldFrame,
  getMMLOvershootMultiplier,
  getMMLOversoldMultiplier,
  getMMLOvershootIgnoreWicks,
  getMMLOversoldIgnoreWicks,
  getMMLOvershootShowHistoricalLevels,
  getMMLOversoldShowHistoricalLevels,
  getATRPeriods,
  getATRPrimaryPeriod,
  getATRComparisonPeriod,
  getSwingHighLowLeftLength,
  getSwingHighLowRightLength,
  getSwingHighLowMinStrength,
  getSwingHighLowUsePivotDetection,
  getPivotPointsTolerance,
  getFibonacciTolerance,
  getHorizontalLevelsTolerance,
  getHorizontalLevelsMinTouches,
  getROCPeriod,
  getSMADistanceThreshold
} from '../config/trading-config'
import { MarketData } from '../types/market'
import { timeframeDataService, type TimeframeData as ServiceTimeframeData } from '../lib/timeframeDataService'
import IndicatorVisualization from './IndicatorVisualization'
import KeyLevelsSummary from './KeyLevelsSummary'

interface TradingChecklistProps {
  marketData: MarketData[]
  selectedSymbol: string
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
  // Dynamic SMA fields for all periods
  sma: { [period: number]: number }
  smaLow: { [period: number]: number }
  // Legacy fields for backward compatibility
  sma89: number
  sma200: number
  sma89Low: number
  sma200Low: number
  historicalPrices?: number[]
  historicalOHLC?: { high: number[], low: number[], close: number[], open: number[] }
  historicalVolume?: number[]
  previousClose?: number
  previousHigh?: number
}

// ===== MODAL COMPONENT =====
interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  allConditions: ChecklistItem[]
  selectedStatus?: 'BULLISH' | 'BEARISH' | 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS'
  currentSymbol: string
}

function SummaryModal({ isOpen, onClose, allConditions, selectedStatus, currentSymbol }: SummaryModalProps) {
  if (!isOpen) return null

  // Filter conditions based on selected status
  const filteredConditions = selectedStatus 
    ? allConditions.filter(c => c.status === selectedStatus)
    : allConditions

  // Group by timeframe
  const groupByTimeframe = (conditions: ChecklistItem[]) => {
    const grouped: { [key: string]: ChecklistItem[] } = {}
    conditions.forEach(condition => {
      const timeframe = condition.id.split('-')[0]
      const timeframeName = timeframe === '2' ? '2-Hour' : timeframe
      if (!grouped[timeframeName]) {
        grouped[timeframeName] = []
      }
      grouped[timeframeName].push(condition)
    })
    return grouped
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BULLISH': return 'text-green-600'
      case 'BEARISH': return 'text-red-600'
      case 'OVERBOUGHT': return 'text-orange-600'
      case 'OVERSOLD': return 'text-purple-600'
      case 'NO_BIAS': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'BULLISH': return 'Bullish Indicators'
      case 'BEARISH': return 'Bearish Indicators'
      case 'OVERBOUGHT': return 'Overbought Indicators'
      case 'OVERSOLD': return 'Oversold Indicators'
      case 'NO_BIAS': return 'No Bias Indicators'
      default: return 'All Indicators'
    }
  }

  const groupedByTimeframe = groupByTimeframe(filteredConditions)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                     <h2 className="text-xl font-bold text-gray-900">
             {selectedStatus ? getStatusTitle(selectedStatus) : `${currentSymbol} Analysis Breakdown`}
           </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
                 <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
           {Object.entries(groupedByTimeframe).map(([timeframe, timeframeConditions]) => {
             // Extract current symbol price from the first condition's description
             const firstCondition = timeframeConditions[0]
             const priceMatch = firstCondition?.description.match(/\$([\d,]+\.\d+)/)
             const currentPrice = priceMatch ? priceMatch[1] : 'N/A'
             
             return (
               <div key={timeframe} className="mb-6 border border-gray-200 rounded-lg p-4">
                 <div className="flex items-center justify-between mb-3">
                   <h3 className="text-lg font-semibold text-gray-900">{timeframe} ({timeframeConditions.length})</h3>
                   <div className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                     {currentSymbol}: ${currentPrice}
                   </div>
                 </div>
                 <div className="space-y-2">
                   {timeframeConditions.map(condition => {
                     // Remove SPX price from description since it's shown at timeframe level
                     const cleanDescription = condition.description.replace(/SPX: \$[\d,]+\.\d+ \| /, '')
                     
                     return (
                       <div key={condition.id} className="space-y-1">
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-700 font-medium">{condition.label}</span>
                           <span className={`px-2 py-1 rounded text-xs font-medium ${
                             condition.strength === 'STRONG' ? 'bg-yellow-100 text-yellow-800' :
                             condition.strength === 'MODERATE' ? 'bg-gray-100 text-gray-800' :
                             'bg-gray-50 text-gray-600'
                           }`}>
                             {condition.strength}
                           </span>
                         </div>
                         <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                           {cleanDescription}
                         </div>
                       </div>
                     )
                   })}
                 </div>
               </div>
             )
           })}
         </div>
      </div>
    </div>
  )
}

// ===== INDICATOR DEFINITIONS =====
// Each indicator is defined once with its logic and parameters

// Get SMA periods from trading config
function getSMAPeriods(): number[] {
  try {
    // Import the config dynamically to avoid circular dependencies
    const config = require('../config/trading-config.json')
    return config.indicators.sma.periods || [20, 50, 89, 200]
  } catch (error) {
    console.warn('Could not load SMA periods from config, using defaults:', error)
    return [20, 50, 89, 200]
  }
}

// Generate dynamic SMA indicators for all periods
function generateSMAIndicators() {
  const smaPeriods = getSMAPeriods()
  const indicators: { [key: string]: any } = {}
  
  smaPeriods.forEach(period => {
    // SMA Close indicators
    indicators[`sma${period}`] = {
      id: `sma-${period}`,
      label: `Close > ${period} SMA`,
      getCategory: () => getIndicatorCategorization('sma') || { category: 'technical', subcategory: 'directional' },
      calculate: (timeframe: TimeframeData): ChecklistItem | null => {
        if (!timeframe.sma || !timeframe.sma[period]) return null
        
        const status = timeframe.price > timeframe.sma[period] ? 'BULLISH' : 'BEARISH'
        const strength = Math.abs(timeframe.price - timeframe.sma[period]) / timeframe.sma[period] > getSMAStrengthThreshold() ? 'STRONG' : 'MODERATE'
        
        return {
          id: `${timeframe.name}-sma-${period}`,
          label: `${timeframe.name} Close > ${timeframe.name} ${period} SMA`,
          status,
          strength,
          description: `SPX: $${timeframe.price.toFixed(2)} | ${period} SMA: $${timeframe.sma[period].toFixed(2)}`,
          category: indicators[`sma${period}`].getCategory().category,
          subcategory: indicators[`sma${period}`].getCategory().subcategory
        }
      }
    }
    
    // SMA Low indicators
    indicators[`sma${period}Low`] = {
      id: `sma-${period}-low`,
      label: `Close > ${period} SMA Low`,
      getCategory: () => getIndicatorCategorization('sma-low') || { category: 'technical', subcategory: 'directional' },
      calculate: (timeframe: TimeframeData): ChecklistItem | null => {
        if (!timeframe.smaLow || !timeframe.smaLow[period]) return null
        
        const status = timeframe.price > timeframe.smaLow[period] ? 'BULLISH' : 'BEARISH'
        const strength = Math.abs(timeframe.price - timeframe.smaLow[period]) / timeframe.smaLow[period] > getSMAStrengthThreshold() ? 'STRONG' : 'MODERATE'
        
        return {
          id: `${timeframe.name}-sma-${period}-low`,
          label: `${timeframe.name} Close > ${timeframe.name} ${period} SMA Low`,
          status,
          strength,
          description: `SPX: $${timeframe.price.toFixed(2)} | ${period} SMA Low: $${timeframe.smaLow[period].toFixed(2)}`,
          category: indicators[`sma${period}Low`].getCategory().category,
          subcategory: indicators[`sma${period}Low`].getCategory().subcategory
        }
      }
    }
  })
  
  return indicators
}

const INDICATORS: {
  [key: string]: {
    id: string
    label: string
    getCategory: () => { category: string; subcategory: string }
    calculate: (timeframe: TimeframeData, ...args: any[]) => ChecklistItem | ChecklistItem[] | null
  }
} = {
  // Dynamic SMA-based indicators
  ...generateSMAIndicators(),

  // RSI indicator
  rsi: {
    id: 'rsi',
    label: 'RSI Signal',
    getCategory: () => getIndicatorCategorization('rsi') || { category: 'technical', subcategory: 'oscillators' },
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

  // ATR indicator (configurable periods)
  atr: {
    id: 'atr',
    label: 'ATR Volatility',
    getCategory: () => getIndicatorCategorization('atr') || { category: 'technical', subcategory: 'volatility' },
    calculate: (timeframe: TimeframeData): ChecklistItem | null => {
      const primaryPeriod = getATRPrimaryPeriod()
      const comparisonPeriod = getATRComparisonPeriod()
      const maxPeriod = Math.max(primaryPeriod, comparisonPeriod)
      
      if (!timeframe.historicalOHLC || timeframe.historicalOHLC.close.length < maxPeriod) return null
      
      const { high, low, close } = timeframe.historicalOHLC
      const atrPrimary = TechnicalAnalysis.calculateATR(high, low, close, primaryPeriod)
      const atrComparison = TechnicalAnalysis.calculateATR(high, low, close, comparisonPeriod)
      
      const atrConditions = TechnicalAnalysis.checkATRConditions(atrPrimary, atrComparison)
      
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
        label: `${timeframe.name} ATR ${primaryPeriod}-Volatility`,
        status,
        strength,
        description: `SPX: ATR ${atrPrimary.toFixed(2)} | ${comparisonPeriod}-period Avg: ${atrComparison.toFixed(2)} | ${atrConditions.isHighVolatility ? 'High Volatility' : atrConditions.isLowVolatility ? 'Low Volatility' : 'Normal Volatility'}`,
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

   // MML Overshoot indicator (TradingView-style)
   mmlOvershoot: {
     id: 'mml-overshoot',
     label: 'MML Overshoot',
     getCategory: () => getIndicatorCategorization('mmlOvershoot') || { category: 'technical', subcategory: 'volatility' },
     calculate: (timeframe: TimeframeData): ChecklistItem | null => {
       const lookbackPeriod = getMMLOvershootLookbackPeriod()
       if (!timeframe.historicalOHLC || timeframe.historicalOHLC.close.length < lookbackPeriod) return null
       
       const { high, low, open, close } = timeframe.historicalOHLC
       
       // Use only the last N periods for MML calculation
       const recentHigh = high.slice(-lookbackPeriod)
       const recentLow = low.slice(-lookbackPeriod)
       const recentOpen = open.slice(-lookbackPeriod)
       const recentClose = close.slice(-lookbackPeriod)
       
       // TradingView-style MML calculation with universal parameters
       const frame = getMMLOvershootFrame()
       const multiplier = getMMLOvershootMultiplier()
       const ignoreWicks = getMMLOvershootIgnoreWicks()
       
       // Calculate MML levels using the improved algorithm
       const mmlLevels = TechnicalAnalysis.calculateMurreyMathLevels(recentHigh, recentLow, frame, multiplier)
       const mmlConditions = TechnicalAnalysis.checkMMLOvershootConditions(timeframe.price, mmlLevels)
       
       // Always return a result, even if no overshoot conditions are met
       
       let status: 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS'
       let strength: 'STRONG' | 'MODERATE' | 'WEAK'
       
       if (mmlConditions.isExtremeOvershoot) {
         status = 'OVERBOUGHT'
         strength = 'STRONG'
       } else if (mmlConditions.isOvershoot) {
         status = 'OVERBOUGHT'
         strength = 'MODERATE'
       } else {
         status = 'NO_BIAS'
         strength = 'WEAK'
       }
       
       return {
         id: `${timeframe.name}-mml-overshoot`,
         label: `${timeframe.name} MML Overshoot (TV)`,
         status,
         strength,
         description: `SPX: $${timeframe.price.toFixed(2)} | +2/8: $${mmlLevels.plus28.toFixed(2)} | +1/8: $${mmlLevels.plus18.toFixed(2)} | Frame: ${frame}×${multiplier}`,
         category: INDICATORS.mmlOvershoot.getCategory().category,
         subcategory: INDICATORS.mmlOvershoot.getCategory().subcategory
       }
     }
   },

   // MML Oversold indicator (TradingView-style)
   mmlOversold: {
     id: 'mml-oversold',
     label: 'MML Oversold',
     getCategory: () => getIndicatorCategorization('mmlOversold') || { category: 'technical', subcategory: 'volatility' },
     calculate: (timeframe: TimeframeData): ChecklistItem | null => {
       const lookbackPeriod = getMMLOversoldLookbackPeriod()
       if (!timeframe.historicalOHLC || timeframe.historicalOHLC.close.length < lookbackPeriod) return null
       
       const { high, low, open, close } = timeframe.historicalOHLC
       
       // Use only the last N periods for MML calculation
       const recentHigh = high.slice(-lookbackPeriod)
       const recentLow = low.slice(-lookbackPeriod)
       const recentOpen = open.slice(-lookbackPeriod)
       const recentClose = close.slice(-lookbackPeriod)
       
       // TradingView-style MML calculation with universal parameters
       const frame = getMMLOversoldFrame()
       const multiplier = getMMLOversoldMultiplier()
       const ignoreWicks = getMMLOversoldIgnoreWicks()
       
       // Calculate MML levels using the improved algorithm
       const mmlLevels = TechnicalAnalysis.calculateMurreyMathLevels(recentHigh, recentLow, frame, multiplier)
       const mmlConditions = TechnicalAnalysis.checkMMLOversoldConditions(timeframe.price, mmlLevels)
       
       // Always return a result, even if no oversold conditions are met
       
       let status: 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS'
       let strength: 'STRONG' | 'MODERATE' | 'WEAK'
       
       if (mmlConditions.isExtremeOversold) {
         status = 'OVERSOLD'
         strength = 'STRONG'
       } else if (mmlConditions.isOversold) {
         status = 'OVERSOLD'
         strength = 'MODERATE'
       } else {
         status = 'NO_BIAS'
         strength = 'WEAK'
       }
       
       return {
         id: `${timeframe.name}-mml-oversold`,
         label: `${timeframe.name} MML Oversold (TV)`,
         status,
         strength,
         description: `SPX: $${timeframe.price.toFixed(2)} | -1/8: $${mmlLevels.minus18.toFixed(2)} | -2/8: $${mmlLevels.minus28.toFixed(2)} | Frame: ${frame}×${multiplier}`,
         category: INDICATORS.mmlOversold.getCategory().category,
         subcategory: INDICATORS.mmlOversold.getCategory().subcategory
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
      
      // Gap analysis - compare current open vs previous close
      if (timeframe.historicalOHLC && timeframe.historicalOHLC.open.length >= 1) {
        const currentOpen = timeframe.historicalOHLC.open[timeframe.historicalOHLC.open.length - 1]
        const gapAnalysis = TechnicalAnalysis.analyzeGap(currentOpen, timeframe.previousClose)
        items.push({
          id: `${timeframe.name}-gap`,
          label: `${timeframe.name} Gap Analysis`,
          status: gapAnalysis.isGapUp ? 'BULLISH' : 'BEARISH',
          strength: gapAnalysis.gapPercentage > 0.5 ? 'STRONG' : 'MODERATE',
          description: `Open: $${currentOpen.toFixed(2)} | Previous Close: $${timeframe.previousClose.toFixed(2)} | ${gapAnalysis.isGapUp ? 'Gap Up' : gapAnalysis.isGapDown ? 'Gap Down' : 'No Gap'} | Size: ${gapAnalysis.gapPercentage.toFixed(2)}%`,
          category: INDICATORS.priceAction.getCategory().category,
          subcategory: INDICATORS.priceAction.getCategory().subcategory
        })
      }

             

             
      
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
   },

       // Close vs Previous Low indicator
    closeVsPreviousLow: {
      id: 'close-vs-previous-low',
      label: 'Close vs Previous Low',
      getCategory: () => getIndicatorCategorization('closeVsPreviousLow') || { category: 'price-action', subcategory: 'price-action' },
      calculate: (timeframe: TimeframeData): ChecklistItem | null => {
        if (!timeframe.historicalOHLC || timeframe.historicalOHLC.low.length < 2) return null
        
        const currentClose = timeframe.price
        const previousLow = timeframe.historicalOHLC.low[timeframe.historicalOHLC.low.length - 2]
        
        if (!currentClose || !previousLow) return null
        
        const status = currentClose > previousLow ? 'BULLISH' : 'BEARISH'
        const strength = Math.abs(currentClose - previousLow) / previousLow > getPriceActionStrengthThreshold() ? 'STRONG' : 'MODERATE'
        
        return {
          id: `${timeframe.name}-close-vs-previous-low`,
          label: `${timeframe.name} Close vs Previous Low`,
          status,
          strength,
          description: `Close: $${currentClose.toFixed(2)} | Previous Low: $${previousLow.toFixed(2)}`,
          category: INDICATORS.closeVsPreviousLow.getCategory().category,
          subcategory: INDICATORS.closeVsPreviousLow.getCategory().subcategory
        }
      }
    },

    // Swing High/Low Detection
    swingHighLow: {
      id: 'swing-high-low',
      label: 'Swing High/Low Analysis',
      getCategory: () => getIndicatorCategorization('swingHighLow') || { category: 'technical', subcategory: 'support-resistance' },
      calculate: (timeframe: TimeframeData): ChecklistItem | null => {
        // Get pivot detection parameters - same for all timeframes
        const leftLength = getSwingHighLowLeftLength()
        const rightLength = getSwingHighLowRightLength()
        
        if (!timeframe.historicalOHLC || timeframe.historicalOHLC.high.length < leftLength + rightLength + 1) return null
        
        const { high, low } = timeframe.historicalOHLC
        // Use pivot-based detection (TradingView-style)
        const usePivotDetection = getSwingHighLowUsePivotDetection()
        const swingHighs = usePivotDetection 
          ? TechnicalAnalysis.findPivotHighs(high, leftLength, rightLength)
          : TechnicalAnalysis.findPivotHighs(high, leftLength, rightLength) // Default to pivot detection
        const swingLows = usePivotDetection 
          ? TechnicalAnalysis.findPivotLows(low, leftLength, rightLength)
          : TechnicalAnalysis.findPivotLows(low, leftLength, rightLength) // Default to pivot detection
        
        if (swingHighs.length === 0 && swingLows.length === 0) return null
        
        // Get the most recent swing high and low
        const recentSwingHigh = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1] : null
        const recentSwingLow = swingLows.length > 0 ? swingLows[swingLows.length - 1] : null
        
        const currentPrice = timeframe.price
        let status: 'BULLISH' | 'BEARISH' | 'NO_BIAS'
        let strength: 'STRONG' | 'MODERATE' | 'WEAK'
        let description = ''
        
        if (recentSwingLow && recentSwingHigh) {
          const distanceToLow = Math.abs(currentPrice - recentSwingLow.value) / recentSwingLow.value
          const distanceToHigh = Math.abs(currentPrice - recentSwingHigh.value) / recentSwingHigh.value
          const minStrength = getSwingHighLowMinStrength()
          
          // Calculate swing range for context
          const swingRange = recentSwingHigh.value - recentSwingLow.value
          const rangePercentage = (swingRange / recentSwingLow.value) * 100
          
                     if (distanceToLow <= minStrength) {
             status = 'BULLISH'
             strength = distanceToLow <= minStrength / 2 ? 'STRONG' : 'MODERATE'
             const positionInRange = ((currentPrice - recentSwingLow.value) / swingRange) * 100
             description = `High: $${recentSwingHigh.value.toFixed(2)} | Low: $${recentSwingLow.value.toFixed(2)} | Near Swing Low Support: $${recentSwingLow.value.toFixed(2)} | Distance: ${(distanceToLow * 100).toFixed(2)}% | Position: ${positionInRange.toFixed(1)}%`
           } else if (distanceToHigh <= minStrength) {
             status = 'BEARISH'
             strength = distanceToHigh <= minStrength / 2 ? 'STRONG' : 'MODERATE'
             const positionInRange = ((currentPrice - recentSwingLow.value) / swingRange) * 100
             description = `High: $${recentSwingHigh.value.toFixed(2)} | Low: $${recentSwingLow.value.toFixed(2)} | Near Swing High Resistance: $${recentSwingHigh.value.toFixed(2)} | Distance: ${(distanceToHigh * 100).toFixed(2)}% | Position: ${positionInRange.toFixed(1)}%`
           } else {
             status = 'NO_BIAS'
             strength = 'WEAK'
             const positionInRange = ((currentPrice - recentSwingLow.value) / swingRange) * 100
             description = `High: $${recentSwingHigh.value.toFixed(2)} | Low: $${recentSwingLow.value.toFixed(2)} | Between Swings | Position: ${positionInRange.toFixed(1)}%`
           }
        } else {
          status = 'NO_BIAS'
          strength = 'WEAK'
          description = `Insufficient swing data | Highs: ${swingHighs.length} | Lows: ${swingLows.length}`
        }
        
        return {
          id: `${timeframe.name}-swing-high-low`,
          label: `${timeframe.name} Swing High/Low`,
          status,
          strength,
          description,
          category: INDICATORS.swingHighLow.getCategory().category,
          subcategory: INDICATORS.swingHighLow.getCategory().subcategory
        }
      }
    },

    // Pivot Points
    pivotPoints: {
      id: 'pivot-points',
      label: 'Pivot Points Analysis',
      getCategory: () => getIndicatorCategorization('pivotPoints') || { category: 'technical', subcategory: 'support-resistance' },
      calculate: (timeframe: TimeframeData): ChecklistItem | null => {
        if (!timeframe.historicalOHLC || timeframe.historicalOHLC.high.length < 1) return null
        
        const { high, low, close } = timeframe.historicalOHLC
        const currentHigh = high[high.length - 1]
        const currentLow = low[low.length - 1]
        const currentClose = close[close.length - 1]
        
        const pivotPoints = TechnicalAnalysis.calculatePivotPoints(currentHigh, currentLow, currentClose)
        const pivotConditions = TechnicalAnalysis.checkPivotPointConditions(timeframe.price, pivotPoints)
        
        let status: 'BULLISH' | 'BEARISH' | 'NO_BIAS'
        let strength: 'STRONG' | 'MODERATE' | 'WEAK'
        let description = ''
        
        if (pivotConditions.nearS1 || pivotConditions.nearS2 || pivotConditions.nearS3) {
          status = 'BULLISH'
          strength = 'MODERATE'
          const nearLevel = pivotConditions.nearS1 ? 'S1' : pivotConditions.nearS2 ? 'S2' : 'S3'
          const levelValue = pivotConditions.nearS1 ? pivotPoints.s1 : pivotConditions.nearS2 ? pivotPoints.s2 : pivotPoints.s3
          description = `Near Support ${nearLevel}: $${levelValue.toFixed(2)} | PP: $${pivotPoints.pp.toFixed(2)}`
        } else if (pivotConditions.nearR1 || pivotConditions.nearR2 || pivotConditions.nearR3) {
          status = 'BEARISH'
          strength = 'MODERATE'
          const nearLevel = pivotConditions.nearR1 ? 'R1' : pivotConditions.nearR2 ? 'R2' : 'R3'
          const levelValue = pivotConditions.nearR1 ? pivotPoints.r1 : pivotConditions.nearR2 ? pivotPoints.r2 : pivotPoints.r3
          description = `Near Resistance ${nearLevel}: $${levelValue.toFixed(2)} | PP: $${pivotPoints.pp.toFixed(2)}`
        } else if (pivotConditions.abovePP) {
          status = 'BULLISH'
          strength = 'WEAK'
          description = `Above PP: $${pivotPoints.pp.toFixed(2)} | R1: $${pivotPoints.r1.toFixed(2)}`
        } else {
          status = 'BEARISH'
          strength = 'WEAK'
          description = `Below PP: $${pivotPoints.pp.toFixed(2)} | S1: $${pivotPoints.s1.toFixed(2)}`
        }
        
        return {
          id: `${timeframe.name}-pivot-points`,
          label: `${timeframe.name} Pivot Points`,
          status,
          strength,
          description,
          category: INDICATORS.pivotPoints.getCategory().category,
          subcategory: INDICATORS.pivotPoints.getCategory().subcategory
        }
      }
    },

    // Fibonacci Retracements
    fibonacciRetracements: {
      id: 'fibonacci-retracements',
      label: 'Fibonacci Retracements',
      getCategory: () => getIndicatorCategorization('fibonacciRetracements') || { category: 'technical', subcategory: 'support-resistance' },
      calculate: (timeframe: TimeframeData): ChecklistItem[] => {
        // Get pivot detection parameters - same for all timeframes
        const leftLength = getSwingHighLowLeftLength()
        const rightLength = getSwingHighLowRightLength()
        if (!timeframe.historicalOHLC || timeframe.historicalOHLC.high.length < leftLength + rightLength + 1) return []
        
        const { high, low } = timeframe.historicalOHLC
        // Use pivot-based detection (TradingView-style)
        const usePivotDetection = getSwingHighLowUsePivotDetection()
        const swingHighs = usePivotDetection 
          ? TechnicalAnalysis.findPivotHighs(high, leftLength, rightLength)
          : TechnicalAnalysis.findPivotHighs(high, leftLength, rightLength) // Default to pivot detection
        const swingLows = usePivotDetection 
          ? TechnicalAnalysis.findPivotLows(low, leftLength, rightLength)
          : TechnicalAnalysis.findPivotLows(low, leftLength, rightLength) // Default to pivot detection
        
        // Debug: Log swing detection results
        // console.log(`TradingChecklistV2 - ${timeframe.name} Swing detection:`, {
        //   swingHighsCount: swingHighs.length,
        //   swingLowsCount: swingLows.length,
        //   leftLength,
        //   rightLength,
        //   dataLength: timeframe.historicalOHLC.high.length
        // })
        
        if (swingHighs.length === 0 || swingLows.length === 0) return []
        
        // Use the most recent swing high and low
        const swingHigh = swingHighs[swingHighs.length - 1].value
        const swingLow = swingLows[swingLows.length - 1].value
        
        const fibLevels = TechnicalAnalysis.calculateFibonacciRetracements(swingHigh, swingLow)
        const currentPrice = timeframe.price
        const tolerance = getFibonacciTolerance()
        
        // Debug: Log Fibonacci calculation details
        // console.log(`TradingChecklistV2 - ${timeframe.name} Fibonacci calculation:`, {
        //   swingHigh,
        //   swingLow,
        //   currentPrice,
        //   tolerance,
        //   fibLevels
        // })
        
                 // Define Fibonacci retracement levels (excluding 0% and 100% as they're the swing points)
         const levels = [
           { name: '23.6%', value: fibLevels.level236, key: 'level236' },
           { name: '38.2%', value: fibLevels.level382, key: 'level382' },
           { name: '50%', value: fibLevels.level500, key: 'level500' },
           { name: '61.8%', value: fibLevels.level618, key: 'level618' },
           { name: '78.6%', value: fibLevels.level786, key: 'level786' }
         ]
        
        const items: ChecklistItem[] = []
        
        // Create a separate item for each Fibonacci level
        levels.forEach(level => {
          const distance = Math.abs(currentPrice - level.value) / level.value
          let status: 'BULLISH' | 'BEARISH' | 'NO_BIAS'
          let strength: 'STRONG' | 'MODERATE' | 'WEAK'
          let description = ''
          
          if (distance <= tolerance) {
            if (currentPrice > level.value) {
              status = 'BULLISH'
              strength = distance <= tolerance / 2 ? 'STRONG' : 'MODERATE'
            } else {
              status = 'BEARISH'
              strength = distance <= tolerance / 2 ? 'STRONG' : 'MODERATE'
            }
            description = `Near ${level.name}: $${level.value.toFixed(2)} | Distance: ${(distance * 100).toFixed(2)}%`
          } else {
            status = 'NO_BIAS'
            strength = 'WEAK'
            description = `At ${level.name}: $${level.value.toFixed(2)} | Distance: ${(distance * 100).toFixed(2)}%`
          }
          
          items.push({
            id: `${timeframe.name}-fibonacci-${level.key}`,
            label: `${timeframe.name} Fibonacci ${level.name}`,
            status,
            strength,
            description,
            category: INDICATORS.fibonacciRetracements.getCategory().category,
                         subcategory: INDICATORS.fibonacciRetracements.getCategory().subcategory
          })
        })
        
        // Debug: Log Fibonacci items being returned
        // console.log(`TradingChecklistV2 - ${timeframe.name} Fibonacci items:`, items)
        
        return items
      }
    },

    // Horizontal Support/Resistance Levels
    horizontalLevels: {
      id: 'horizontal-levels',
      label: 'Horizontal S/R Levels',
      getCategory: () => getIndicatorCategorization('horizontalLevels') || { category: 'technical', subcategory: 'support-resistance' },
      calculate: (timeframe: TimeframeData): ChecklistItem | null => {
        if (!timeframe.historicalOHLC || timeframe.historicalOHLC.close.length < 20) return null
        
        const { high, low, close } = timeframe.historicalOHLC
        const tolerance = getHorizontalLevelsTolerance()
        const minTouches = getHorizontalLevelsMinTouches()
        
        const horizontalLevels = TechnicalAnalysis.findHorizontalLevels(high, low, close, tolerance)
        const currentPrice = timeframe.price
        
        // Filter levels based on minimum touches
        const significantResistance = horizontalLevels.resistance.filter(level => {
          let touches = 0
          for (const price of close) {
            if (Math.abs(price - level) / level <= tolerance) touches++
          }
          return touches >= minTouches
        })
        
        const significantSupport = horizontalLevels.support.filter(level => {
          let touches = 0
          for (const price of close) {
            if (Math.abs(price - level) / level <= tolerance) touches++
          }
          return touches >= minTouches
        })
        
        const supportResistanceConditions = TechnicalAnalysis.checkSupportResistanceConditions(
          currentPrice, 
          significantSupport, 
          significantResistance, 
          tolerance
        )
        
        let status: 'BULLISH' | 'BEARISH' | 'NO_BIAS'
        let strength: 'STRONG' | 'MODERATE' | 'WEAK'
        let description = ''
        
        if (supportResistanceConditions.nearSupport) {
          status = 'BULLISH'
          strength = 'MODERATE'
          description = `Near Support: $${supportResistanceConditions.atSupport?.toFixed(2)} | Levels: ${significantSupport.length}`
        } else if (supportResistanceConditions.nearResistance) {
          status = 'BEARISH'
          strength = 'MODERATE'
          description = `Near Resistance: $${supportResistanceConditions.atResistance?.toFixed(2)} | Levels: ${significantResistance.length}`
        } else {
          status = 'NO_BIAS'
          strength = 'WEAK'
          description = `Between Levels | Support: ${significantSupport.length} | Resistance: ${significantResistance.length}`
        }
        
        return {
          id: `${timeframe.name}-horizontal-levels`,
          label: `${timeframe.name} Horizontal S/R`,
          status,
          strength,
          description,
          category: INDICATORS.horizontalLevels.getCategory().category,
          subcategory: INDICATORS.horizontalLevels.getCategory().subcategory
        }
      }
    },

    // ROC indicator
    roc: {
      id: 'roc',
      label: 'Rate of Change',
      getCategory: () => getIndicatorCategorization('roc') || { category: 'technical', subcategory: 'delta-analysis' },
      calculate: (timeframe: TimeframeData): ChecklistItem | null => {
        const rocPeriod = getROCPeriod(timeframe.name.toLowerCase())
        if (!timeframe.historicalPrices || timeframe.historicalPrices.length < rocPeriod + 1) return null
        
        const currentPrice = timeframe.historicalPrices[timeframe.historicalPrices.length - 1]
        const pastPrice = timeframe.historicalPrices[timeframe.historicalPrices.length - 1 - rocPeriod]
        const roc = ((currentPrice - pastPrice) / pastPrice) * 100
        
        let status: 'BULLISH' | 'BEARISH' | 'NO_BIAS'
        let strength: 'STRONG' | 'MODERATE' | 'WEAK'
        
        if (roc > 5) {
          status = 'BULLISH'
          strength = roc > 10 ? 'STRONG' : 'MODERATE'
        } else if (roc < -5) {
          status = 'BEARISH'
          strength = roc < -10 ? 'STRONG' : 'MODERATE'
        } else {
          status = 'NO_BIAS'
          strength = 'WEAK'
        }
        
        return {
          id: `${timeframe.name}-roc`,
          label: `${timeframe.name} ROC (${rocPeriod})`,
          status,
          strength,
          description: `SPX: ROC ${roc.toFixed(2)}% over ${rocPeriod} bars | ${status === 'BULLISH' ? 'Strong Momentum' : status === 'BEARISH' ? 'Weak Momentum' : 'Neutral'}`,
          category: INDICATORS.roc.getCategory().category,
          subcategory: INDICATORS.roc.getCategory().subcategory
        }
      }
    },

    // SMA Distance Analysis indicator - returns array of individual SMA distance items
    smaDistance: {
      id: 'sma-distance',
      label: 'SMA Distance Analysis',
      getCategory: () => getIndicatorCategorization('smaDistance') || { category: 'technical', subcategory: 'delta-analysis' },
      calculate: (timeframe: TimeframeData): ChecklistItem[] => {
        const smaPeriods = [20, 50, 89, 200]
        const currentPrice = timeframe.price
        const items: ChecklistItem[] = []
        
        smaPeriods.forEach(period => {
          if (timeframe.sma && timeframe.sma[period]) {
            const smaValue = timeframe.sma[period]
            const distance = Math.abs(currentPrice - smaValue) / smaValue
            const distancePercentage = distance * 100
            const threshold = getSMADistanceThreshold(timeframe.name.toLowerCase(), period)
            
            // Determine status based on price position relative to this specific SMA
            let status: 'BULLISH' | 'BEARISH' | 'NO_BIAS'
            let strength: 'STRONG' | 'MODERATE' | 'WEAK'
            
            if (currentPrice > smaValue) {
              status = 'BULLISH'
              strength = distance > threshold * 1.5 ? 'STRONG' : distance > threshold ? 'MODERATE' : 'WEAK'
            } else {
              status = 'BEARISH'
              strength = distance > threshold * 1.5 ? 'STRONG' : distance > threshold ? 'MODERATE' : 'WEAK'
            }
            
            items.push({
              id: `${timeframe.name}-sma-${period}-distance`,
              label: `${timeframe.name} ${period} SMA Distance`,
              status,
              strength,
              description: `SPX: $${currentPrice.toFixed(2)} | ${period} SMA: $${smaValue.toFixed(2)} | Distance: ${distancePercentage.toFixed(1)}% | Threshold: ${(threshold * 100).toFixed(1)}%`,
              category: INDICATORS.smaDistance.getCategory().category,
              subcategory: INDICATORS.smaDistance.getCategory().subcategory
            })
          }
        })
        
        return items
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
        // Dynamic SMA fields for all periods
        sma: data.sma || {},
        smaLow: data.smaLow || {},
        // Legacy fields for backward compatibility
        sma89: data.sma89,
        sma200: data.sma200,
        sma89Low: data.sma89Low,
        sma200Low: data.sma200Low,
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
        // Dynamic SMA fields for all periods
        sma: data.sma || {},
        smaLow: data.smaLow || {},
        // Legacy fields for backward compatibility
        sma89: data.sma89,
        sma200: data.sma200,
        sma89Low: data.sma89Low,
        sma200Low: data.sma200Low,
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
        // Dynamic SMA fields for all periods
        sma: data.sma || {},
        smaLow: data.smaLow || {},
        // Legacy fields for backward compatibility
        sma89: data.sma89,
        sma200: data.sma200,
        sma89Low: data.sma89Low,
        sma200Low: data.sma200Low,
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
        // Dynamic SMA fields for all periods
        sma: data.sma || {},
        smaLow: data.smaLow || {},
        // Legacy fields for backward compatibility
        sma89: data.sma89,
        sma200: data.sma200,
        sma89Low: data.sma89Low,
        sma200Low: data.sma200Low,
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
export default function TradingChecklistV2({ marketData, selectedSymbol }: TradingChecklistProps) {
  console.log(`📊 TradingChecklistV2 received marketData:`, marketData.length, `records for symbol: ${selectedSymbol}`)
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['technical', 'price-action']))
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(['BULLISH', 'BEARISH', 'NO_BIAS', 'OVERBOUGHT', 'OVERSOLD']))
  const [selectedTimeframes, setSelectedTimeframes] = useState<Set<string>>(new Set(['Daily', '2-Hour', 'Weekly', 'Monthly']))
  const [timeframeData, setTimeframeData] = useState<Record<string, ServiceTimeframeData | null> | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'BULLISH' | 'BEARISH' | 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS' | undefined>(undefined)

  // Get current symbol data and fetch timeframe-specific data
  const currentSymbol = selectedSymbol
  const currentSymbolData = marketData.find(d => d.symbol === currentSymbol)
  
  // Fetch timeframe data when component mounts or symbol data changes
  React.useEffect(() => {
    console.log(`🔄 TradingChecklistV2 useEffect triggered:`, { currentSymbol, hasCurrentSymbolData: !!currentSymbolData, marketDataLength: marketData.length })
    
    async function fetchTimeframeData() {
      if (!currentSymbolData) {
        console.log(`❌ No currentSymbolData for ${currentSymbol}`)
        setLoading(false)
        setTimeframeData(null) // Reset timeframe data when no symbol data
        return
      }

      try {
        setLoading(true)
        setTimeframeData(null) // Clear previous timeframe data while loading
        console.log(`🚀 Fetching timeframe-specific data for ${currentSymbol}...`)
        const data = await timeframeDataService.getAllTimeframesData(currentSymbol, 500)
        setTimeframeData(data)
        console.log(`✅ Timeframe data fetched for ${currentSymbol}:`, Object.keys(data).filter(k => data[k as keyof typeof data]))
      } catch (error) {
        console.error(`❌ Error fetching timeframe data for ${currentSymbol}:`, error)
        setTimeframeData(null) // Reset on error
      } finally {
        setLoading(false)
      }
    }

    fetchTimeframeData()
  }, [selectedSymbol, currentSymbol, currentSymbolData, marketData]) // Add selectedSymbol to dependencies

  if (!currentSymbolData) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No {currentSymbol} Data</h3>
              <p className="text-gray-600">{currentSymbol} data not available for analysis.</p>
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
     
     // Debug: Log timeframe data availability
     // console.log(`TradingChecklistV2 - Processing ${timeframeConfig.name}:`, {
     //   hasHistoricalOHLC: !!timeframeDataItem.historicalOHLC,
     //   historicalOHLCLength: timeframeDataItem.historicalOHLC?.high.length || 0,
     //   currentPrice: timeframeDataItem.price
     // })
    
                     // Apply all indicators to this timeframe
       Object.values(INDICATORS).forEach(indicator => {
         // Debug: Log which indicator is being processed
         // console.log(`TradingChecklistV2 - Processing ${timeframeConfig.name} ${indicator.id}`)
                          if (indicator.id === 'price-action') {
           // Price action returns multiple items
           const items = indicator.calculate(timeframeDataItem) as ChecklistItem[]
           allConditions.push(...items)
                   } else if (indicator.id === 'fibonacci-retracements') {
            // Fibonacci retracements returns multiple items (one for each level)
            const items = indicator.calculate(timeframeDataItem) as ChecklistItem[]
            allConditions.push(...items)
          } else if (indicator.id === 'sma-distance') {
            // SMA Distance returns multiple items (one for each SMA period)
            const items = indicator.calculate(timeframeDataItem) as ChecklistItem[]
            allConditions.push(...items)
          } else if (indicator.id === 'bb') {
            // Bollinger Bands - add for different periods from config
            getBollingerBandsPeriods().forEach(period => {
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
  // console.log('All conditions:', allConditions.length)
  // console.log('Filtered conditions:', filteredConditions.length)
  // console.log('Selected timeframes:', Array.from(selectedTimeframes))
  // console.log('Conditions by timeframe:', conditionsByTimeframe)
  // console.log('All conditions details:', allConditions.map(c => ({ id: c.id, category: c.category, status: c.status })))
  // console.log('Price action conditions:', allConditions.filter(c => c.category === 'price-action'))

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

  // Helper function to replace hardcoded SPX references with current symbol
  function replaceSymbolReferences(text: string, symbol: string): string {
    return text.replace(/SPX:/g, `${symbol}:`)
  }

  // Process all conditions to replace symbol references
  function processConditions(conditions: ChecklistItem[], symbol: string): ChecklistItem[] {
    return conditions.map(condition => ({
      ...condition,
      description: replaceSymbolReferences(condition.description, symbol)
    }))
  }

  return (
    <div className="space-y-6">
             {/* Summary Card */}
       <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
         <div className="flex items-center justify-between mb-4">
                       <div>
              <h3 className="text-xl font-bold text-gray-900">{currentSymbol} Analysis Summary</h3>
              <p className="text-sm text-gray-600">
                {filteredConditions.length} conditions across {selectedTimeframes.size} timeframes
              </p>
            </div>
                       <div className="text-right">
              <div className="text-2xl font-bold text-blue-800">
                ${timeframeData.daily?.currentPrice.toFixed(2) || 'N/A'}
              </div>
              <div className="text-xs text-gray-500">{currentSymbol} Current Price</div>
            </div>
         </div>
        
         <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
           <div 
             className="text-center cursor-pointer hover:bg-green-100 p-2 rounded transition-colors"
             onClick={() => {
               setSelectedStatus('BULLISH')
               setShowSummaryModal(true)
             }}
           >
             <div className="font-semibold text-green-600">{bullishCount}</div>
             <div className="text-gray-600">Bullish</div>
           </div>
           <div 
             className="text-center cursor-pointer hover:bg-red-100 p-2 rounded transition-colors"
             onClick={() => {
               setSelectedStatus('BEARISH')
               setShowSummaryModal(true)
             }}
           >
             <div className="font-semibold text-red-600">{bearishCount}</div>
             <div className="text-gray-600">Bearish</div>
           </div>
           <div 
             className="text-center cursor-pointer hover:bg-orange-100 p-2 rounded transition-colors"
             onClick={() => {
               setSelectedStatus('OVERBOUGHT')
               setShowSummaryModal(true)
             }}
           >
             <div className="font-semibold text-orange-600">{overboughtCount}</div>
             <div className="text-gray-600">Overbought</div>
           </div>
           <div 
             className="text-center cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors"
             onClick={() => {
               setSelectedStatus('OVERSOLD')
               setShowSummaryModal(true)
             }}
           >
             <div className="font-semibold text-purple-600">{oversoldCount}</div>
             <div className="text-gray-600">Oversold</div>
           </div>
           <div 
             className="text-center cursor-pointer hover:bg-blue-100 p-2 rounded transition-colors"
             onClick={() => {
               setSelectedStatus('NO_BIAS')
               setShowSummaryModal(true)
             }}
           >
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
       
                       {/* Summary Modal */}
         <SummaryModal 
           isOpen={showSummaryModal}
           onClose={() => {
             setShowSummaryModal(false)
             setSelectedStatus(undefined)
           }}
           allConditions={processConditions(allConditions, currentSymbol)}
           selectedStatus={selectedStatus}
           currentSymbol={currentSymbol}
         />

                           {/* Key Levels Summary */}
          <KeyLevelsSummary 
            allConditions={processConditions(allConditions, currentSymbol)} 
            currentPrice={timeframeData.daily?.currentPrice || 0} 
          />

                   {/* Indicator Visualization */}
          <IndicatorVisualization allConditions={processConditions(allConditions, currentSymbol)} />
       </div>
     )
   }
