import { timeframeDataService } from '../timeframeDataService'
import { TechnicalAnalysis } from '../technicalAnalysis'
import { getIndicatorCategorization } from '../../config/trading-config'
import { 
  ScenarioEvaluation, 
  NodeStatus, 
  RiskAssessment, 
  ScenarioNode,
  ScenarioFilter 
} from '../../types/scenarios'
import { ParsedMarketData, getMarketDataValue } from '../marketDataParser'
import { MarketData } from '../../types/market'

export class ScenarioEngine {
  constructor(
    private timeframeService = timeframeDataService,
    private technicalAnalysis = new TechnicalAnalysis()
  ) {}

  /**
   * Evaluate a specific scenario based on current market data
   */
  async evaluateScenario(scenarioId: string, marketData: any): Promise<ScenarioEvaluation> {
    try {
      console.log(`🚀 Evaluating scenario: ${scenarioId}`, {
        marketDataKeys: marketData ? Object.keys(marketData) : 'no data',
        marketDataType: typeof marketData,
        hasTimeframes: marketData && 'timeframes' in marketData
      })
      
      // Get scenario configuration
      const scenario = await this.getScenarioConfig(scenarioId)
      if (!scenario) {
        throw new Error(`Scenario ${scenarioId} not found`)
      }

      console.log(`📋 Scenario config:`, {
        id: scenario.id,
        name: scenario.name,
        filters: scenario.filters
      })

      // Evaluate all filters
      const filterResults = await this.evaluateFilters(scenario.filters || [], marketData)
      
      // Calculate overall status
      const status = this.calculateStatus(filterResults, scenario)
      
      // Calculate confidence and probability
      const confidence = this.calculateConfidence(filterResults)
      const probability = this.calculateProbability(scenario, filterResults)
      
      // Assess risk
      const risk = this.assessRisk(scenario, filterResults, marketData)
      
      // Get relevant indicators
      const indicators = await this.getRelevantIndicators(scenario, marketData)

      return {
        scenarioId,
        status,
        confidence,
        timestamp: new Date(),
        marketData,
        indicators,
        filters: filterResults,
        probability,
        risk
      }
    } catch (error) {
      console.error('Error evaluating scenario:', error)
      throw error
    }
  }

  /**
   * Evaluate all filters for a scenario
   */
  private async evaluateFilters(filters: any[], marketData: any): Promise<{ [key: string]: boolean }> {
    console.log(`🔍 Evaluating ${filters.length} filters:`, filters)
    console.log(`🔍 Market data for filter evaluation:`, {
      hasTimeframes: marketData && 'timeframes' in marketData,
      timeframesKeys: marketData && marketData.timeframes ? Object.keys(marketData.timeframes) : 'no timeframes',
      marketDataKeys: marketData ? Object.keys(marketData) : 'no data'
    })
    
    const results: { [key: string]: boolean } = {}
    
    for (const filter of filters) {
      console.log(`🔍 Processing filter:`, filter)
      try {
        results[filter.id] = await this.evaluateFilter(filter, marketData)
        console.log(`✅ Filter ${filter.id} result:`, results[filter.id])
      } catch (error) {
        console.error(`❌ Error evaluating filter ${filter.id}:`, error)
        results[filter.id] = false
      }
    }
    
    console.log(`🎯 All filter results:`, results)
    return results
  }

  /**
   * Evaluate a single filter
   */
  private async evaluateFilter(filter: any, marketData: any): Promise<boolean> {
    const { type, operator, parameters } = filter
    
    try {
      switch (type) {
        case 'price':
          return this.evaluatePriceFilter(operator, parameters, parameters.field || '', marketData)
        
        case 'indicator':
          return this.evaluateIndicatorFilter(operator, parameters, filter.indicator!, marketData)
        
        case 'volume':
          return this.evaluateVolumeFilter(operator, parameters, marketData)
        
        case 'time':
          return this.evaluateTimeFilter(operator, parameters)
        
        case 'correlation':
          return this.evaluateCorrelationFilter(operator, parameters, marketData)
        
        case 'custom':
          return this.evaluateCustomFilter(operator, parameters, marketData)
        
        default:
          console.warn(`Unknown filter type: ${type}`)
          return false
      }
    } catch (error) {
      console.error(`Error evaluating filter ${filter.id}:`, error)
      return false
    }
  }

