import { 
  TradingCategory, 
  MindMapData, 
  ScenarioNode, 
  Connection,
  ViewType 
} from '../../types/scenarios'

// Import scenario configurations
import dayTradingSimpleConfig from '../../config/scenarios/day-trading-simple.json'

class ScenarioConfigService {
  private categories: Map<string, TradingCategory> = new Map()
  private mindMaps: Map<string, MindMapData> = new Map()

  constructor() {
    this.initializeCategories()
    this.buildMindMaps()
  }

  /**
   * Initialize all trading categories
   */
  private initializeCategories() {
    console.log('🔧 Initializing categories with:', dayTradingSimpleConfig)
    this.categories.set('day-trading-simple', dayTradingSimpleConfig as any)
    console.log('🔧 Categories after initialization:', Array.from(this.categories.keys()))
  }

  /**
   * Build mind map data from category configurations
   */
  private buildMindMaps() {
    this.categories.forEach((category, categoryId) => {
      const mindMap = this.buildMindMapFromCategory(category)
      this.mindMaps.set(categoryId, mindMap)
    })
  }

  /**
   * Convert category configuration to mind map data
   */
  private buildMindMapFromCategory(category: TradingCategory): MindMapData {
    const nodes: ScenarioNode[] = []
    const connections: Connection[] = []
    
    // Simple horizontal layout for scenarios - just spread them out left to right
    const spacing = 600 // Much bigger spacing between nodes
    const totalWidth = (category.scenarios.length - 1) * spacing
    const startX = -totalWidth / 2
    
    category.scenarios.forEach((scenario, index) => {
      const x = startX + (index * spacing)
      const y = 0 // All scenarios on same horizontal line
      
      const position = `translate(${x}px, ${y}px)`
      console.log(`Scenario ${scenario.name}: position = ${position}`)
      
      const scenarioNode: ScenarioNode = {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        probability: typeof scenario.probability === 'number' ? scenario.probability : 50,
        riskLevel: scenario.riskLevel || 'MEDIUM',
        filters: (scenario as any).filters || this.convertConditionsToFilters((scenario as any).conditions || []),
        tradeZones: scenario.tradeZones || []
      }
      
      nodes.push(scenarioNode)
      
    })
    
    return {
      nodes,
      connections,
      category: category.id,
      name: category.name,
      description: category.description
    }
  }

