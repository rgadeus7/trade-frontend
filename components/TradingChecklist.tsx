'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Filter, BarChart3 } from 'lucide-react'
import { TechnicalAnalysis } from '../lib/technicalAnalysis'
import { 
  getSMAStrengthThreshold, 
  getRSIThresholds, 
  getBollingerBandsStrengthThreshold, 
  getPriceActionStrengthThreshold, 
  getGapAnalysisStrengthThreshold,
  isDirectionalIndicator,
  isMomentumIndicator
} from '../config/trading-config'
import { MarketData } from '../types/market'

interface TradingChecklistProps {
  marketData: MarketData[]
}

interface ChecklistItem {
  id: string
  label: string
  status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
  strength?: 'STRONG' | 'MODERATE' | 'WEAK'
  description: string
}

interface ChecklistGroup {
  id: string
  title: string
  description: string
  conditions: ChecklistItem[]
}

interface TimeframeAnalysis {
  title: string
  description: string
  groups: ChecklistGroup[]
}

export default function TradingChecklist({ marketData }: TradingChecklistProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([]))
  const [filterStatus, setFilterStatus] = useState<'all' | 'met' | 'not-met'>('all')
  const [sortBy, setSortBy] = useState<'default' | 'status' | 'alphabetical'>('default')

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const evaluateSPXConditions = (data: MarketData[]): TimeframeAnalysis[] => {
    const analyses: TimeframeAnalysis[] = []
    
    // Get SPX data only
    const spxData = data.find(d => d.symbol === 'SPX')
    
    if (!spxData || !spxData.daily || !spxData.sma89 || !spxData.sma2h) {
      return []
    }

    const dailyPrice = spxData.daily.price
    const dailySMA = spxData.sma89
    const hourlySMA = spxData.sma2h

    // ===== DAILY ANALYSIS =====
    const dailyGroups: ChecklistGroup[] = []

    // Daily Technical Analysis Group
    const dailyTechnicalConditions: ChecklistItem[] = [
      {
        id: 'daily-above-sma',
        label: 'Daily Close > Daily 89 SMA',
        status: dailyPrice > dailySMA ? 'BULLISH' : 'BEARISH',
        strength: Math.abs(dailyPrice - dailySMA) / dailySMA > getSMAStrengthThreshold() ? 'STRONG' : 'MODERATE',
        description: `SPX: $${dailyPrice.toFixed(2)} | 89 SMA: $${dailySMA.toFixed(2)}`
      }
    ]

    // Add Daily RSI if historical data is available
    if (spxData.dailyHistoricalPrices && spxData.dailyHistoricalPrices.length >= 15) {
      const dailyRSI = TechnicalAnalysis.calculateRSI(spxData.dailyHistoricalPrices, 14)
      const rsiThresholds = getRSIThresholds()
      let rsiStatus: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
      let rsiStrength: 'STRONG' | 'MODERATE' | 'WEAK'
      
             // Check if thresholds exist and are objects
       if (rsiThresholds.overbought && typeof rsiThresholds.overbought === 'object' && 'moderate' in rsiThresholds.overbought) {
         const overbought = rsiThresholds.overbought as { strong: number; moderate: number; weak?: number }
         const oversold = rsiThresholds.oversold as { strong: number; moderate: number; weak?: number }
         const neutral = rsiThresholds.neutral as { upper: number; lower: number }
         
         if (dailyRSI > overbought.moderate) {
           rsiStatus = 'OVERBOUGHT'
           rsiStrength = dailyRSI > overbought.strong ? 'STRONG' : 'MODERATE'
         } else if (dailyRSI < oversold.moderate) {
           rsiStatus = 'OVERSOLD'
           rsiStrength = dailyRSI < oversold.strong ? 'STRONG' : 'MODERATE'
         } else {
           rsiStatus = 'NEUTRAL'
           rsiStrength = 'WEAK'
         }
      } else {
        // Fallback to simple logic if thresholds are not properly configured
        if (dailyRSI > 70) {
          rsiStatus = 'OVERBOUGHT'
          rsiStrength = dailyRSI > 80 ? 'STRONG' : 'MODERATE'
        } else if (dailyRSI < 30) {
          rsiStatus = 'OVERSOLD'
          rsiStrength = dailyRSI < 20 ? 'STRONG' : 'MODERATE'
        } else {
          rsiStatus = 'NEUTRAL'
          rsiStrength = 'WEAK'
        }
      }
      
      dailyTechnicalConditions.push({
        id: 'daily-rsi-above-50',
        label: 'Daily RSI > 50',
        status: rsiStatus,
        strength: rsiStrength,
        description: `SPX: RSI ${dailyRSI.toFixed(1)} | Threshold: 50`
      })
    }

    // Add Daily Bollinger Bands if historical data is available
    if (spxData.dailyHistoricalPrices && spxData.dailyHistoricalPrices.length >= 20) {
      const bb20 = TechnicalAnalysis.calculateBollingerBands(spxData.dailyHistoricalPrices, 20)
      const bb20Position = dailyPrice > bb20.upper ? 'Above Upper Band' :
                          dailyPrice < bb20.lower ? 'Below Lower Band' : 'Between Bands'
      
      let bb20Status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
      let bb20Strength: 'STRONG' | 'MODERATE' | 'WEAK'
      
      if (dailyPrice > bb20.upper) {
        bb20Status = 'OVERBOUGHT'
        bb20Strength = (dailyPrice - bb20.upper) / bb20.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
      } else if (dailyPrice < bb20.lower) {
        bb20Status = 'OVERSOLD'
        bb20Strength = (bb20.lower - dailyPrice) / bb20.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
      } else {
        bb20Status = 'NEUTRAL'
        bb20Strength = 'WEAK'
      }

      dailyTechnicalConditions.push({
        id: 'daily-bb20-position',
        label: 'Daily BB 20-Position',
        status: bb20Status,
        strength: bb20Strength,
        description: `SPX: $${dailyPrice.toFixed(2)} | ${bb20Position} | Upper: $${bb20.upper.toFixed(2)} | Middle: $${bb20.middle.toFixed(2)} | Lower: $${bb20.lower.toFixed(2)}`
      })
    }

        if (spxData.dailyHistoricalPrices && spxData.dailyHistoricalPrices.length >= 50) {
      const bb50 = TechnicalAnalysis.calculateBollingerBands(spxData.dailyHistoricalPrices, 50)
      const bb50Position = dailyPrice > bb50.upper ? 'Above Upper Band' :
                           dailyPrice < bb50.lower ? 'Below Lower Band' : 'Between Bands'
      
      let bb50Status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
      let bb50Strength: 'STRONG' | 'MODERATE' | 'WEAK'
      
      if (dailyPrice > bb50.upper) {
        bb50Status = 'OVERBOUGHT'
        bb50Strength = (dailyPrice - bb50.upper) / bb50.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
      } else if (dailyPrice < bb50.lower) {
        bb50Status = 'OVERSOLD'
        bb50Strength = (bb50.lower - dailyPrice) / bb50.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
      } else {
        bb50Status = 'NEUTRAL'
        bb50Strength = 'WEAK'
      }

      dailyTechnicalConditions.push({
        id: 'daily-bb50-position',
        label: 'Daily BB 50-Position',
        status: bb50Status,
        strength: bb50Strength,
        description: `SPX: $${dailyPrice.toFixed(2)} | ${bb50Position} | Upper: $${bb50.upper.toFixed(2)} | Middle: $${bb50.middle.toFixed(2)} | Lower: $${bb50.lower.toFixed(2)}`
      })
    }

    if (spxData.dailyHistoricalPrices && spxData.dailyHistoricalPrices.length >= 89) {
      const bb89 = TechnicalAnalysis.calculateBollingerBands(spxData.dailyHistoricalPrices, 89)
      const bb89Position = dailyPrice > bb89.upper ? 'Above Upper Band' :
                           dailyPrice < bb89.lower ? 'Below Lower Band' : 'Between Bands'
      
      let bb89Status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
      let bb89Strength: 'STRONG' | 'MODERATE' | 'WEAK'
      
      if (dailyPrice > bb89.upper) {
        bb89Status = 'OVERBOUGHT'
        bb89Strength = (dailyPrice - bb89.upper) / bb89.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
      } else if (dailyPrice < bb89.lower) {
        bb89Status = 'OVERSOLD'
        bb89Strength = (bb89.lower - dailyPrice) / bb89.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
      } else {
        bb89Status = 'NEUTRAL'
        bb89Strength = 'WEAK'
      }

      dailyTechnicalConditions.push({
        id: 'daily-bb89-position',
        label: 'Daily BB 89-Position',
        status: bb89Status,
        strength: bb89Strength,
        description: `SPX: $${dailyPrice.toFixed(2)} | ${bb89Position} | Upper: $${bb89.upper.toFixed(2)} | Middle: $${bb89.middle.toFixed(2)} | Lower: $${bb89.lower.toFixed(2)}`
      })
    }

    dailyGroups.push({
      id: 'daily-technical',
      title: 'Technical Analysis',
      description: 'Moving averages, RSI, and Bollinger Bands',
      conditions: dailyTechnicalConditions
    })

    // Daily Price Action Group
    const dailyPriceActionConditions: ChecklistItem[] = []

    if (spxData.yesterday) {
      const yesterdayClose = spxData.yesterday.close
      const yesterdayHigh = spxData.yesterday.high
      
      dailyPriceActionConditions.push(
        {
          id: 'daily-above-yesterday-close',
          label: 'Daily Close > Yesterday Close',
          status: dailyPrice > yesterdayClose ? 'BULLISH' : 'BEARISH',
          strength: Math.abs(dailyPrice - yesterdayClose) / yesterdayClose > getPriceActionStrengthThreshold() ? 'STRONG' : 'MODERATE',
          description: `SPX: $${dailyPrice.toFixed(2)} | Yesterday: $${yesterdayClose.toFixed(2)}`
        },
        {
          id: 'daily-above-yesterday-high',
          label: 'Daily Close > Yesterday High',
          status: dailyPrice > yesterdayHigh ? 'BULLISH' : 'BEARISH',
          strength: Math.abs(dailyPrice - yesterdayHigh) / yesterdayHigh > getPriceActionStrengthThreshold() ? 'STRONG' : 'MODERATE',
          description: `SPX: $${dailyPrice.toFixed(2)} | Yesterday High: $${yesterdayHigh.toFixed(2)}`
        },
        {
          id: 'daily-gap-up',
          label: 'Gap Up from Yesterday',
          status: TechnicalAnalysis.analyzeGap(dailyPrice, yesterdayClose).isGapUp ? 'BULLISH' : 'BEARISH',
          strength: TechnicalAnalysis.analyzeGap(dailyPrice, yesterdayClose).gapPercentage > getGapAnalysisStrengthThreshold() * 100 ? 'STRONG' : 'MODERATE',
          description: `SPX: ${TechnicalAnalysis.analyzeGap(dailyPrice, yesterdayClose).isGapUp ? 'Gap Up' : 'No Gap'} | Size: ${TechnicalAnalysis.analyzeGap(dailyPrice, yesterdayClose).gapPercentage.toFixed(2)}%`
        }
      )
    }

    dailyGroups.push({
      id: 'daily-price-action',
      title: 'Price Action',
      description: 'Price patterns and gap analysis',
      conditions: dailyPriceActionConditions
    })

    // Daily Momentum Group (empty for now)
    dailyGroups.push({
      id: 'daily-momentum',
      title: 'Momentum',
      description: 'MACD and other momentum indicators',
      conditions: []
    })

    analyses.push({
      title: 'Daily Analysis',
      description: 'Daily timeframe analysis for SPX',
      groups: dailyGroups
    })

    // ===== 2-HOUR ANALYSIS =====
    const hourlyGroups: ChecklistGroup[] = []

    // 2-Hour Technical Analysis Group
    const hourlyTechnicalConditions: ChecklistItem[] = [
      {
        id: '2h-above-sma',
        label: '2H Close > 2H 89 SMA',
        status: dailyPrice > hourlySMA ? 'BULLISH' : 'BEARISH', // Using current daily price vs 2H SMA
        strength: Math.abs(dailyPrice - hourlySMA) / hourlySMA > getSMAStrengthThreshold() ? 'STRONG' : 'MODERATE',
        description: `SPX: $${dailyPrice.toFixed(2)} | 2H 89 SMA: $${hourlySMA.toFixed(2)}`
      }
    ]

         // Add 2H RSI if historical data is available
     if (spxData.hourlyHistoricalPrices && spxData.hourlyHistoricalPrices.length >= 15) {
       const hourlyRSI = TechnicalAnalysis.calculateRSI(spxData.hourlyHistoricalPrices, 14)
       const rsiThresholds = getRSIThresholds()
       let hourlyRsiStatus: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
       let hourlyRsiStrength: 'STRONG' | 'MODERATE' | 'WEAK'
       
       // Check if thresholds exist and are objects
       if (rsiThresholds.overbought && typeof rsiThresholds.overbought === 'object' && 'moderate' in rsiThresholds.overbought &&
           rsiThresholds.oversold && typeof rsiThresholds.oversold === 'object' && 'moderate' in rsiThresholds.oversold &&
           rsiThresholds.neutral && typeof rsiThresholds.neutral === 'object' && 'upper' in rsiThresholds.neutral) {
         const overbought = rsiThresholds.overbought as { strong: number; moderate: number; weak?: number }
         const oversold = rsiThresholds.oversold as { strong: number; moderate: number; weak?: number }
         const neutral = rsiThresholds.neutral as { upper: number; lower: number }
         
         if (hourlyRSI > overbought.moderate) {
           hourlyRsiStatus = 'OVERBOUGHT'
           hourlyRsiStrength = hourlyRSI > overbought.strong ? 'STRONG' : 'MODERATE'
         } else if (hourlyRSI < oversold.moderate) {
           hourlyRsiStatus = 'OVERSOLD'
           hourlyRsiStrength = hourlyRSI < oversold.strong ? 'STRONG' : 'MODERATE'
                   } else {
            hourlyRsiStatus = 'NEUTRAL'
            hourlyRsiStrength = 'WEAK'
          }
       } else {
         // Fallback to simple logic if thresholds are not properly configured
         if (hourlyRSI > 70) {
           hourlyRsiStatus = 'OVERBOUGHT'
           hourlyRsiStrength = hourlyRSI > 80 ? 'STRONG' : 'MODERATE'
         } else if (hourlyRSI < 30) {
           hourlyRsiStatus = 'OVERSOLD'
           hourlyRsiStrength = hourlyRSI < 20 ? 'STRONG' : 'MODERATE'
                   } else {
            hourlyRsiStatus = 'NEUTRAL'
            hourlyRsiStrength = 'WEAK'
          }
       }
      
      hourlyTechnicalConditions.push({
        id: '2h-rsi-above-50',
        label: '2H RSI > 50',
        status: hourlyRsiStatus,
        strength: hourlyRsiStrength,
        description: `SPX: RSI ${hourlyRSI.toFixed(1)} | Threshold: 50`
      })
    }

        // Add 2H Bollinger Bands if historical data is available
    if (spxData.hourlyHistoricalPrices && spxData.hourlyHistoricalPrices.length >= 20) {
      const bb20 = TechnicalAnalysis.calculateBollingerBands(spxData.hourlyHistoricalPrices, 20)
      const bb20Position = dailyPrice > bb20.upper ? 'Above Upper Band' : 
                          dailyPrice < bb20.lower ? 'Below Lower Band' : 'Between Bands'
      
      let bb20Status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
      let bb20Strength: 'STRONG' | 'MODERATE' | 'WEAK'
      
      if (dailyPrice > bb20.upper) {
        bb20Status = 'OVERBOUGHT'
        bb20Strength = (dailyPrice - bb20.upper) / bb20.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
      } else if (dailyPrice < bb20.lower) {
        bb20Status = 'OVERSOLD'
        bb20Strength = (bb20.lower - dailyPrice) / bb20.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
      } else {
        bb20Status = 'NEUTRAL'
        bb20Strength = 'WEAK'
      }
      
      hourlyTechnicalConditions.push({
        id: '2h-bb20-position',
        label: '2H BB 20-Position',
        status: bb20Status,
        strength: bb20Strength,
        description: `SPX: $${dailyPrice.toFixed(2)} | ${bb20Position} | Upper: $${bb20.upper.toFixed(2)} | Middle: $${bb20.middle.toFixed(2)} | Lower: $${bb20.lower.toFixed(2)}`
      })
    }

        if (spxData.hourlyHistoricalPrices && spxData.hourlyHistoricalPrices.length >= 50) {
      const bb50 = TechnicalAnalysis.calculateBollingerBands(spxData.hourlyHistoricalPrices, 50)
      const bb50Position = dailyPrice > bb50.upper ? 'Above Upper Band' : 
                           dailyPrice < bb50.lower ? 'Below Lower Band' : 'Between Bands'
      
      let bb50Status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
      let bb50Strength: 'STRONG' | 'MODERATE' | 'WEAK'
      
      if (dailyPrice > bb50.upper) {
        bb50Status = 'OVERBOUGHT'
        bb50Strength = (dailyPrice - bb50.upper) / bb50.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
      } else if (dailyPrice < bb50.lower) {
        bb50Status = 'OVERSOLD'
        bb50Strength = (bb50.lower - dailyPrice) / bb50.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
      } else {
        bb50Status = 'NEUTRAL'
        bb50Strength = 'WEAK'
      }
      
      hourlyTechnicalConditions.push({
        id: '2h-bb50-position',
        label: '2H BB 50-Position',
        status: bb50Status,
        strength: bb50Strength,
        description: `SPX: $${dailyPrice.toFixed(2)} | ${bb50Position} | Upper: $${bb50.upper.toFixed(2)} | Middle: $${bb50.middle.toFixed(2)} | Lower: $${bb50.lower.toFixed(2)}`
      })
    }

    if (spxData.hourlyHistoricalPrices && spxData.hourlyHistoricalPrices.length >= 89) {
      const bb89 = TechnicalAnalysis.calculateBollingerBands(spxData.hourlyHistoricalPrices, 89)
      const bb89Position = dailyPrice > bb89.upper ? 'Above Upper Band' :
                           dailyPrice < bb89.lower ? 'Below Lower Band' : 'Between Bands'
      
      let bb89Status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
      let bb89Strength: 'STRONG' | 'MODERATE' | 'WEAK'
      
      if (dailyPrice > bb89.upper) {
        bb89Status = 'OVERBOUGHT'
        bb89Strength = (dailyPrice - bb89.upper) / bb89.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
      } else if (dailyPrice < bb89.lower) {
        bb89Status = 'OVERSOLD'
        bb89Strength = (bb89.lower - dailyPrice) / bb89.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
      } else {
        bb89Status = 'NEUTRAL'
        bb89Strength = 'WEAK'
      }

      hourlyTechnicalConditions.push({
        id: '2h-bb89-position',
        label: '2H BB 89-Position',
        status: bb89Status,
        strength: bb89Strength,
        description: `SPX: $${dailyPrice.toFixed(2)} | ${bb89Position} | Upper: $${bb89.upper.toFixed(2)} | Middle: $${bb89.middle.toFixed(2)} | Lower: $${bb89.lower.toFixed(2)}`
      })
    }

    hourlyGroups.push({
      id: '2h-technical',
      title: 'Technical Analysis',
      description: 'Moving averages, RSI, and Bollinger Bands',
      conditions: hourlyTechnicalConditions
    })

    // 2-Hour Price Action Group (same as Daily)
    const hourlyPriceActionConditions: ChecklistItem[] = []

    if (spxData.yesterday) {
      const yesterdayClose = spxData.yesterday.close
      const yesterdayHigh = spxData.yesterday.high
      
      hourlyPriceActionConditions.push(
        {
          id: '2h-above-yesterday-close',
          label: '2H Close > Yesterday Close',
          status: dailyPrice > yesterdayClose ? 'BULLISH' : 'BEARISH',
          strength: Math.abs(dailyPrice - yesterdayClose) / yesterdayClose > getPriceActionStrengthThreshold() ? 'STRONG' : 'MODERATE',
          description: `SPX: $${dailyPrice.toFixed(2)} | Yesterday: $${yesterdayClose.toFixed(2)}`
        },
        {
          id: '2h-above-yesterday-high',
          label: '2H Close > Yesterday High',
          status: dailyPrice > yesterdayHigh ? 'BULLISH' : 'BEARISH',
          strength: Math.abs(dailyPrice - yesterdayHigh) / yesterdayHigh > getPriceActionStrengthThreshold() ? 'STRONG' : 'MODERATE',
          description: `SPX: $${dailyPrice.toFixed(2)} | Yesterday High: $${yesterdayHigh.toFixed(2)}`
        },
        {
          id: '2h-gap-up',
          label: '2H Gap Up from Yesterday',
          status: TechnicalAnalysis.analyzeGap(dailyPrice, yesterdayClose).isGapUp ? 'BULLISH' : 'BEARISH',
          strength: TechnicalAnalysis.analyzeGap(dailyPrice, yesterdayClose).gapPercentage > getGapAnalysisStrengthThreshold() * 100 ? 'STRONG' : 'MODERATE',
          description: `SPX: ${TechnicalAnalysis.analyzeGap(dailyPrice, yesterdayClose).isGapUp ? 'Gap Up' : 'No Gap'} | Size: ${TechnicalAnalysis.analyzeGap(dailyPrice, yesterdayClose).gapPercentage.toFixed(2)}%`
        }
      )
    }

    hourlyGroups.push({
      id: '2h-price-action',
      title: 'Price Action',
      description: 'Price patterns and gap analysis',
      conditions: hourlyPriceActionConditions
    })

    // 2-Hour Momentum Group (empty for now)
    hourlyGroups.push({
      id: '2h-momentum',
      title: 'Momentum',
      description: '2-hour momentum indicators',
      conditions: []
    })

    analyses.push({
      title: '2-Hour Analysis',
      description: '2-hour timeframe analysis for SPX',
      groups: hourlyGroups
    })

    // ===== WEEKLY ANALYSIS =====
    if (spxData.weekly && spxData.weeklySMA) {
      const weeklyGroups: ChecklistGroup[] = []
      const weeklyPrice = spxData.weekly.price
      const weeklySMA = spxData.weeklySMA

      // Weekly Technical Analysis Group
      const weeklyTechnicalConditions: ChecklistItem[] = [
        {
          id: 'weekly-above-sma',
          label: 'Weekly Close > Weekly 89 SMA',
          status: weeklyPrice > weeklySMA ? 'BULLISH' : 'BEARISH',
          strength: Math.abs(weeklyPrice - weeklySMA) / weeklySMA > getSMAStrengthThreshold() ? 'STRONG' : 'MODERATE',
          description: `SPX: $${weeklyPrice.toFixed(2)} | 89 SMA: $${weeklySMA.toFixed(2)}`
        }
      ]

      // Add Weekly RSI if historical data is available
      if (spxData.weeklyHistoricalPrices && spxData.weeklyHistoricalPrices.length >= 15) {
        const weeklyRSI = TechnicalAnalysis.calculateRSI(spxData.weeklyHistoricalPrices, 14)
        const rsiThresholds = getRSIThresholds()
        let weeklyRsiStatus: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
        let weeklyRsiStrength: 'STRONG' | 'MODERATE' | 'WEAK'
        
        // Check if thresholds exist and are objects
        if (rsiThresholds.overbought && typeof rsiThresholds.overbought === 'object' && 'moderate' in rsiThresholds.overbought &&
            rsiThresholds.oversold && typeof rsiThresholds.oversold === 'object' && 'moderate' in rsiThresholds.oversold &&
            rsiThresholds.neutral && typeof rsiThresholds.neutral === 'object' && 'upper' in rsiThresholds.neutral) {
          const overbought = rsiThresholds.overbought as { strong: number; moderate: number; weak?: number }
          const oversold = rsiThresholds.oversold as { strong: number; moderate: number; weak?: number }
          const neutral = rsiThresholds.neutral as { upper: number; lower: number }
          
          if (weeklyRSI > overbought.moderate) {
            weeklyRsiStatus = 'OVERBOUGHT'
            weeklyRsiStrength = weeklyRSI > overbought.strong ? 'STRONG' : 'MODERATE'
          } else if (weeklyRSI < oversold.moderate) {
            weeklyRsiStatus = 'OVERSOLD'
            weeklyRsiStrength = weeklyRSI < oversold.strong ? 'STRONG' : 'MODERATE'
                     } else {
             weeklyRsiStatus = 'NEUTRAL'
             weeklyRsiStrength = 'WEAK'
           }
        } else {
          // Fallback to simple logic if thresholds are not properly configured
          if (weeklyRSI > 70) {
            weeklyRsiStatus = 'OVERBOUGHT'
            weeklyRsiStrength = weeklyRSI > 80 ? 'STRONG' : 'MODERATE'
          } else if (weeklyRSI < 30) {
            weeklyRsiStatus = 'OVERSOLD'
            weeklyRsiStrength = weeklyRSI < 20 ? 'STRONG' : 'MODERATE'
                     } else {
             weeklyRsiStatus = 'NEUTRAL'
             weeklyRsiStrength = 'WEAK'
           }
        }
        
        weeklyTechnicalConditions.push({
          id: 'weekly-rsi-above-50',
          label: 'Weekly RSI > 50',
          status: weeklyRsiStatus,
          strength: weeklyRsiStrength,
          description: `SPX: RSI ${weeklyRSI.toFixed(1)} | Threshold: 50`
        })
      }

      // Add Weekly Bollinger Bands if historical data is available
      if (spxData.weeklyHistoricalPrices && spxData.weeklyHistoricalPrices.length >= 20) {
        const bb20 = TechnicalAnalysis.calculateBollingerBands(spxData.weeklyHistoricalPrices, 20)
        const bb20Position = weeklyPrice > bb20.upper ? 'Above Upper Band' :
                            weeklyPrice < bb20.lower ? 'Below Lower Band' : 'Between Bands'
        
        let bb20Status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
        let bb20Strength: 'STRONG' | 'MODERATE' | 'WEAK'
        
        if (weeklyPrice > bb20.upper) {
          bb20Status = 'OVERBOUGHT'
          bb20Strength = (weeklyPrice - bb20.upper) / bb20.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
        } else if (weeklyPrice < bb20.lower) {
          bb20Status = 'OVERSOLD'
          bb20Strength = (bb20.lower - weeklyPrice) / bb20.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
        } else {
          bb20Status = 'NEUTRAL'
          bb20Strength = 'WEAK'
        }

        weeklyTechnicalConditions.push({
          id: 'weekly-bb20-position',
          label: 'Weekly BB 20-Position',
          status: bb20Status,
          strength: bb20Strength,
          description: `SPX: $${weeklyPrice.toFixed(2)} | ${bb20Position} | Upper: $${bb20.upper.toFixed(2)} | Middle: $${bb20.middle.toFixed(2)} | Lower: $${bb20.lower.toFixed(2)}`
        })
      }

      if (spxData.weeklyHistoricalPrices && spxData.weeklyHistoricalPrices.length >= 50) {
        const bb50 = TechnicalAnalysis.calculateBollingerBands(spxData.weeklyHistoricalPrices, 50)
        const bb50Position = weeklyPrice > bb50.upper ? 'Above Upper Band' :
                             weeklyPrice < bb50.lower ? 'Below Lower Band' : 'Between Bands'
        
        let bb50Status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
        let bb50Strength: 'STRONG' | 'MODERATE' | 'WEAK'
        
                 if (weeklyPrice > bb50.upper) {
           bb50Status = 'OVERBOUGHT'
           bb50Strength = (weeklyPrice - bb50.upper) / bb50.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
         } else if (weeklyPrice < bb50.lower) {
           bb50Status = 'OVERSOLD'
           bb50Strength = (bb50.lower - weeklyPrice) / bb50.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
         } else {
           bb50Status = 'NEUTRAL'
           bb50Strength = 'WEAK'
         }

        weeklyTechnicalConditions.push({
          id: 'weekly-bb50-position',
          label: 'Weekly BB 50-Position',
          status: bb50Status,
          strength: bb50Strength,
          description: `SPX: $${weeklyPrice.toFixed(2)} | ${bb50Position} | Upper: $${bb50.upper.toFixed(2)} | Middle: $${bb50.middle.toFixed(2)} | Lower: $${bb50.lower.toFixed(2)}`
        })
      }

      if (spxData.weeklyHistoricalPrices && spxData.weeklyHistoricalPrices.length >= 89) {
        const bb89 = TechnicalAnalysis.calculateBollingerBands(spxData.weeklyHistoricalPrices, 89)
        const bb89Position = weeklyPrice > bb89.upper ? 'Above Upper Band' :
                             weeklyPrice < bb89.lower ? 'Below Lower Band' : 'Between Bands'
        
        let bb89Status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
        let bb89Strength: 'STRONG' | 'MODERATE' | 'WEAK'
        
                 if (weeklyPrice > bb89.upper) {
           bb89Status = 'OVERBOUGHT'
           bb89Strength = (weeklyPrice - bb89.upper) / bb89.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
         } else if (weeklyPrice < bb89.lower) {
           bb89Status = 'OVERSOLD'
           bb89Strength = (bb89.lower - weeklyPrice) / bb89.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
         } else {
           bb89Status = 'NEUTRAL'
           bb89Strength = 'WEAK'
         }

        weeklyTechnicalConditions.push({
          id: 'weekly-bb89-position',
          label: 'Weekly BB 89-Position',
          status: bb89Status,
          strength: bb89Strength,
          description: `SPX: $${weeklyPrice.toFixed(2)} | ${bb89Position} | Upper: $${bb89.upper.toFixed(2)} | Middle: $${bb89.middle.toFixed(2)} | Lower: $${bb89.lower.toFixed(2)}`
        })
      }

      weeklyGroups.push({
        id: 'weekly-technical',
        title: 'Technical Analysis',
        description: 'Moving averages, RSI, and Bollinger Bands',
        conditions: weeklyTechnicalConditions
      })

      // Weekly Price Action Group (empty for now)
      weeklyGroups.push({
        id: 'weekly-price-action',
        title: 'Price Action',
        description: 'Weekly price patterns',
        conditions: []
      })

      // Weekly Momentum Group (empty for now)
      weeklyGroups.push({
        id: 'weekly-momentum',
        title: 'Momentum',
        description: 'Weekly momentum indicators',
        conditions: []
      })

      analyses.push({
        title: 'Weekly Analysis',
        description: 'Weekly timeframe analysis for SPX',
        groups: weeklyGroups
      })
    }

    // ===== MONTHLY ANALYSIS =====
    if (spxData.monthly && spxData.monthlySMA) {
      const monthlyGroups: ChecklistGroup[] = []
      const monthlyPrice = spxData.monthly.price
      const monthlySMA = spxData.monthlySMA

      // Monthly Technical Analysis Group
      const monthlyTechnicalConditions: ChecklistItem[] = [
                 {
           id: 'monthly-above-sma',
           label: 'Monthly Close > Monthly 89 SMA',
           status: monthlyPrice > monthlySMA ? 'BULLISH' : 'BEARISH',
           strength: Math.abs(monthlyPrice - monthlySMA) / monthlySMA > getSMAStrengthThreshold() ? 'STRONG' : 'MODERATE',
           description: `SPX: $${monthlyPrice.toFixed(2)} | 89 SMA: $${monthlySMA.toFixed(2)}`
         }
      ]

      // Add Monthly RSI if historical data is available
      if (spxData.monthlyHistoricalPrices && spxData.monthlyHistoricalPrices.length >= 15) {
        const monthlyRSI = TechnicalAnalysis.calculateRSI(spxData.monthlyHistoricalPrices, 14)
        const rsiThresholds = getRSIThresholds()
        let monthlyRsiStatus: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
        let monthlyRsiStrength: 'STRONG' | 'MODERATE' | 'WEAK'
        
        // Check if thresholds exist and are objects
        if (rsiThresholds.overbought && typeof rsiThresholds.overbought === 'object' && 'moderate' in rsiThresholds.overbought &&
            rsiThresholds.oversold && typeof rsiThresholds.oversold === 'object' && 'moderate' in rsiThresholds.oversold &&
            rsiThresholds.neutral && typeof rsiThresholds.neutral === 'object' && 'upper' in rsiThresholds.neutral) {
          const overbought = rsiThresholds.overbought as { strong: number; moderate: number; weak?: number }
          const oversold = rsiThresholds.oversold as { strong: number; moderate: number; weak?: number }
          const neutral = rsiThresholds.neutral as { upper: number; lower: number }
          
          if (monthlyRSI > overbought.moderate) {
            monthlyRsiStatus = 'OVERBOUGHT'
            monthlyRsiStrength = monthlyRSI > overbought.strong ? 'STRONG' : 'MODERATE'
          } else if (monthlyRSI < oversold.moderate) {
            monthlyRsiStatus = 'OVERSOLD'
            monthlyRsiStrength = monthlyRSI < oversold.strong ? 'STRONG' : 'MODERATE'
                     } else {
             monthlyRsiStatus = 'NEUTRAL'
             monthlyRsiStrength = 'WEAK'
           }
        } else {
          // Fallback to simple logic if thresholds are not properly configured
          if (monthlyRSI > 70) {
            monthlyRsiStatus = 'OVERBOUGHT'
            monthlyRsiStrength = monthlyRSI > 80 ? 'STRONG' : 'MODERATE'
          } else if (monthlyRSI < 30) {
            monthlyRsiStatus = 'OVERSOLD'
            monthlyRsiStrength = monthlyRSI < 20 ? 'STRONG' : 'MODERATE'
                     } else {
             monthlyRsiStatus = 'NEUTRAL'
             monthlyRsiStrength = 'WEAK'
           }
        }
        
        monthlyTechnicalConditions.push({
          id: 'monthly-rsi-above-50',
          label: 'Monthly RSI > 50',
          status: monthlyRsiStatus,
          strength: monthlyRsiStrength,
          description: `SPX: RSI ${monthlyRSI.toFixed(1)} | Threshold: 50`
        })
      }

                    // Add Monthly Bollinger Bands if historical data is available
       if (spxData.monthlyHistoricalPrices && spxData.monthlyHistoricalPrices.length >= 20) {
        const bb20 = TechnicalAnalysis.calculateBollingerBands(spxData.monthlyHistoricalPrices, 20)
        const bb20Position = monthlyPrice > bb20.upper ? 'Above Upper Band' :
                             monthlyPrice < bb20.lower ? 'Below Lower Band' : 'Between Bands'
        
        let bb20Status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
        let bb20Strength: 'STRONG' | 'MODERATE' | 'WEAK'
        
        if (monthlyPrice > bb20.upper) {
          bb20Status = 'OVERBOUGHT'
          bb20Strength = (monthlyPrice - bb20.upper) / bb20.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
        } else if (monthlyPrice < bb20.lower) {
          bb20Status = 'OVERSOLD'
          bb20Strength = (bb20.lower - monthlyPrice) / bb20.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
        } else {
          bb20Status = 'NEUTRAL'
          bb20Strength = 'WEAK'
        }

        monthlyTechnicalConditions.push({
          id: 'monthly-bb20-position',
          label: 'Monthly BB 20-Position',
          status: bb20Status,
          strength: bb20Strength,
          description: `SPX: $${monthlyPrice.toFixed(2)} | ${bb20Position} | Upper: $${bb20.upper.toFixed(2)} | Middle: $${bb20.middle.toFixed(2)} | Lower: $${bb20.lower.toFixed(2)}`
        })
      }

                    if (spxData.monthlyHistoricalPrices && spxData.monthlyHistoricalPrices.length >= 50) {
        const bb50 = TechnicalAnalysis.calculateBollingerBands(spxData.monthlyHistoricalPrices, 50)
        const bb50Position = monthlyPrice > bb50.upper ? 'Above Upper Band' :
                             monthlyPrice < bb50.lower ? 'Below Lower Band' : 'Between Bands'
        
        let bb50Status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
        let bb50Strength: 'STRONG' | 'MODERATE' | 'WEAK'
        
        if (monthlyPrice > bb50.upper) {
          bb50Status = 'OVERBOUGHT'
          bb50Strength = (monthlyPrice - bb50.upper) / bb50.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
        } else if (monthlyPrice < bb50.lower) {
          bb50Status = 'OVERSOLD'
          bb50Strength = (bb50.lower - monthlyPrice) / bb50.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
        } else {
          bb50Status = 'NEUTRAL'
          bb50Strength = 'WEAK'
        }

        monthlyTechnicalConditions.push({
          id: 'monthly-bb50-position',
          label: 'Monthly BB 50-Position',
          status: bb50Status,
          strength: bb50Strength,
          description: `SPX: $${monthlyPrice.toFixed(2)} | ${bb50Position} | Upper: $${bb50.upper.toFixed(2)} | Middle: $${bb50.middle.toFixed(2)} | Lower: $${bb50.lower.toFixed(2)}`
        })
      }

                    if (spxData.monthlyHistoricalPrices && spxData.monthlyHistoricalPrices.length >= 89) {
        const bb89 = TechnicalAnalysis.calculateBollingerBands(spxData.monthlyHistoricalPrices, 89)
        const bb89Position = monthlyPrice > bb89.upper ? 'Above Upper Band' :
                             monthlyPrice < bb89.lower ? 'Below Lower Band' : 'Between Bands'
        
        let bb89Status: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
        let bb89Strength: 'STRONG' | 'MODERATE' | 'WEAK'
        
        if (monthlyPrice > bb89.upper) {
          bb89Status = 'OVERBOUGHT'
          bb89Strength = (monthlyPrice - bb89.upper) / bb89.upper > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
        } else if (monthlyPrice < bb89.lower) {
          bb89Status = 'OVERSOLD'
          bb89Strength = (bb89.lower - monthlyPrice) / bb89.lower > getBollingerBandsStrengthThreshold() ? 'STRONG' : 'MODERATE'
        } else {
          bb89Status = 'NEUTRAL'
          bb89Strength = 'WEAK'
        }

        monthlyTechnicalConditions.push({
          id: 'monthly-bb89-position',
          label: 'Monthly BB 89-Position',
          status: bb89Status,
          strength: bb89Strength,
          description: `SPX: $${monthlyPrice.toFixed(2)} | ${bb89Position} | Upper: $${bb89.upper.toFixed(2)} | Middle: $${bb89.middle.toFixed(2)} | Lower: $${bb89.lower.toFixed(2)}`
        })
      }

      monthlyGroups.push({
        id: 'monthly-technical',
        title: 'Technical Analysis',
        description: 'Moving averages, RSI, and Bollinger Bands',
        conditions: monthlyTechnicalConditions
      })

      // Monthly Price Action Group (empty for now)
      monthlyGroups.push({
        id: 'monthly-price-action',
        title: 'Price Action',
        description: 'Monthly price patterns',
        conditions: []
      })

      // Monthly Momentum Group (empty for now)
      monthlyGroups.push({
        id: 'monthly-momentum',
        title: 'Momentum',
        description: 'Monthly momentum indicators',
        conditions: []
      })

      analyses.push({
        title: 'Monthly Analysis',
        description: 'Monthly timeframe analysis for SPX',
        groups: monthlyGroups
      })
    }

    return analyses
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const analyses = evaluateSPXConditions(marketData)
  const allConditions = analyses.flatMap(analysis => 
    analysis.groups.flatMap(group => group.conditions)
  )
  
  // Group conditions by timeframe - Completely rewritten logic
  const timeframeGroups = {
    'Monthly': [] as ChecklistItem[],
    'Weekly': [] as ChecklistItem[],
    'Daily': [] as ChecklistItem[],
    '2-Hour': [] as ChecklistItem[]
  }
  
  // Extract conditions from each analysis
  analyses.forEach(analysis => {
    if (analysis.groups) {
      const allConditions = analysis.groups.reduce((acc, group) => {
        if (group.conditions && group.conditions.length > 0) {
          acc.push(...group.conditions)
        }
        return acc
      }, [] as ChecklistItem[])
      
      // Map to correct timeframe
      if (analysis.title === 'Monthly Analysis') {
        timeframeGroups['Monthly'] = allConditions
      } else if (analysis.title === 'Weekly Analysis') {
        timeframeGroups['Weekly'] = allConditions
      } else if (analysis.title === 'Daily Analysis') {
        timeframeGroups['Daily'] = allConditions
      } else if (analysis.title === '2-Hour Analysis') {
        timeframeGroups['2-Hour'] = allConditions
      }
    }
  })
  
  // Debug logging
  console.log('Timeframe groups after extraction:')
  Object.entries(timeframeGroups).forEach(([timeframe, conditions]) => {
    console.log(`${timeframe}: ${conditions.length} conditions - ${conditions.map(c => c.id).join(', ')}`)
  })
  
  
  
         // Calculate overall totals by category
    const technicalConditions = allConditions.filter(c => 
      c.id.includes('sma') || c.id.includes('rsi') || c.id.includes('bb') || c.id.includes('macd')
    )
    
    const priceActionConditions = allConditions.filter(c => 
      c.id.includes('price') || c.id.includes('gap') || c.id.includes('yesterday')
    )
    
    // Technical subcategories
    const taDirectionalConditions = technicalConditions.filter(c => 
      c.id.includes('sma') || c.id.includes('macd') || c.id.includes('adx')
    )
    
    const taMomentumConditions = technicalConditions.filter(c => 
      c.id.includes('rsi') || c.id.includes('stoch') || c.id.includes('williams')
    )
    
    const taVolatilityConditions = technicalConditions.filter(c => 
      c.id.includes('bb') || c.id.includes('atr') || c.id.includes('keltner')
    )
    
    // Price Action is always directional
    const priceActionDirectionalConditions = priceActionConditions
    
    // Counts for each category
    const taDirectionalBullish = taDirectionalConditions.filter(c => c.status === 'BULLISH').length
    const taDirectionalBearish = taDirectionalConditions.filter(c => c.status === 'BEARISH').length
    const taDirectionalNeutral = taDirectionalConditions.filter(c => c.status === 'NEUTRAL').length
    
    const taMomentumOverbought = taMomentumConditions.filter(c => c.status === 'OVERBOUGHT').length
    const taMomentumOversold = taMomentumConditions.filter(c => c.status === 'OVERSOLD').length
    const taMomentumNeutral = taMomentumConditions.filter(c => c.status === 'NEUTRAL').length
    
    const taVolatilityOverbought = taVolatilityConditions.filter(c => c.status === 'OVERBOUGHT').length
    const taVolatilityOversold = taVolatilityConditions.filter(c => c.status === 'OVERSOLD').length
    const taVolatilityNeutral = taVolatilityConditions.filter(c => c.status === 'NEUTRAL').length
    
    const priceActionBullish = priceActionDirectionalConditions.filter(c => c.status === 'BULLISH').length
    const priceActionBearish = priceActionDirectionalConditions.filter(c => c.status === 'BEARISH').length
    const priceActionNeutral = priceActionDirectionalConditions.filter(c => c.status === 'NEUTRAL').length
    
    // Legacy totals for backward compatibility
    const bullishConditions = taDirectionalBullish + priceActionBullish
    const bearishConditions = taDirectionalBearish + priceActionBearish
    const neutralConditions = taDirectionalNeutral + priceActionNeutral
    const overboughtConditions = taMomentumOverbought + taVolatilityOverbought
    const oversoldConditions = taMomentumOversold + taVolatilityOversold
    
    const totalConditions = allConditions.length
    const metConditions = bullishConditions + neutralConditions
  
  // Calculate timeframe-specific stats with directional vs momentum separation
  const timeframeStats = Object.entries(timeframeGroups).map(([timeframe, conditions]) => {
    // Helper function to extract indicator name from condition ID
    const getIndicatorName = (id: string): string => {
      const parts = id.split('-')
      if (parts.includes('rsi')) return 'rsi'
      if (parts.includes('bb')) return 'bollingerBands'
      if (parts.includes('sma')) return 'sma'
      if (parts.includes('price')) return 'priceAction'
      if (parts.includes('gap')) return 'gapAnalysis'
      return 'unknown'
    }
    
         // Separate conditions by indicator type
     // Technical Indicators
     const technicalConditions = conditions.filter(c => 
       c.id.includes('sma') || c.id.includes('rsi') || c.id.includes('bb') || c.id.includes('macd')
     )
     
     // Price Action Indicators
     const priceActionConditions = conditions.filter(c => 
       c.id.includes('price') || c.id.includes('gap') || c.id.includes('yesterday')
     )
     
     // Technical subcategories
     const directionalConditions = technicalConditions.filter(c => 
       c.id.includes('sma') || c.id.includes('macd') || c.id.includes('adx')
     )
     
     const momentumConditions = technicalConditions.filter(c => 
       c.id.includes('rsi') || c.id.includes('stoch') || c.id.includes('williams')
     )
     
     const volatilityConditions = technicalConditions.filter(c => 
       c.id.includes('bb') || c.id.includes('atr') || c.id.includes('keltner')
     )
     
     // Price Action is always directional
     const priceActionDirectionalConditions = priceActionConditions
    
         // Technical Directional indicators (Bullish/Bearish/Neutral)
     const technicalDirectionalBullish = directionalConditions.filter(c => c.status === 'BULLISH').length
     const technicalDirectionalBearish = directionalConditions.filter(c => c.status === 'BEARISH').length
     const technicalDirectionalNeutral = directionalConditions.filter(c => c.status === 'NEUTRAL').length
     
     // Technical Momentum indicators (Overbought/Oversold/Neutral)
     const momentumOverbought = momentumConditions.filter(c => c.status === 'OVERBOUGHT').length
     const momentumOversold = momentumConditions.filter(c => c.status === 'OVERSOLD').length
     const momentumNeutral = momentumConditions.filter(c => c.status === 'NEUTRAL').length
     
     // Technical Volatility indicators
     const volatilityOverbought = volatilityConditions.filter(c => c.status === 'OVERBOUGHT').length
     const volatilityOversold = volatilityConditions.filter(c => c.status === 'OVERSOLD').length
     const volatilityNeutral = volatilityConditions.filter(c => c.status === 'NEUTRAL').length
     
     // Price Action Directional indicators
     const priceActionBullish = priceActionDirectionalConditions.filter(c => c.status === 'BULLISH').length
     const priceActionBearish = priceActionDirectionalConditions.filter(c => c.status === 'BEARISH').length
     const priceActionNeutral = priceActionDirectionalConditions.filter(c => c.status === 'NEUTRAL').length
     
     // Combined totals for backward compatibility
     const directionalBullish = technicalDirectionalBullish + priceActionBullish
     const directionalBearish = technicalDirectionalBearish + priceActionBearish
     const directionalNeutral = technicalDirectionalNeutral + priceActionNeutral
     

     

     

    

    
    // Overall counts (for backward compatibility)
    const bullish = conditions.filter(c => c.status === 'BULLISH').length
    const bearish = conditions.filter(c => c.status === 'BEARISH').length
    const neutral = conditions.filter(c => c.status === 'NEUTRAL').length
    const overbought = conditions.filter(c => c.status === 'OVERBOUGHT').length
    const oversold = conditions.filter(c => c.status === 'OVERSOLD').length
    const total = conditions.length
    const met = bullish + neutral
    
    // Directional bias (based on directional indicators only)
    let directionalBias = 'NEUTRAL'
    if (directionalBullish > directionalBearish) directionalBias = 'BULLISH'
    else if (directionalBearish > directionalBullish) directionalBias = 'BEARISH'
    
    // Momentum bias (based on momentum indicators only)
    let momentumBias = 'NEUTRAL'
    if (momentumOverbought > momentumOversold) momentumBias = 'OVERBOUGHT'
    else if (momentumOversold > momentumOverbought) momentumBias = 'OVERSOLD'
    
    // Overall bias (for backward compatibility)
    let bias = 'NEUTRAL'
    if (bullish > bearish) bias = 'BULLISH'
    else if (bearish > bullish) bias = 'BEARISH'
    
         return {
       timeframe,
       conditions,
       // Technical Indicators
       technicalConditions,
       directionalConditions,
       technicalDirectionalBullish,
       technicalDirectionalBearish,
       technicalDirectionalNeutral,
       momentumConditions,
       momentumOverbought,
       momentumOversold,
       momentumNeutral,
       volatilityConditions,
       volatilityOverbought,
       volatilityOversold,
       volatilityNeutral,
       // Price Action Indicators
       priceActionConditions,
       priceActionDirectionalConditions,
       priceActionBullish,
       priceActionBearish,
       priceActionNeutral,
       // Combined totals (for backward compatibility)
       directionalBullish,
       directionalBearish,
       directionalNeutral,
       directionalBias,
       momentumBias,
       bullish,
       bearish,
       neutral,
       overbought,
       oversold,
       total,
       met,
       bias
     }
  })

  // Filter conditions based on status
  const filterConditions = (conditions: ChecklistItem[]) => {
    switch (filterStatus) {
      case 'met':
        return conditions.filter(c => c.status === 'BULLISH' || c.status === 'NEUTRAL')
      case 'not-met':
        return conditions.filter(c => c.status === 'BEARISH' || c.status === 'OVERBOUGHT' || c.status === 'OVERSOLD')
      default:
        return conditions
    }
  }

  // Sort conditions
  const sortConditions = (conditions: ChecklistItem[]) => {
    switch (sortBy) {
      case 'status':
        return [...conditions].sort((a, b) => {
          if (a.status === b.status) return a.label.localeCompare(b.label)
          const statusOrder = { 'BULLISH': 0, 'NEUTRAL': 1, 'BEARISH': 2, 'OVERBOUGHT': 3, 'OVERSOLD': 4 }
          return statusOrder[a.status] - statusOrder[b.status]
        })
      case 'alphabetical':
        return [...conditions].sort((a, b) => a.label.localeCompare(b.label))
      default:
        return conditions
    }
  }

  if (analyses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">SPX Trading Checklist</h2>
              <p className="text-gray-600">
                Multi-timeframe condition evaluation for SPX
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No SPX Data</h3>
              <p className="text-gray-600">SPX data not available for condition evaluation.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

         return (
     <div className="space-y-6">

                 {/* Overall Status Card */}
         <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center space-x-4">
               <div>
                 <h3 className="text-xl font-bold text-gray-900">Overall SPX Status</h3>
                 <p className="text-sm text-gray-600">
                   {metConditions}/{totalConditions} conditions met across all timeframes
                 </p>
                 <p className="text-sm text-gray-500 mt-1">
                   Last updated: {new Date().toLocaleTimeString()}
                 </p>
               </div>
               <div className="text-right">
                 <div className="text-2xl font-bold text-blue-800">
                   {marketData.find(d => d.symbol === 'SPX')?.daily ? 
                     formatCurrency(marketData.find(d => d.symbol === 'SPX')!.daily!.price) : 
                     'N/A'
                   }
                 </div>
                 <div className="text-xs text-gray-500">Current Price</div>
               </div>
             </div>
                     <div className="text-right">
                         <div className={`text-2xl font-bold ${
               bullishConditions > bearishConditions ? 'text-green-600' :
               bearishConditions > bullishConditions ? 'text-red-600' : 'text-yellow-600'
             }`}>
               {bullishConditions > bearishConditions ? 'BULLISH BIAS' :
                bearishConditions > bullishConditions ? 'BEARISH BIAS' : 'NEUTRAL BIAS'}
             </div>
                           <div className="text-sm text-gray-500 mt-1">
                <div className="font-medium text-gray-700">TA Directional ({taDirectionalConditions.length} total):</div>
                <div className="text-xs">
                  {taDirectionalBullish} Bullish • {taDirectionalBearish} Bearish • {taDirectionalNeutral} Neutral
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                <div className="font-medium text-gray-700">TA Momentum ({taMomentumConditions.length} total):</div>
                <div className="text-xs">
                  {taMomentumOverbought} Overbought • {taMomentumOversold} Oversold • {taMomentumNeutral} Neutral
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                <div className="font-medium text-gray-700">TA Volatility ({taVolatilityConditions.length} total):</div>
                <div className="text-xs">
                  {taVolatilityOverbought} Overbought • {taVolatilityOversold} Oversold • {taVolatilityNeutral} Neutral
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                <div className="font-medium text-gray-700">Price Action ({priceActionDirectionalConditions.length} total):</div>
                <div className="text-xs">
                  {priceActionBullish} Bullish • {priceActionBearish} Bearish • {priceActionNeutral} Neutral
                </div>
              </div>
          </div>
         </div>
         
         {/* Progress Bar */}
         <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
           <div 
             className={`h-2 rounded-full transition-all duration-300 ${
               metConditions === totalConditions ? 'bg-green-500' :
               metConditions > totalConditions / 2 ? 'bg-yellow-500' : 'bg-red-500'
             }`}
             style={{ width: `${(metConditions / totalConditions) * 100}%` }}
           ></div>
         </div>
         
                   {/* Timeframe Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {timeframeStats.map((stats) => (
              <div key={stats.timeframe} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">{stats.timeframe}</h4>
                  <div className="flex flex-col items-end space-y-1">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stats.directionalBias === 'BULLISH' ? 'bg-green-100 text-green-800' :
                      stats.directionalBias === 'BEARISH' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {stats.directionalBias}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stats.momentumBias === 'OVERBOUGHT' ? 'bg-orange-100 text-orange-800' :
                      stats.momentumBias === 'OVERSOLD' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {stats.momentumBias}
                    </div>
                  </div>
                </div>
                
                                 {/* Directional Indicators */}
                 <div className="text-xs text-gray-600 space-y-1 mb-2">
                   <div className="font-medium text-gray-800">Directional ({stats.directionalBullish + stats.directionalBearish + stats.directionalNeutral} total):</div>
                   <div className="flex justify-between">
                     <span>Bullish:</span>
                     <span className="text-green-600 font-medium">{stats.directionalBullish}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Bearish:</span>
                     <span className="text-red-600 font-medium">{stats.directionalBearish}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Neutral:</span>
                     <span className="text-blue-600 font-medium">{stats.directionalNeutral}</span>
                   </div>
                 </div>
                 
                 {/* Momentum Indicators */}
                 <div className="text-xs text-gray-600 space-y-1">
                   <div className="font-medium text-gray-800">Momentum ({stats.momentumOverbought + stats.momentumOversold + stats.momentumNeutral} total):</div>
                   <div className="flex justify-between">
                     <span>Overbought:</span>
                     <span className="text-orange-600 font-medium">{stats.momentumOverbought}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Oversold:</span>
                     <span className="text-purple-600 font-medium">{stats.momentumOversold}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Neutral:</span>
                     <span className="text-blue-600 font-medium">{stats.momentumNeutral}</span>
                   </div>
                 </div>
              </div>
            ))}
          </div>
       </div>

      {/* Controls */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Analysis Controls</h3>
          <div className="flex items-center space-x-4">
            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'met' | 'not-met')}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
              >
                <option value="all">All Conditions</option>
                <option value="met">Met Only</option>
                <option value="not-met">Not Met Only</option>
              </select>
            </div>
            
            {/* Sort */}
            <div className="flex items-center space-x-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'default' | 'status' | 'alphabetical')}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
              >
                <option value="default">Default Order</option>
                <option value="status">Sort by Status</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="space-y-6">
        {analyses.map((analysis) => {
          const sectionId = analysis.title.toLowerCase().replace(/\s+/g, '-')
          const isExpanded = expandedSections.has(sectionId)
                     const sectionConditions = analysis.groups.flatMap(group => group.conditions)
           const sectionMetConditions = sectionConditions.filter(c => c.status === 'BULLISH' || c.status === 'NEUTRAL').length
          
          return (
            <div key={analysis.title} className="card">
              {/* Section Header */}
              <div 
                className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg border"
                onClick={() => toggleSection(sectionId)}
              >
                <div className="flex items-center space-x-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{analysis.title}</h4>
                    <p className="text-sm text-gray-600">{analysis.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {sectionMetConditions}/{sectionConditions.length}
                  </div>
                  <div className="text-sm text-gray-500">conditions met</div>
                </div>
              </div>
              
              {/* Section Content */}
              {isExpanded && (
                <div className="mt-4 space-y-4">
                  {analysis.groups.map((group) => {
                    const filteredConditions = filterConditions(group.conditions)
                    const sortedConditions = sortConditions(filteredConditions)
                    
                    return (
                      <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-4">
                          <h5 className="text-lg font-semibold text-gray-900">{group.title}</h5>
                          <p className="text-sm text-gray-600">{group.description}</p>
                        </div>
                        
                        {sortedConditions.length === 0 ? (
                          <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">
                              {group.conditions.length === 0 
                                ? 'No conditions defined yet' 
                                : 'No conditions match the current filter'
                              }
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                                                         {/* Directional Indicators */}
                             {(() => {
                               const directionalConditions = sortedConditions.filter(c => 
                                 (c.status === 'BULLISH' || c.status === 'BEARISH' || c.status === 'NEUTRAL') &&
                                 !c.id.includes('rsi')
                               )
                               if (directionalConditions.length > 0) {
                                 return (
                                   <div className="border-l-4 border-green-500 pl-4 bg-green-50 rounded-r-lg p-3 mb-4">
                                     <div className="flex items-center mb-3">
                                       <div className="flex-1">
                                         <h6 className="text-sm font-semibold text-gray-800">📈 Directional Indicators ({directionalConditions.length} total)</h6>
                                         <p className="text-xs text-gray-500">Trend and price direction analysis</p>
                                       </div>
                                       <div className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded">
                                         {directionalConditions.length} condition{directionalConditions.length !== 1 ? 's' : ''}
                                       </div>
                                     </div>
                                    <div className="space-y-2">
                                      {directionalConditions.map((condition) => (
                                        <div 
                                          key={condition.id} 
                                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                                            condition.status === 'BULLISH' || condition.status === 'NEUTRAL'
                                              ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                                              : 'bg-red-50 border-red-200 hover:bg-red-100'
                                          }`}
                                        >
                                          {condition.status === 'BULLISH' || condition.status === 'NEUTRAL' ? (
                                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                          ) : (
                                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                          )}
                                          <div className="flex-1">
                                            <div className={`text-sm font-medium ${
                                              condition.status === 'BULLISH' || condition.status === 'NEUTRAL' ? 'text-green-800' : 'text-red-800'
                                            }`}>
                                              {condition.label}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1 font-mono">
                                              {condition.description}
                                            </div>
                                          </div>
                                          <div className="flex flex-col items-end space-y-1">
                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              condition.status === 'BULLISH' ? 'bg-green-100 text-green-800' :
                                              condition.status === 'NEUTRAL' ? 'bg-blue-100 text-blue-800' :
                                              'bg-red-100 text-red-800'
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
                              }
                              return null
                            })()}

                                                         {/* Momentum Indicators */}
                             {(() => {
                               const momentumConditions = sortedConditions.filter(c => 
                                 c.status === 'OVERBOUGHT' || c.status === 'OVERSOLD' || 
                                 (c.status === 'NEUTRAL' && c.id.includes('rsi'))
                               )
                               if (momentumConditions.length > 0) {
                                 return (
                                   <div className="border-l-4 border-orange-500 pl-4 bg-orange-50 rounded-r-lg p-3">
                                     <div className="flex items-center mb-3">
                                       <div className="flex-1">
                                         <h6 className="text-sm font-semibold text-gray-800">⚡ Momentum Indicators ({momentumConditions.length} total)</h6>
                                         <p className="text-xs text-gray-500">Overbought/oversold conditions</p>
                                       </div>
                                       <div className="text-xs text-gray-500 bg-orange-100 px-2 py-1 rounded">
                                         {momentumConditions.length} condition{momentumConditions.length !== 1 ? 's' : ''}
                                       </div>
                                     </div>
                                    <div className="space-y-2">
                                      {momentumConditions.map((condition) => (
                                                                                 <div 
                                           key={condition.id} 
                                           className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                                             condition.status === 'OVERSOLD'
                                               ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' 
                                               : condition.status === 'NEUTRAL'
                                               ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                               : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                                           }`}
                                         >
                                           {condition.status === 'OVERSOLD' ? (
                                             <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                           ) : condition.status === 'NEUTRAL' ? (
                                             <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                           ) : (
                                             <XCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                           )}
                                                                                     <div className="flex-1">
                                             <div className={`text-sm font-medium ${
                                               condition.status === 'OVERSOLD' ? 'text-purple-800' : 
                                               condition.status === 'NEUTRAL' ? 'text-blue-800' : 'text-orange-800'
                                             }`}>
                                              {condition.label}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1 font-mono">
                                              {condition.description}
                                            </div>
                                          </div>
                                                                                     <div className="flex flex-col items-end space-y-1">
                                             <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                               condition.status === 'OVERBOUGHT' ? 'bg-orange-100 text-orange-800' :
                                               condition.status === 'NEUTRAL' ? 'bg-blue-100 text-blue-800' :
                                               'bg-purple-100 text-purple-800'
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
                              }
                              return null
                            })()}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
                 })}
       </div>
     </div>
   )
 }
