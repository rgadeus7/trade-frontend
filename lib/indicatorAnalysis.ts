import { Engine } from 'json-rules-engine'
import { TechnicalAnalysis } from './technicalAnalysis'
import { 
  getConfig, 
  getIndicator, 
  getIndicatorType, 
  getCategoryByIndicator,
  getStatusValuesByCategory,
  getBuyConditions,
  getSellConditions,
  getNeutralConditions,
  getTimeframeWeight
} from '../config/trading-config'

export interface IndicatorResult {
  indicator: string
  category: string
  subcategory: string
  status: string
  strength: 'STRONG' | 'MODERATE' | 'WEAK'
  value: number
  description: string
  configurable: any
}

export interface CategoryAnalysis {
  category: string
  results: IndicatorResult[]
  summary: {
    bullish: number
    bearish: number
    neutral: number
    overbought: number
    oversold: number
    dominantSignal: string
  }
}

export interface SignalAnalysis {
  overallSignal: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL'
  confidence: number
  reasoning: string[]
  categorySignals: CategoryAnalysis[]
  timeframeAnalysis: {
    [timeframe: string]: {
      weight: number
      signal: string
      confidence: number
    }
  }
}

export class IndicatorAnalysisService {
  private engine: Engine
  private config = getConfig()

  constructor() {
    this.engine = new Engine()
    this.setupRules()
  }

