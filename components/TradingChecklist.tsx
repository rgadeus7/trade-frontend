'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Filter, BarChart3 } from 'lucide-react'
import { TechnicalAnalysis } from '../lib/technicalAnalysis'
import { 
  getSMAStrengthThreshold, 
  getRSIThresholds, 
  getBollingerBandsStrengthThreshold, 
  getPriceActionStrengthThreshold, 
  getGapAnalysisStrengthThreshold 
} from '../config/trading-config'

interface MarketData {
  symbol: string
  instrumentType: 'SPY' | 'SPX' | 'ES' | 'VIX'
  daily: {
    price: number
    change: number
    volume: number
    timestamp: string
  } | null
  hourly: {
    price: number
    change: number
    volume: number
    timestamp: string
  } | null
  weekly: {
    price: number
    change: number
    volume: number
    timestamp: string
  } | null
  monthly: {
    price: number
    change: number
    volume: number
    timestamp: string
  } | null
  yesterday: {
    close: number
    high: number
    low: number
    volume: number
    timestamp: string
  } | null
  sma89: number
  ema89: number
  sma2h: number
  weeklySMA: number
  monthlySMA: number
  dailyHistoricalPrices?: number[]
  hourlyHistoricalPrices?: number[]
  weeklyHistoricalPrices?: number[]
  monthlyHistoricalPrices?: number[]
}

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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['daily-analysis', '2h-analysis', 'weekly-analysis', 'monthly-analysis']))
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
      
      if (dailyRSI > rsiThresholds.overbought.moderate) {
        rsiStatus = 'OVERBOUGHT'
        rsiStrength = dailyRSI > rsiThresholds.overbought.strong ? 'STRONG' : 'MODERATE'
      } else if (dailyRSI < rsiThresholds.oversold.moderate) {
        rsiStatus = 'OVERSOLD'
        rsiStrength = dailyRSI < rsiThresholds.oversold.strong ? 'STRONG' : 'MODERATE'
      } else if (dailyRSI > rsiThresholds.bullish.moderate) {
        rsiStatus = 'BULLISH'
        rsiStrength = dailyRSI > rsiThresholds.bullish.strong ? 'STRONG' : 'MODERATE'
      } else {
        rsiStatus = 'BEARISH'
        rsiStrength = dailyRSI < rsiThresholds.bearish.strong ? 'STRONG' : 'MODERATE'
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
      
      if (hourlyRSI > rsiThresholds.overbought.moderate) {
        hourlyRsiStatus = 'OVERBOUGHT'
        hourlyRsiStrength = hourlyRSI > rsiThresholds.overbought.strong ? 'STRONG' : 'MODERATE'
      } else if (hourlyRSI < rsiThresholds.oversold.moderate) {
        hourlyRsiStatus = 'OVERSOLD'
        hourlyRsiStrength = hourlyRSI < rsiThresholds.oversold.strong ? 'STRONG' : 'MODERATE'
      } else if (hourlyRSI > rsiThresholds.bullish.moderate) {
        hourlyRsiStatus = 'BULLISH'
        hourlyRsiStrength = hourlyRSI > rsiThresholds.bullish.strong ? 'STRONG' : 'MODERATE'
      } else {
        hourlyRsiStatus = 'BEARISH'
        hourlyRsiStrength = hourlyRSI < rsiThresholds.bearish.strong ? 'STRONG' : 'MODERATE'
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
        
        if (weeklyRSI > rsiThresholds.overbought.moderate) {
          weeklyRsiStatus = 'OVERBOUGHT'
          weeklyRsiStrength = weeklyRSI > rsiThresholds.overbought.strong ? 'STRONG' : 'MODERATE'
        } else if (weeklyRSI < rsiThresholds.oversold.moderate) {
          weeklyRsiStatus = 'OVERSOLD'
          weeklyRsiStrength = weeklyRSI < rsiThresholds.oversold.strong ? 'STRONG' : 'MODERATE'
        } else if (weeklyRSI > rsiThresholds.bullish.moderate) {
          weeklyRsiStatus = 'BULLISH'
          weeklyRsiStrength = weeklyRSI > rsiThresholds.bullish.strong ? 'STRONG' : 'MODERATE'
        } else {
          weeklyRsiStatus = 'BEARISH'
          weeklyRsiStrength = weeklyRSI < rsiThresholds.bearish.strong ? 'STRONG' : 'MODERATE'
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
          bb20Strength = (weeklyPrice - bb20.upper) / bb20.upper > 0.01 ? 'STRONG' : 'MODERATE'
        } else if (weeklyPrice < bb20.lower) {
          bb20Status = 'OVERSOLD'
          bb20Strength = (bb20.lower - weeklyPrice) / bb20.lower > 0.01 ? 'STRONG' : 'MODERATE'
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
          bb50Strength = (weeklyPrice - bb50.upper) / bb50.upper > 0.01 ? 'STRONG' : 'MODERATE'
        } else if (weeklyPrice < bb50.lower) {
          bb50Status = 'OVERSOLD'
          bb50Strength = (bb50.lower - weeklyPrice) / bb50.lower > 0.01 ? 'STRONG' : 'MODERATE'
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
          bb89Strength = (weeklyPrice - bb89.upper) / bb89.upper > 0.01 ? 'STRONG' : 'MODERATE'
        } else if (weeklyPrice < bb89.lower) {
          bb89Status = 'OVERSOLD'
          bb89Strength = (bb89.lower - weeklyPrice) / bb89.lower > 0.01 ? 'STRONG' : 'MODERATE'
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
          strength: Math.abs(monthlyPrice - monthlySMA) / monthlySMA > 0.02 ? 'STRONG' : 'MODERATE',
          description: `SPX: $${monthlyPrice.toFixed(2)} | 89 SMA: $${monthlySMA.toFixed(2)}`
        }
      ]

      // Add Monthly RSI if historical data is available
      if (spxData.monthlyHistoricalPrices && spxData.monthlyHistoricalPrices.length >= 15) {
        const monthlyRSI = TechnicalAnalysis.calculateRSI(spxData.monthlyHistoricalPrices, 14)
        let monthlyRsiStatus: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'OVERBOUGHT' | 'OVERSOLD'
        let monthlyRsiStrength: 'STRONG' | 'MODERATE' | 'WEAK'
        
        if (monthlyRSI > 70) {
          monthlyRsiStatus = 'OVERBOUGHT'
          monthlyRsiStrength = monthlyRSI > 80 ? 'STRONG' : 'MODERATE'
        } else if (monthlyRSI < 30) {
          monthlyRsiStatus = 'OVERSOLD'
          monthlyRsiStrength = monthlyRSI < 20 ? 'STRONG' : 'MODERATE'
        } else if (monthlyRSI > 50) {
          monthlyRsiStatus = 'BULLISH'
          monthlyRsiStrength = monthlyRSI > 60 ? 'STRONG' : 'MODERATE'
        } else {
          monthlyRsiStatus = 'BEARISH'
          monthlyRsiStrength = monthlyRSI < 40 ? 'STRONG' : 'MODERATE'
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
          bb20Strength = (monthlyPrice - bb20.upper) / bb20.upper > 0.01 ? 'STRONG' : 'MODERATE'
        } else if (monthlyPrice < bb20.lower) {
          bb20Status = 'OVERSOLD'
          bb20Strength = (bb20.lower - monthlyPrice) / bb20.lower > 0.01 ? 'STRONG' : 'MODERATE'
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
          bb50Strength = (monthlyPrice - bb50.upper) / bb50.upper > 0.01 ? 'STRONG' : 'MODERATE'
        } else if (monthlyPrice < bb50.lower) {
          bb50Status = 'OVERSOLD'
          bb50Strength = (bb50.lower - monthlyPrice) / bb50.lower > 0.01 ? 'STRONG' : 'MODERATE'
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
          bb89Strength = (monthlyPrice - bb89.upper) / bb89.upper > 0.01 ? 'STRONG' : 'MODERATE'
        } else if (monthlyPrice < bb89.lower) {
          bb89Status = 'OVERSOLD'
          bb89Strength = (bb89.lower - monthlyPrice) / bb89.lower > 0.01 ? 'STRONG' : 'MODERATE'
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
  
  // Group conditions by timeframe
  const timeframeGroups = {
    'Monthly': analyses.find(a => a.title === 'Monthly Analysis')?.groups.flatMap(g => g.conditions) || [],
    'Weekly': analyses.find(a => a.title === 'Weekly Analysis')?.groups.flatMap(g => g.conditions) || [],
    'Daily': analyses.find(a => a.title === 'Daily Analysis')?.groups.flatMap(g => g.conditions) || [],
    '2-Hour': analyses.find(a => a.title === '2-Hour Analysis')?.groups.flatMap(g => g.conditions) || []
  }
  
  // Calculate overall totals
  const bullishConditions = allConditions.filter(c => c.status === 'BULLISH').length
  const bearishConditions = allConditions.filter(c => c.status === 'BEARISH').length
  const neutralConditions = allConditions.filter(c => c.status === 'NEUTRAL').length
  const overboughtConditions = allConditions.filter(c => c.status === 'OVERBOUGHT').length
  const oversoldConditions = allConditions.filter(c => c.status === 'OVERSOLD').length
  const totalConditions = allConditions.length
  
  // Calculate met conditions (BULLISH and NEUTRAL are considered "met")
  const metConditions = bullishConditions + neutralConditions
  
  // Calculate timeframe-specific stats
  const timeframeStats = Object.entries(timeframeGroups).map(([timeframe, conditions]) => {
    const bullish = conditions.filter(c => c.status === 'BULLISH').length
    const bearish = conditions.filter(c => c.status === 'BEARISH').length
    const neutral = conditions.filter(c => c.status === 'NEUTRAL').length
    const overbought = conditions.filter(c => c.status === 'OVERBOUGHT').length
    const oversold = conditions.filter(c => c.status === 'OVERSOLD').length
    const total = conditions.length
    const met = bullish + neutral
    
    let bias = 'NEUTRAL'
    if (bullish > bearish) bias = 'BULLISH'
    else if (bearish > bullish) bias = 'BEARISH'
    
    return {
      timeframe,
      conditions,
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
             {/* Header */}
       <div className="card">
         <div className="flex items-center justify-between mb-6">
           <div className="flex items-center space-x-3">
             <BarChart3 className="h-8 w-8 text-blue-600" />
             <div>
               <h2 className="text-2xl font-bold text-gray-900">SPX Trading Checklist</h2>
               <p className="text-gray-600">
                 Multi-timeframe condition evaluation for SPX
               </p>
             </div>
           </div>
           <div className="flex items-center space-x-2">
             <div className="flex items-center space-x-1">
               <CheckCircle className="h-4 w-4 text-green-600" />
               <span className="text-sm text-green-600">Condition Met</span>
             </div>
             <div className="flex items-center space-x-1">
               <XCircle className="h-4 w-4 text-red-600" />
               <span className="text-sm text-red-600">Condition Not Met</span>
             </div>
           </div>
         </div>
       </div>

       {/* SPX Current Price */}
       <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
         <div className="flex items-center justify-between">
           <div>
             <h3 className="text-lg font-semibold text-gray-900">SPX Current Price</h3>
             <div className="text-sm text-gray-500">
               Last updated: {new Date().toLocaleTimeString()}
             </div>
           </div>
           <div className="text-2xl font-bold text-purple-800">
             {marketData.find(d => d.symbol === 'SPX')?.daily ? 
               formatCurrency(marketData.find(d => d.symbol === 'SPX')!.daily!.price) : 
               'N/A'
             }
           </div>
         </div>
       </div>

       {/* Overall Status Card */}
       <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
         <div className="flex items-center justify-between mb-4">
           <div>
             <h3 className="text-xl font-bold text-gray-900">Overall SPX Status</h3>
             <p className="text-sm text-gray-600">
               {metConditions}/{totalConditions} conditions met across all timeframes
             </p>
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
               {bullishConditions} Bullish • {bearishConditions} Bearish • {neutralConditions} Neutral
             </div>
             <div className="text-xs text-gray-400 mt-1">
               {overboughtConditions} Overbought • {oversoldConditions} Oversold
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
                 <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                   stats.bias === 'BULLISH' ? 'bg-green-100 text-green-800' :
                   stats.bias === 'BEARISH' ? 'bg-red-100 text-red-800' :
                   'bg-gray-100 text-gray-800'
                 }`}>
                   {stats.bias}
                 </div>
               </div>
               <div className="text-xs text-gray-600 space-y-1">
                 <div className="flex justify-between">
                   <span>Met:</span>
                   <span className="font-medium">{stats.met}/{stats.total}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Bullish:</span>
                   <span className="text-green-600 font-medium">{stats.bullish}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Bearish:</span>
                   <span className="text-red-600 font-medium">{stats.bearish}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Neutral:</span>
                   <span className="text-blue-600 font-medium">{stats.neutral}</span>
                 </div>
                 {stats.overbought > 0 && (
                   <div className="flex justify-between">
                     <span>Overbought:</span>
                     <span className="text-orange-600 font-medium">{stats.overbought}</span>
                   </div>
                 )}
                 {stats.oversold > 0 && (
                   <div className="flex justify-between">
                     <span>Oversold:</span>
                     <span className="text-purple-600 font-medium">{stats.oversold}</span>
                   </div>
                 )}
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
                          <div className="space-y-2">
                            {sortedConditions.map((condition) => (
                                                             <div 
                                 key={condition.id} 
                                 className={`flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200 ${
                                   condition.status === 'BULLISH' || condition.status === 'NEUTRAL'
                                     ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                                     : 'bg-red-50 border-red-200 hover:bg-red-100'
                                 }`}
                               >
                                 {condition.status === 'BULLISH' || condition.status === 'NEUTRAL' ? (
                                   <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                 ) : (
                                   <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
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
                                      condition.status === 'BEARISH' ? 'bg-red-100 text-red-800' :
                                      condition.status === 'OVERBOUGHT' ? 'bg-orange-100 text-orange-800' :
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