  /**
   * Evaluate price-based filters
   */
  private evaluatePriceFilter(operator: string, parameters: any, field: string, marketData: any): boolean {
    // Get the current value based on the field specified in the condition
    const currentValue = this.resolveValue(parameters.field || field, marketData)
    const comparisonValue = this.resolveValue(parameters.value, marketData)
    
    console.log(`🔍 Price filter evaluation:`, {
      field: parameters.field || field,
      operator,
      currentValue,
      comparisonValue,
      parameters,
      marketDataKeys: marketData ? Object.keys(marketData) : 'no data'
    })
    
    switch (operator) {
      case 'gt':
        return currentValue > this.resolveValue(parameters.value, marketData)
      
      case 'lt':
        return currentValue < this.resolveValue(parameters.value, marketData)
      
      case 'eq':
        return Math.abs(currentValue - this.resolveValue(parameters.value, marketData)) < 0.01
      
      case 'gte':
        return currentValue >= this.resolveValue(parameters.value, marketData)
      
      case 'lte':
        return currentValue <= this.resolveValue(parameters.value, marketData)
      
      case 'between':
        const min = this.resolveValue(parameters.minValue, marketData)
        const max = this.resolveValue(parameters.maxValue, marketData)
        return currentValue >= min && currentValue <= max
      
      default:
        return false
    }
  }

  /**
   * Evaluate indicator-based filters
   */
  private async evaluateIndicatorFilter(operator: string, parameters: any, indicator: string, marketData: any): Promise<boolean> {
    try {
      // Get indicator value using existing technical analysis
      const indicatorValue = await this.getIndicatorValue(indicator, marketData)
      const threshold = this.resolveValue(parameters.value, marketData)
      
      switch (operator) {
        case 'gt':
          return indicatorValue > threshold
        
        case 'lt':
          return indicatorValue < threshold
        
        case 'eq':
          return Math.abs(indicatorValue - threshold) < 0.01
        
        case 'gte':
          return indicatorValue >= threshold
        
        case 'lte':
          return indicatorValue <= threshold
        
        case 'between':
          const min = this.resolveValue(parameters.minValue, marketData)
          const max = this.resolveValue(parameters.maxValue, marketData)
          return indicatorValue >= min && indicatorValue <= max
        
        default:
          return false
      }
    } catch (error) {
      console.error(`Error evaluating indicator filter:`, error)
      return false
    }
  }

  /**
   * Evaluate volume-based filters
   */
  private evaluateVolumeFilter(operator: string, parameters: any, marketData: any): boolean {
    const currentVolume = marketData.daily?.volume || marketData.hourly?.volume || 0
    const averageVolume = this.calculateAverageVolume(marketData)
    
    switch (operator) {
      case 'gt':
        const threshold = this.resolveValue(parameters.threshold, marketData)
        return currentVolume > (averageVolume * threshold)
      
      case 'lt':
        const thresholdLt = this.resolveValue(parameters.threshold, marketData)
        return currentVolume < (averageVolume * thresholdLt)
      
      default:
        return false
    }
  }

  /**
   * Evaluate time-based filters
   */
  private evaluateTimeFilter(operator: string, parameters: any): boolean {
    const now = new Date()
    const currentTime = now.getHours() * 100 + now.getMinutes()
    
    switch (operator) {
      case 'between':
        const minTime = this.parseTime(parameters.minValue)
        const maxTime = this.parseTime(parameters.maxValue)
        return currentTime >= minTime && currentTime <= maxTime
      
      default:
        return false
    }
  }

  /**
   * Evaluate correlation-based filters
   */
  private async evaluateCorrelationFilter(operator: string, parameters: any, marketData: any): Promise<boolean> {
    try {
      // This would need to be implemented based on your correlation calculation logic
      const correlation = await this.calculateCorrelation(marketData)
      const threshold = this.resolveValue(parameters.threshold, marketData)
      
      switch (operator) {
        case 'gt':
          return correlation > threshold
        
        case 'lt':
          return correlation < threshold
        
        case 'between':
          const min = this.resolveValue(parameters.minValue, marketData)
          const max = this.resolveValue(parameters.maxValue, marketData)
          return correlation >= min && correlation <= max
        
        default:
          return false
      }
    } catch (error) {
      console.error(`Error evaluating correlation filter:`, error)
      return false
    }
  }