  private setupRules() {
    // Buy Signal Rules
    this.engine.addRule({
      conditions: {
        all: [
          {
            fact: 'trendBullishCount',
            operator: 'greaterThan',
            value: 2
          },
          {
            fact: 'momentumOversoldCount',
            operator: 'greaterThan',
            value: 0
          },
          {
            fact: 'volumeConfirmation',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: 'strong-buy',
        params: {
          message: 'Strong buy signal: Trend bullish, momentum oversold, volume confirms'
        }
      }
    })

    this.engine.addRule({
      conditions: {
        all: [
          {
            fact: 'trendBullishCount',
            operator: 'greaterThan',
            value: 1
          },
          {
            fact: 'momentumNeutralCount',
            operator: 'greaterThan',
            value: 0
          }
        ]
      },
      event: {
        type: 'buy',
        params: {
          message: 'Buy signal: Trend bullish, momentum neutral'
        }
      }
    })

    // Sell Signal Rules
    this.engine.addRule({
      conditions: {
        all: [
          {
            fact: 'trendBearishCount',
            operator: 'greaterThan',
            value: 2
          },
          {
            fact: 'momentumOverboughtCount',
            operator: 'greaterThan',
            value: 0
          },
          {
            fact: 'volumeConfirmation',
            operator: 'equal',
            value: true
          }
        ]
      },
      event: {
        type: 'strong-sell',
        params: {
          message: 'Strong sell signal: Trend bearish, momentum overbought, volume confirms'
        }
      }
    })

    this.engine.addRule({
      conditions: {
        all: [
          {
            fact: 'trendBearishCount',
            operator: 'greaterThan',
            value: 1
          },
          {
            fact: 'momentumNeutralCount',
            operator: 'greaterThan',
            value: 0
          }
        ]
      },
      event: {
        type: 'sell',
        params: {
          message: 'Sell signal: Trend bearish, momentum neutral'
        }
      }
    })

    // Hold Signal Rules
    this.engine.addRule({
      conditions: {
        any: [
          {
            all: [
              {
                fact: 'trendNeutralCount',
                operator: 'greaterThan',
                value: 2
              }
            ]
          },
          {
            all: [
              {
                fact: 'conflictingSignals',
                operator: 'equal',
                value: true
              }
            ]
          }
        ]
      },
      event: {
        type: 'hold',
        params: {
          message: 'Hold signal: Mixed or neutral signals'
        }
      }
    })
  }

  public async analyzeIndicators(marketData: any, timeframe: string = 'daily'): Promise<SignalAnalysis> {
    const categoryResults = this.calculateAllIndicators(marketData, timeframe)
    const facts = this.buildFacts(categoryResults)
    
    const { events } = await this.engine.run(facts)
    return this.generateSignalAnalysis(events, categoryResults, timeframe)
  }

  private calculateAllIndicators(marketData: any, timeframe: string): CategoryAnalysis[] {
    const categories = Object.keys(this.config.indicatorCategories)
    const results: CategoryAnalysis[] = []

    for (const category of categories) {
      const categoryConfig = this.config.indicatorCategories[category as keyof typeof this.config.indicatorCategories]
      const categoryResults: IndicatorResult[] = []

      // Handle new config structure with subcategories
      const subcategories = Object.keys(categoryConfig.subcategories)
      for (const subcategory of subcategories) {
        const subcategoryConfig = categoryConfig.subcategories[subcategory]
        for (const indicatorName of subcategoryConfig.indicators) {
          const result = this.calculateIndicator(indicatorName, marketData, timeframe)
          if (result) {
            categoryResults.push(result)
          }
        }
      }

      results.push({
        category,
        results: categoryResults,
        summary: this.summarizeCategory(categoryResults, category)
      })
    }

    return results
  }

  private calculateIndicator(indicatorName: string, marketData: any, timeframe: string): IndicatorResult | null {
    const indicatorConfig = getIndicator(indicatorName)
    if (!indicatorConfig) return null

    const category = getCategoryByIndicator(indicatorName)
    if (!category) return null

    let value = 0
    let status = 'NEUTRAL'
    let strength: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK'
    let description = ''

    switch (indicatorName) {
      case 'sma':
        const smaResult = this.calculateSMA(marketData, indicatorConfig)
        value = smaResult.value
        status = smaResult.status
        strength = smaResult.strength
        description = smaResult.description
        break

      case 'rsi':
        const rsiResult = this.calculateRSI(marketData, indicatorConfig)
        value = rsiResult.value
        status = rsiResult.status
        strength = rsiResult.strength
        description = rsiResult.description
        break

      case 'bollingerBands':
        const bbResult = this.calculateBollingerBands(marketData, indicatorConfig)
        value = bbResult.value
        status = bbResult.status
        strength = bbResult.strength
        description = bbResult.description
        break

      case 'macd':
        const macdResult = this.calculateMACD(marketData, indicatorConfig)
        value = macdResult.value
        status = macdResult.status
        strength = macdResult.strength
        description = macdResult.description
        break

      case 'volumeSma':
        const volumeResult = this.calculateVolumeSMA(marketData, indicatorConfig)
        value = volumeResult.value
        status = volumeResult.status
        strength = volumeResult.strength
        description = volumeResult.description
        break

      default:
        return null
    }

    return {
      indicator: indicatorName,
      category: category.category,
      subcategory: category.subcategory,
      status,
      strength,
      value,
      description,
      configurable: indicatorConfig.configurable
    }
  }

  private calculateSMA(marketData: any, config: any) {
    const currentPrice = marketData.currentPrice || marketData.close
    const smaValue = marketData.sma89 || 0
    const deviation = Math.abs(currentPrice - smaValue) / smaValue
    
    let status = 'NEUTRAL'
    let strength: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK'
    
    if (currentPrice > smaValue) {
      status = 'BULLISH'
      strength = deviation > config.strengthThreshold ? 'STRONG' : 'MODERATE'
    } else if (currentPrice < smaValue) {
      status = 'BEARISH'
      strength = deviation > config.strengthThreshold ? 'STRONG' : 'MODERATE'
    }

    return {
      value: smaValue,
      status,
      strength,
      description: `Price: $${currentPrice.toFixed(2)} | SMA: $${smaValue.toFixed(2)} | Status: ${status}`
    }
  }

  private calculateRSI(marketData: any, config: any) {
    const rsiValue = marketData.rsi || 50
    const thresholds = config.configurable
    
    let status = 'NEUTRAL'
    let strength: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK'
    
    if (rsiValue > thresholds.overbought.moderate) {
      status = 'OVERBOUGHT'
      strength = rsiValue > thresholds.overbought.strong ? 'STRONG' : 'MODERATE'
    } else if (rsiValue < thresholds.oversold.moderate) {
      status = 'OVERSOLD'
      strength = rsiValue < thresholds.oversold.strong ? 'STRONG' : 'MODERATE'
    } else if (rsiValue > thresholds.neutral.upper) {
      status = 'BULLISH'
      strength = 'MODERATE'
    } else if (rsiValue < thresholds.neutral.lower) {
      status = 'BEARISH'
      strength = 'MODERATE'
    }

    return {
      value: rsiValue,
      status,
      strength,
      description: `RSI: ${rsiValue.toFixed(1)} | Status: ${status}`
    }
  }

  private calculateBollingerBands(marketData: any, config: any) {
    const currentPrice = marketData.currentPrice || marketData.close
    const bb = marketData.bollingerBands || { upper: 0, middle: 0, lower: 0 }
    
    let status = 'NEUTRAL'
    let strength: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK'
    
    if (currentPrice > bb.upper) {
      status = 'OVERBOUGHT'
      const deviation = (currentPrice - bb.upper) / bb.upper
      strength = deviation > 0.02 ? 'STRONG' : 'MODERATE'
    } else if (currentPrice < bb.lower) {
      status = 'OVERSOLD'
      const deviation = (bb.lower - currentPrice) / bb.lower
      strength = deviation > 0.02 ? 'STRONG' : 'MODERATE'
    }

    return {
      value: currentPrice,
      status,
      strength,
      description: `Price: $${currentPrice.toFixed(2)} | Upper: $${bb.upper.toFixed(2)} | Lower: $${bb.lower.toFixed(2)} | Status: ${status}`
    }
  }

  private calculateMACD(marketData: any, config: any) {
    const macd = marketData.macd || { macd: 0, signal: 0, histogram: 0 }
    
    let status = 'NEUTRAL'
    let strength: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK'
    
    if (macd.macd > macd.signal && macd.macd > 0) {
      status = 'BULLISH'
      strength = 'STRONG'
    } else if (macd.macd > macd.signal) {
      status = 'BULLISH'
      strength = 'MODERATE'
    } else if (macd.macd < macd.signal && macd.macd < 0) {
      status = 'BEARISH'
      strength = 'STRONG'
    } else if (macd.macd < macd.signal) {
      status = 'BEARISH'
      strength = 'MODERATE'
    }

    return {
      value: macd.macd,
      status,
      strength,
      description: `MACD: ${macd.macd.toFixed(3)} | Signal: ${macd.signal.toFixed(3)} | Status: ${status}`
    }
  }

  private calculateVolumeSMA(marketData: any, config: any) {
    const currentVolume = marketData.volume || 0
    const volumeSMA = marketData.volumeSMA || currentVolume
    const ratio = currentVolume / volumeSMA
    
    let status = 'NEUTRAL'
    let strength: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK'
    
    if (ratio > 1.5) {
      status = 'HIGH_VOLUME'
      strength = ratio > 2 ? 'STRONG' : 'MODERATE'
    } else if (ratio < 0.5) {
      status = 'LOW_VOLUME'
      strength = ratio < 0.3 ? 'STRONG' : 'MODERATE'
    }

    return {
      value: ratio,
      status,
      strength,
      description: `Volume Ratio: ${ratio.toFixed(2)} | Current: ${currentVolume.toLocaleString()} | SMA: ${volumeSMA.toLocaleString()} | Status: ${status}`
    }
  }

  private summarizeCategory(results: IndicatorResult[], category: string) {
    const statusValues = getStatusValuesByCategory(category)
    const summary: any = {
      bullish: 0,
      bearish: 0,
      neutral: 0,
      overbought: 0,
      oversold: 0
    }

    for (const result of results) {
      if (statusValues.includes(result.status)) {
        summary[result.status.toLowerCase()]++
      }
    }

    // Determine dominant signal
    const dominantSignal = Object.entries(summary)
      .filter(([_, count]) => (count as number) > 0)
      .sort(([_, a], [__, b]) => (b as number) - (a as number))[0]?.[0] || 'neutral'

    return {
      ...summary,
      dominantSignal: dominantSignal.toUpperCase()
    }
  }

  private buildFacts(categoryResults: CategoryAnalysis[]) {
    const facts: any = {
      trendBullishCount: 0,
      trendBearishCount: 0,
      trendNeutralCount: 0,
      momentumOverboughtCount: 0,
      momentumOversoldCount: 0,
      momentumNeutralCount: 0,
      volumeConfirmation: false,
      conflictingSignals: false
    }

    for (const category of categoryResults) {
      // Group results by subcategory
      const subcategoryGroups: { [key: string]: any[] } = {}
      
      for (const result of category.results) {
        if (!subcategoryGroups[result.subcategory]) {
          subcategoryGroups[result.subcategory] = []
        }
        subcategoryGroups[result.subcategory].push(result)
      }

      // Process each subcategory
      for (const [subcategory, results] of Object.entries(subcategoryGroups)) {
        const bullishCount = results.filter(r => r.status === 'BULLISH').length
        const bearishCount = results.filter(r => r.status === 'BEARISH').length
        const neutralCount = results.filter(r => r.status === 'NEUTRAL' || r.status === 'NO_BIAS').length
        const overboughtCount = results.filter(r => r.status === 'OVERBOUGHT').length
        const oversoldCount = results.filter(r => r.status === 'OVERSOLD').length

        // Map subcategories to fact categories based on their typical behavior
        if (subcategory === 'directional' || subcategory === 'price-action') {
          facts.trendBullishCount += bullishCount
          facts.trendBearishCount += bearishCount
          facts.trendNeutralCount += neutralCount
        } else if (subcategory === 'momentum') {
          facts.momentumOverboughtCount += overboughtCount
          facts.momentumOversoldCount += oversoldCount
          facts.momentumNeutralCount += neutralCount
        } else if (subcategory === 'volatility') {
          // Volatility indicators can contribute to both trend and momentum signals
          facts.trendBullishCount += bullishCount
          facts.trendBearishCount += bearishCount
          facts.trendNeutralCount += neutralCount
        }
      }

      // Check for volume confirmation
      if (category.category === 'volume' || category.results.some(r => r.status === 'HIGH_VOLUME')) {
        facts.volumeConfirmation = category.results.some(result => 
          result.status === 'HIGH_VOLUME' || result.status === 'BULLISH'
        )
      }
    }

    // Check for conflicting signals
    facts.conflictingSignals = (facts.trendBullishCount > 0 && facts.trendBearishCount > 0) ||
                               (facts.momentumOverboughtCount > 0 && facts.momentumOversoldCount > 0)

    return facts
  }

  private generateSignalAnalysis(events: any[], categoryResults: CategoryAnalysis[], timeframe: string): SignalAnalysis {
    let overallSignal: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL' = 'HOLD'
    let confidence = 0.5
    const reasoning: string[] = []

    if (events.length > 0) {
      const event = events[0]
      switch (event.type) {
        case 'strong-buy':
          overallSignal = 'STRONG_BUY'
          confidence = 0.85
          break
        case 'buy':
          overallSignal = 'BUY'
          confidence = 0.7
          break
        case 'strong-sell':
          overallSignal = 'STRONG_SELL'
          confidence = 0.85
          break
        case 'sell':
          overallSignal = 'SELL'
          confidence = 0.7
          break
        case 'hold':
          overallSignal = 'HOLD'
          confidence = 0.5
          break
      }
      reasoning.push(event.params.message)
    }

    // Add category-specific reasoning
    for (const category of categoryResults) {
      if (category.results.length > 0) {
        reasoning.push(`${category.category}: ${category.summary.dominantSignal} (${category.results.length} indicators)`)
      }
    }

    // Calculate timeframe-specific analysis
    const timeframeAnalysis: any = {}
    const weight = getTimeframeWeight(timeframe)
    timeframeAnalysis[timeframe] = {
      weight,
      signal: overallSignal,
      confidence: confidence * weight
    }

    return {
      overallSignal,
      confidence,
      reasoning,
      categorySignals: categoryResults,
      timeframeAnalysis
    }
  }

  // Public method to get configurable rules
  public getConfigurableRules() {
    return {
      buyConditions: getBuyConditions(),
      sellConditions: getSellConditions(),
      neutralConditions: getNeutralConditions()
    }
  }

  // Method to update rules dynamically
  public updateRules(newRules: any) {
    this.engine = new Engine()
    // Add new rules here
    this.setupRules()
  }
}