  /**
   * Convert scenario conditions to filter format
   */
  private convertConditionsToFilters(conditions: any[]): any[] {
    return conditions.map((condition, index) => {
      // Parse timeframe from field name if it's in the new format
      const parsedField = this.parseTimeframeField(condition.field)
      const timeframe = parsedField ? parsedField.timeframe : condition.timeframe
      const field = parsedField ? parsedField.field : condition.field
      const period = parsedField ? parsedField.period : 'P0'

      return {
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
    })
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

  /**
   * Determine filter type based on field
   */
  private determineFilterType(field: string): 'price' | 'indicator' | 'volume' | 'time' | 'correlation' | 'custom' {
    if (field.includes('price') || field.includes('high') || field.includes('low') || 
        field.includes('open') || field.includes('close')) {
      return 'price'
    }
    if (field.includes('volume')) {
      return 'volume'
    }
    if (field.includes('rsi') || field.includes('sma') || field.includes('bb') || 
        field.includes('bollinger') || field.includes('atr')) {
      return 'indicator'
    }
    if (field.includes('time') || field.includes('session')) {
      return 'time'
    }
    if (field.includes('correlation')) {
      return 'correlation'
    }
    return 'custom'
  }

  /**
   * Extract indicator name from field
   */
  private extractIndicator(field: string): string | undefined {
    if (field.includes('rsi')) return 'rsi'
    if (field.includes('sma')) return 'sma'
    if (field.includes('bb') || field.includes('bollinger')) return 'bollingerBands'
    if (field.includes('atr')) return 'atr'
    if (field.includes('vwap')) return 'vwap'
    return undefined
  }

  /**
   * Generate SVG path for connections
   */
  private generateConnectionPath(fromPos: string, toPos: string): string {
    const from = this.parsePosition(fromPos)
    const to = this.parsePosition(toPos)
    
    // Create a curved path for better visual appeal
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2
    
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`
  }

  /**
   * Parse position string to coordinates
   */
  private parsePosition(position: string): { x: number, y: number } {
    // Handle transform values like "translate(200px, 0px)"
    if (position.includes('translate')) {
      const translateMatch = position.match(/translate\(([^,]+),\s*([^)]+)\)/)
      if (translateMatch) {
        const translateX = parseInt(translateMatch[1])
        const translateY = parseInt(translateMatch[2])
        
        // Base position is center (600, 600) for the larger container
        const finalX = 600 + translateX
        const finalY = 600 + translateY
        
        return { x: finalX, y: finalY }
      }
    }
    
    // Fallback to default center
    return { x: 600, y: 600 }
  }

  /**
   * Convert CSS positioning (e.g., "top-1/2 left-1/4") to transform coordinates
   */
  private convertCssPositionToTransform(position: string): { x: number, y: number } {
    // Handle transform values like "translate(200px, 0px)"
    const translateMatch = position.match(/translate\(([^,]+),\s*([^)]+)\)/)
    if (translateMatch) {
      const translateX = parseInt(translateMatch[1])
      const translateY = parseInt(translateMatch[2])
      return { x: translateX, y: translateY }
    }
    
    // Handle CSS positioning classes like "top-1/2 left-1/4"
    const parts = position.split(' ')
    let x = 0, y = 0
    
    for (const part of parts) {
      if (part.startsWith('left-')) {
        const fraction = this.parseFraction(part.replace('left-', ''))
        x = (fraction - 0.5) * 1200 // Convert to pixels relative to center
      } else if (part.startsWith('right-')) {
        const fraction = this.parseFraction(part.replace('right-', ''))
        x = (0.5 - fraction) * 1200 // Convert to pixels relative to center
      } else if (part.startsWith('top-')) {
        const fraction = this.parseFraction(part.replace('top-', ''))
        y = (fraction - 0.5) * 1200 // Convert to pixels relative to center
      } else if (part.startsWith('bottom-')) {
        const fraction = this.parseFraction(part.replace('bottom-', ''))
        y = (0.5 - fraction) * 1200 // Convert to pixels relative to center
      }
    }
    
    return { x, y }
  }

  /**
   * Parse fraction strings like "1/2", "1/4", "3/4"
   */
  private parseFraction(fraction: string): number {
    const [numerator, denominator] = fraction.split('/').map(Number)
    return numerator / denominator
  }

  /**
   * Get all available categories
   */
  getCategories(): TradingCategory[] {
    console.log('🔧 getCategories called, categories:', Array.from(this.categories.keys()))
    const result = Array.from(this.categories.values()).map(category => ({
      ...category,
      timeHorizons: ['intraday', '1-day'], // Default time horizons
      defaultView: 'mind-map' as ViewType, // Default view
      customViews: [] // No custom views for simplified structure
    }))
    console.log('🔧 getCategories returning:', result)
    return result
  }

  /**
   * Get category by ID
   */
  getCategory(categoryId: string): TradingCategory | undefined {
    const category = this.categories.get(categoryId)
    if (!category) return undefined
    
    return {
      ...category,
      timeHorizons: ['intraday', '1-day'], // Default time horizons
      defaultView: 'mind-map' as ViewType, // Default view
      customViews: [] // No custom views for simplified structure
    }
  }

  /**
   * Get mind map data for a category
   */
  getMindMap(categoryId: string): MindMapData | undefined {
    return this.mindMaps.get(categoryId)
  }

  /**
   * Get all mind maps
   */
  getAllMindMaps(): Map<string, MindMapData> {
    return this.mindMaps
  }

  /**
   * Get scenario by ID across all categories
   */
  getScenario(scenarioId: string): any | undefined {
    let foundScenario: any = undefined
    this.categories.forEach((category) => {
      if (!foundScenario) {
        const scenario = category.scenarios.find((s: any) => s.id === scenarioId)
        if (scenario) {
          foundScenario = scenario
        }
      }
    })
    return foundScenario
  }

  /**
   * Get scenarios by category
   */
  getScenariosByCategory(categoryId: string): any[] {
    const category = this.categories.get(categoryId)
    if (!category) return []
    
    return category.scenarios
  }

  /**
   * Get custom views for a category
   */
  getCustomViews(categoryId: string): any[] {
    const category = this.categories.get(categoryId)
    if (!category) return []
    
    return category.customViews || []
  }

  /**
   * Get default view for a category
   */
  getDefaultView(categoryId: string): ViewType {
    const category = this.categories.get(categoryId)
    if (!category) return 'mind-map'
    
    return category.defaultView
  }


  /**
   * Get required indicators for a scenario
   */
  getRequiredIndicators(scenarioId: string): string[] {
    const scenario = this.getScenario(scenarioId)
    if (!scenario) return []
    
    return scenario.requiredIndicators || []
  }

  /**
   * Get scenario analysis configuration
   */
  getScenarioAnalysis(scenarioId: string): any {
    const scenario = this.getScenario(scenarioId)
    if (!scenario) return null
    
    return scenario.analysis || {}
  }

  /**
   * Get scenario visualization configuration
   */
  getScenarioVisualization(scenarioId: string): any {
    const scenario = this.getScenario(scenarioId)
    if (!scenario) return null
    
    return scenario.visualization || {}
  }

  /**
   * Get scenario probability configuration
   */
  getScenarioProbability(scenarioId: string): any {
    const scenario = this.getScenario(scenarioId)
    if (!scenario) return null
    
    return scenario.probability || {}
  }

  /**
   * Get scenario risk configuration
   */
  getScenarioRisk(scenarioId: string): any {
    const scenario = this.getScenario(scenarioId)
    if (!scenario) return null
    
    return scenario.risk || {}
  }

  /**
   * Reload configurations (useful for development)
   */
  reloadConfigurations() {
    this.initializeCategories()
    this.buildMindMaps()
  }
}

// Create singleton instance
const scenarioConfigService = new ScenarioConfigService()

// Export hook for React components
export function useScenarioConfig() {
  return {
    getCategories: scenarioConfigService.getCategories.bind(scenarioConfigService),
    getCategory: scenarioConfigService.getCategory.bind(scenarioConfigService),
    getMindMap: scenarioConfigService.getMindMap.bind(scenarioConfigService),
    getScenariosByCategory: scenarioConfigService.getScenariosByCategory.bind(scenarioConfigService),
    getCustomViews: scenarioConfigService.getCustomViews.bind(scenarioConfigService),
    getDefaultView: scenarioConfigService.getDefaultView.bind(scenarioConfigService),
    getRequiredIndicators: scenarioConfigService.getRequiredIndicators.bind(scenarioConfigService),
    getScenarioAnalysis: scenarioConfigService.getScenarioAnalysis.bind(scenarioConfigService),
    getScenarioVisualization: scenarioConfigService.getScenarioVisualization.bind(scenarioConfigService),
    getScenarioProbability: scenarioConfigService.getScenarioProbability.bind(scenarioConfigService),
    getScenarioRisk: scenarioConfigService.getScenarioRisk.bind(scenarioConfigService)
  }
}

// Export the service instance for direct use
export { scenarioConfigService }
export default scenarioConfigService