  /**
   * Evaluate custom formula filters
   */
  private evaluateCustomFilter(operator: string, parameters: any, marketData: any): boolean {
    try {
      const formula = parameters.customFormula
      if (!formula) return false
      
      // Simple formula evaluation - you might want to use a proper expression parser
      const result = this.evaluateFormula(formula, marketData)
      
      switch (operator) {
        case 'gt':
          return result > 0
        
        case 'lt':
          return result < 0
        
        case 'eq':
          return Math.abs(result) < 0.01
        
        default:
          return false
      }
    } catch (error) {
      console.error(`Error evaluating custom filter:`, error)
      return false
    }
  }

  /**
   * Calculate overall scenario status
   */
  private calculateStatus(filterResults: { [key: string]: boolean }, scenario: any): NodeStatus {
    // Count active filters
    const activeFilters = Object.values(filterResults).filter(Boolean).length
    const totalFilters = Object.keys(filterResults).length
    
    console.log(`📊 Status calculation:`, {
      activeFilters,
      totalFilters,
      filterResults,
      scenarioId: scenario.id,
      scenarioName: scenario.name
    })
    
    if (activeFilters === 0) {
      console.log(`❌ No active filters, returning NO_BIAS`)
      return 'NO_BIAS'
    }
    if (activeFilters === totalFilters) {
      // All filters passed, determine bullish/bearish based on scenario type
      const direction = this.determineScenarioDirection(scenario)
      console.log(`✅ All filters passed (${activeFilters}/${totalFilters}), direction:`, direction)
      return direction
    }
    
    // Partial match - determine based on scenario type and filter results
    const partialDirection = this.determinePartialMatchDirection(scenario, filterResults)
    console.log(`⚠️ Partial match (${activeFilters}/${totalFilters}), direction:`, partialDirection)
    return partialDirection
  }

  /**
   * Calculate confidence based on filter results
   */
  private calculateConfidence(filterResults: { [key: string]: boolean }): number {
    const totalFilters = Object.keys(filterResults).length
    if (totalFilters === 0) return 0
    
    const activeFilters = Object.values(filterResults).filter(Boolean).length
    return (activeFilters / totalFilters) * 100
  }

  /**
   * Calculate probability based on scenario configuration and filter results
   */
  private calculateProbability(scenario: any, filterResults: { [key: string]: boolean }): number {
    let baseProbability = scenario.probability?.baseProbability || 50
    
    // Apply modifiers based on filter results
    if (scenario.probability?.modifiers) {
      for (const modifier of scenario.probability.modifiers) {
        if (this.evaluateModifierCondition(modifier.condition, filterResults)) {
          baseProbability += modifier.adjustment
        }
      }
    }
    
    // Ensure probability stays within bounds
    return Math.max(0, Math.min(100, baseProbability))
  }

  /**
   * Assess risk based on scenario and market conditions
   */
  private assessRisk(scenario: any, filterResults: { [key: string]: boolean }, marketData: any): RiskAssessment {
    const baseRisk = scenario.risk?.level || 'MEDIUM'
    const riskFactors = scenario.risk?.factors || []
    
    // Calculate risk score (0-100)
    let riskScore = this.calculateRiskScore(baseRisk, filterResults, marketData)
    
    // Generate recommendations
    const recommendations = this.generateRiskRecommendations(scenario, riskScore)
    
    return {
      level: this.categorizeRiskLevel(riskScore),
      factors: riskFactors,
      score: riskScore,
      recommendations
    }
  }

  /**
   * Get relevant indicators for the scenario
   */
  private async getRelevantIndicators(scenario: any, marketData: any): Promise<{ [key: string]: any }> {
    const indicators: { [key: string]: any } = {}
    const requiredIndicators = scenario.requiredIndicators || []
    
    for (const indicator of requiredIndicators) {
      try {
        indicators[indicator] = await this.getIndicatorValue(indicator, marketData)
      } catch (error) {
        console.error(`Error getting indicator ${indicator}:`, error)
        indicators[indicator] = null
      }
    }
    
    return indicators
  }

  // Helper methods
  private resolveValue(value: any, marketData: any): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      // Handle dynamic values like "yesterday_high", "average_volume", etc.
      return this.resolveDynamicValue(value, marketData)
    }
    return 0
  }

  private resolveDynamicValue(value: string, marketData: any): number {
    console.log(`🔍 Resolving dynamic value: "${value}"`, {
      hasTimeframes: 'timeframes' in marketData,
      marketDataKeys: marketData ? Object.keys(marketData) : 'no data',
      marketDataType: typeof marketData
    })
    
    // Check if it's parsed market data (new structure)
    if (marketData && ('timeframes' in marketData || value.includes('_P'))) {
      console.log(`🔍 Using parsed market data resolution for: "${value}"`)
      return this.resolveParsedMarketDataValue(value, marketData as ParsedMarketData)
    }
    
    // Legacy market data structure
    // Handle flat properties that we know exist
    let result = 0
    switch (value) {
      case 'yesterday_high':
        result = (marketData as any).yesterday_high || marketData.yesterday?.high || 0
        break
      case 'yesterday_low':
        result = (marketData as any).yesterday_low || marketData.yesterday?.low || 0
        break
      case 'yesterday_close':
        result = (marketData as any).yesterday_close || marketData.yesterday?.close || 0
        break
      case 'yesterday_open':
        result = (marketData as any).yesterday_open || 0
        break
      case 'yesterday_volume':
        result = (marketData as any).yesterday_volume || marketData.yesterday?.volume || 0
        break
      case 'average_volume':
        result = (marketData as any).average_volume || this.calculateAverageVolume(marketData)
        break
      case 'open':
        result = (marketData as any).open || marketData.daily?.price || 0
        break
      case 'high':
        result = (marketData as any).high || marketData.daily?.price || 0
        break
      case 'low':
        result = (marketData as any).low || marketData.daily?.price || 0
        break
      case 'close':
        result = (marketData as any).close || marketData.daily?.price || 0
        break
      case 'volume':
        result = (marketData as any).volume || marketData.daily?.volume || 0
        break
      case 'sma_89':
        // Handle SMA 89 based on timeframe
        if ((marketData as any).sma89) {
          result = (marketData as any).sma89
        } else if ((marketData as any).sma && (marketData as any).sma[89]) {
          result = (marketData as any).sma[89]
        } else {
          result = 0
        }
        break
      case 'sma_200':
        // Handle SMA 200
        if ((marketData as any).sma200) {
          result = (marketData as any).sma200
        } else if ((marketData as any).sma && (marketData as any).sma[200]) {
          result = (marketData as any).sma[200]
        } else {
          result = 0
        }
        break
      default:
        // Handle expressions like "sma_89 * 0.99"
        if (value.includes('*')) {
          const parts = value.split('*').map(p => p.trim())
          if (parts.length === 2) {
            const baseField = parts[0]
            const multiplier = parseFloat(parts[1])
            const baseValue = this.resolveDynamicValue(baseField, marketData)
            result = baseValue * multiplier
          } else {
            result = 0
          }
        } else {
          result = 0
        }
    }
    
    console.log(`🔍 Resolving value "${value}":`, {
      result,
      marketDataOpen: (marketData as any).open,
      marketDataYesterdayHigh: (marketData as any).yesterday_high,
      marketDataYesterday: marketData.yesterday
    })
    
    return result
  }

  private resolveParsedMarketDataValue(value: string, parsedData: ParsedMarketData): number {
    console.log(`🔍 Resolving parsed market data value: "${value}"`)
    
    // Handle expressions like "1D_P1_high * 0.99"
    if (value.includes('*')) {
      const parts = value.split('*').map(p => p.trim())
      if (parts.length === 2) {
        const baseField = parts[0]
        const multiplier = parseFloat(parts[1])
        const baseValue = this.resolveParsedMarketDataValue(baseField, parsedData)
        console.log(`🔍 Expression result: ${baseValue} * ${multiplier} = ${baseValue * multiplier}`)
        return baseValue * multiplier
      }
      return 0
    }

    // Parse the new format: timeframe_field (e.g., "1D_P0_open", "2H_P1_high")
    const parsedField = this.parseTimeframeField(value)
    console.log(`🔍 Parsed field:`, parsedField)
    
    if (parsedField) {
      const { timeframe, field, period } = parsedField
      const result = getMarketDataValue(parsedData, field, timeframe, period)
      console.log(`🔍 Market data result for ${field} (${timeframe}, ${period}):`, result)
      if (result !== null) {
        return result
      }
    }

    // Fallback: try to get value from parsed data with old format
    const result = getMarketDataValue(parsedData, value, '1D', 'P0')
    console.log(`🔍 Fallback result for ${value}:`, result)
    if (result !== null) {
      return result
    }

    // Try other timeframes if 1D doesn't work
    const timeframes = ['2H', '1W', '1M']
    for (const timeframe of timeframes) {
      const result = getMarketDataValue(parsedData, value, timeframe, 'P0')
      if (result !== null) {
        console.log(`🔍 Found result in ${timeframe}:`, result)
        return result
      }
    }

    console.log(`🔍 No value found for "${value}", returning 0`)
    return 0
  }

  /**
   * Parse timeframe field format: "1D_P0_open" -> { timeframe: "1D", field: "open", period: "P0" }
   */
  private parseTimeframeField(fieldName: any): { timeframe: string; field: string; period: string } | null {
    if (!fieldName || typeof fieldName !== 'string') return null
    // Match patterns like "1D_P0_open", "2H_P1_high", "1D_P0_sma_89"
    const match = fieldName.match(/^(\d+[DHWM]?)_(P\d+)_(.+)$/)
    if (match) {
      const [, timeframe, period, field] = match
      return { timeframe, field, period }
    }
    return null
  }

  private calculateAverageVolume(marketData: any): number {
    // Use the pre-calculated average_volume if available
    if ((marketData as any).average_volume) {
      return (marketData as any).average_volume
    }
    
    // Fallback to simple average calculation
    const dailyVolume = marketData.daily?.volume || 0
    const hourlyVolume = marketData.hourly?.volume || 0
    return (dailyVolume + hourlyVolume) / 2
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 100 + minutes
  }

  private async calculateCorrelation(marketData: any): Promise<number> {
    // Placeholder - implement your correlation calculation logic
    return 0
  }

  private evaluateFormula(formula: string, marketData: any): number {
    // Placeholder - implement your formula evaluation logic
    return 0
  }

  private determineScenarioDirection(scenario: any): NodeStatus {
    // Determine direction based on scenario type, name, category, and trade zones
    const scenarioId = scenario.id?.toLowerCase() || ''
    const scenarioName = scenario.name?.toLowerCase() || ''
    const category = scenario.category?.toLowerCase() || ''
    
    console.log(`🔍 Determining scenario direction:`, {
      scenarioId,
      scenarioName,
      category,
      hasTradeZones: !!scenario.tradeZones,
      hasFilters: !!scenario.filters
    })
    
    // Category-specific logic
    if (category === 'day-trading' || scenarioId.includes('day-trading')) {
      // Day trading scenarios - analyze based on price action patterns
      if (scenarioId.includes('above') || scenarioId.includes('breakout') || scenarioId.includes('bounce') || 
          scenarioId.includes('alignment') || scenarioId.includes('squeeze')) {
        return 'BULLISH'
      }
      if (scenarioId.includes('below') || scenarioId.includes('breakdown')) {
        return 'BEARISH'
      }
    }
    
    // Check scenario ID patterns (general)
    if (scenarioId.includes('above') || scenarioId.includes('breakout') || scenarioId.includes('bounce') ||
        scenarioId.includes('oversold') || scenarioId.includes('support') || scenarioId.includes('buy')) {
      return 'BULLISH'
    }
    if (scenarioId.includes('below') || scenarioId.includes('breakdown') || scenarioId.includes('overbought') ||
        scenarioId.includes('resistance') || scenarioId.includes('sell')) {
      return 'BEARISH'
    }
    
    // Check scenario name patterns
    if (scenarioName.includes('above') || scenarioName.includes('breakout') || scenarioName.includes('bounce') ||
        scenarioName.includes('oversold') || scenarioName.includes('support') || scenarioName.includes('buy')) {
      return 'BULLISH'
    }
    if (scenarioName.includes('below') || scenarioName.includes('breakdown') || scenarioName.includes('overbought') ||
        scenarioName.includes('resistance') || scenarioName.includes('sell')) {
      return 'BEARISH'
    }
    
    // Check trade zones for direction hints
    if (scenario.tradeZones && Array.isArray(scenario.tradeZones)) {
      const buyZones = scenario.tradeZones.filter((zone: any) => zone.type === 'BUY').length
      const sellZones = scenario.tradeZones.filter((zone: any) => zone.type === 'SELL').length
      
      console.log(`🔍 Trade zones analysis:`, { buyZones, sellZones })
      
      if (buyZones > sellZones) return 'BULLISH'
      if (sellZones > buyZones) return 'BEARISH'
    }
    
    // Check filters for directional indicators
    if (scenario.filters && Array.isArray(scenario.filters)) {
      const bullishFilters = scenario.filters.filter((filter: any) => 
        filter.operator === 'gt' && 
        (filter.field?.includes('close') || filter.field?.includes('open') || filter.field?.includes('high'))
      ).length
      
      const bearishFilters = scenario.filters.filter((filter: any) => 
        filter.operator === 'lt' && 
        (filter.field?.includes('close') || filter.field?.includes('open') || filter.field?.includes('low'))
      ).length
      
      console.log(`🔍 Filter analysis:`, { bullishFilters, bearishFilters })
      
      if (bullishFilters > bearishFilters) return 'BULLISH'
      if (bearishFilters > bullishFilters) return 'BEARISH'
    }
    
    console.log(`❌ No clear direction found, returning NO_BIAS`)
    return 'NO_BIAS'
  }

  private determinePartialMatchDirection(scenario: any, filterResults: { [key: string]: boolean }): NodeStatus {
    // For partial matches, analyze which filters passed and their significance
    const passedFilters = Object.entries(filterResults)
      .filter(([_, passed]) => passed)
      .map(([filterId, _]) => filterId)
    
    const totalFilters = Object.keys(filterResults).length
    const passedCount = passedFilters.length
    const passRate = passedCount / totalFilters
    
    console.log(`🔍 Partial match analysis:`, {
      scenarioId: scenario.id,
      passedFilters,
      passRate,
      totalFilters
    })
    
    // If more than 50% of filters passed, determine direction based on scenario type
    if (passRate >= 0.5) {
      const direction = this.determineScenarioDirection(scenario)
      console.log(`✅ Partial match (${Math.round(passRate * 100)}% passed) - direction:`, direction)
      return direction
    }
    
    // If less than 50% passed, check if any critical filters passed
    if (scenario.filters && Array.isArray(scenario.filters)) {
      const criticalFilters = scenario.filters.filter((filter: any) => 
        filter.critical || filter.required || filter.priority === 'high'
      )
      
      const criticalPassed = criticalFilters.some((filter: any) => 
        passedFilters.includes(filter.id)
      )
      
      if (criticalPassed) {
        const direction = this.determineScenarioDirection(scenario)
        console.log(`⚠️ Critical filter passed - direction:`, direction)
        return direction
      }
    }
    
    // Default to NO_BIAS for weak partial matches
    console.log(`❌ Weak partial match (${Math.round(passRate * 100)}% passed) - returning NO_BIAS`)
    return 'NO_BIAS'
  }

  private evaluateModifierCondition(condition: string, filterResults: { [key: string]: boolean }): boolean {
    // Implement modifier condition evaluation
    return false
  }

  private calculateRiskScore(baseRisk: string, filterResults: { [key: string]: boolean }, marketData: any): number {
    // Implement risk score calculation
    return 50
  }

  private generateRiskRecommendations(scenario: any, riskScore: number): string[] {
    // Generate recommendations based on risk score and scenario
    return scenario.risk?.mitigation || []
  }

  private categorizeRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (riskScore < 33) return 'LOW'
    if (riskScore < 66) return 'MEDIUM'
    return 'HIGH'
  }

  private async getIndicatorValue(indicator: string, marketData: any): Promise<number> {
    // Use your existing technical analysis to get indicator values
    try {
      // This would integrate with your existing TechnicalAnalysis class
      return 0 // Placeholder
    } catch (error) {
      console.error(`Error getting indicator value for ${indicator}:`, error)
      return 0
    }
  }

  /**
   * Convert conditions to filters (same logic as scenarioConfig.ts)
   */
  private convertConditionsToFilters(conditions: any[]): any[] {
    console.log(`🔧 Converting conditions to filters:`, conditions)
    
    const filters = conditions.map((condition, index) => {
      // Parse timeframe from field name if it's in the new format
      const parsedField = this.parseTimeframeField(condition.field)
      const timeframe = parsedField ? parsedField.timeframe : condition.timeframe
      const field = parsedField ? parsedField.field : condition.field
      const period = parsedField ? parsedField.period : 'P0'

      const filter = {
        id: condition.id || `filter-${index}`,
        name: condition.description || `Condition ${index + 1}`,
        description: condition.description || '',
        type: this.determineFilterType(field),
        operator: condition.operator || 'gt',
        parameters: {
          value: condition.value,
          minValue: condition.minValue,
          maxValue: condition.maxValue,
          lookback: condition.lookback,
          threshold: condition.threshold,
          field: condition.field
        },
        indicator: this.extractIndicator(field),
        timeframe: timeframe,
        period: period,
        weight: condition.weight || 1,
        isRequired: condition.isRequired || true,
        isActive: condition.isActive !== undefined ? condition.isActive : true
      }
      
      console.log(`🔧 Converted condition ${condition.id}:`, {
        original: condition,
        converted: filter
      })
      
      return filter
    })
    
    console.log(`🔧 Final filters:`, filters)
    return filters
  }

  /**
   * Determine filter type based on field
   */
  private determineFilterType(field: string): 'price' | 'indicator' | 'volume' | 'time' | 'correlation' | 'custom' {
    if (field.includes('price') || field.includes('high') || field.includes('low') || field.includes('open') || field.includes('close')) {
      return 'price'
    }
    if (field.includes('volume')) {
      return 'volume'
    }
    if (field.includes('rsi') || field.includes('sma') || field.includes('ema') || field.includes('bollinger')) {
      return 'indicator'
    }
    if (field.includes('time') || field.includes('hour') || field.includes('day')) {
      return 'time'
    }
    return 'custom'
  }

  /**
   * Extract indicator name from field
   */
  private extractIndicator(field: string): string | null {
    const indicatorMatch = field.match(/(rsi|sma|ema|bollinger|macd|stochastic)/i)
    return indicatorMatch ? indicatorMatch[1].toLowerCase() : null
  }

  private async getScenarioConfig(scenarioId: string): Promise<any> {
    try {
      // Import scenario configurations
      const dayTradingSimpleConfig = await import('../../config/scenarios/day-trading-simple.json')
      
      // Search through all scenarios in all categories
      const allScenarios = [
        ...(dayTradingSimpleConfig.default?.scenarios || [])
      ]
      
      // Find the scenario by ID
      const rawScenario = allScenarios.find(s => s.id === scenarioId)
      
      if (rawScenario) {
        // Convert conditions to filters (same logic as scenarioConfig.ts)
        const scenario = {
          ...rawScenario,
          filters: this.convertConditionsToFilters((rawScenario as any).conditions || [])
        }
        
        return scenario
      } else {
        console.warn(`⚠️ Scenario ${scenarioId} not found in any configuration`)
        return null
      }
    } catch (error) {
      console.error(`❌ Error loading scenario config for ${scenarioId}:`, error)
      return null
    }
  }
}

// Create singleton instance
const scenarioEngine = new ScenarioEngine()

// Export a hook for React components
export function useScenarioEngine() {
  return {
    evaluateScenario: scenarioEngine.evaluateScenario.bind(scenarioEngine)
  }
}
