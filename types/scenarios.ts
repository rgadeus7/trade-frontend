import { MarketData } from './market'

// Trade Zone Types
export interface TradeZone {
  id: string
  type: 'BUY' | 'SELL'
  entryPrice: string
  stopLoss: string
  takeProfit: string
  timeframe?: string
  period?: string
  description: string
}

// Scenario Node Types
export interface ScenarioNode {
  id: string
  name: string
  description: string
  probability?: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  filters?: ScenarioFilter[]
  tradeZones?: TradeZone[]
  status?: NodeStatus
}

export type NodeStatus = 'BULLISH' | 'BEARISH' | 'OVERBOUGHT' | 'OVERSOLD' | 'NO_BIAS'

export interface ScenarioFilter {
  id: string
  field: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'subtract'
  value?: string
  minValue?: string
  maxValue?: string
  timeframe: string
  period: string
  description: string
}

export interface MindMapData {
  nodes: ScenarioNode[]
  connections: Connection[]
  category: string
  name: string
  description: string
}

export interface Connection {
  from: string
  to: string
  path: string
  type: 'primary' | 'secondary' | 'tertiary'
}

// Scenario Category Types
export interface TradingCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  timeHorizons: string[]
  defaultView: ViewType
  scenarios: TradingScenario[]
  customViews: CustomView[]
}

// Simplified Trading Category for new structure
export interface SimpleTradingCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  scenarios: ScenarioNode[]
}

export interface TradingScenario {
  id: string
  name: string
  description: string
  category?: string
  priority?: number
  conditions?: ScenarioCondition[]
  tradeZones?: TradeZone[]
  subScenarios?: any[]
  analysis?: AnalysisConfig
  visualization?: 'mind-map' | 'flow-chart' | 'timeline' | 'dashboard' | VisualizationConfig
  probability?: number | ProbabilityConfig
  risk?: string | RiskConfig
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  position?: string
  timeHorizon?: 'intraday' | '1-day' | '1-3days' | '1-2weeks' | 'monthly'
  requiredIndicators?: string[]
}

export interface ScenarioCondition {
  field: string
  operator: string
  value?: any
  minValue?: any
  maxValue?: any
  comparison?: 'absolute' | 'relative' | 'percentage'
  timeframe?: string
  lookback?: number
  description: string
}

export interface AnalysisConfig {
  indicators: string[]
  timeframes: string[]
  lookbackPeriods: number[]
}

export interface VisualizationConfig {
  type: 'mind-map' | 'flow-chart' | 'timeline' | 'dashboard'
  layout: 'grid' | 'list' | 'hierarchical'
  components: string[]
}

export interface ProbabilityConfig {
  baseProbability: number
  modifiers: ProbabilityModifier[]
  calculationMethod: 'weighted' | 'conditional' | 'custom'
}

export interface ProbabilityModifier {
  condition: string
  adjustment: number
  description: string
}

export interface RiskConfig {
  level: 'LOW' | 'MEDIUM' | 'HIGH'
  factors: RiskFactor[]
  mitigation: string[]
}

export interface RiskFactor {
  name: string
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
}


export interface CustomView {
  id: string
  name: string
  description: string
  layout: ViewLayout
  components: ViewComponent[]
  dataSources?: DataSource[]
  styling?: ViewStyling
  interactions?: ViewInteraction[]
}

export type ViewType = 'mind-map' | 'flow-chart' | 'timeline' | 'dashboard'

export interface ViewLayout {
  type: 'grid' | 'list' | 'hierarchical' | 'custom'
  grid?: {
    rows: number
    columns: number
    gap: number
  }
  custom?: {
    positions: { [componentId: string]: Position }
  }
}

export interface ViewComponent {
  id: string
  type: string
  data: ComponentData
  position: Position
  size: Size
  styling?: ComponentStyling
  interactions?: ComponentInteraction[]
}

export interface Position {
  x: number
  y: number
  z?: number
}

export interface Size {
  width: number | string
  height: number | string
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export interface ComponentData {
  source: string
  type: string
  parameters?: { [key: string]: any }
}

export interface ComponentStyling {
  theme: 'light' | 'dark' | 'custom'
  colors: { [key: string]: string }
  fonts: { [key: string]: string }
  borders: { [key: string]: string }
  shadows: { [key: string]: string }
}

export interface ComponentInteraction {
  type: 'click' | 'hover' | 'drag' | 'resize' | 'custom'
  action: string
  parameters: { [key: string]: any }
}

export interface DataSource {
  id: string
  name: string
  type: 'market-data' | 'indicator' | 'calculated' | 'external'
  endpoint?: string
  parameters: { [key: string]: any }
}

export interface ViewStyling {
  theme: 'light' | 'dark' | 'custom'
  colors: { [key: string]: string }
  fonts: { [key: string]: string }
  borders: { [key: string]: string }
  shadows: { [key: string]: string }
}

export interface ViewInteraction {
  type: 'navigation' | 'filtering' | 'sorting' | 'custom'
  action: string
  parameters: { [key: string]: any }
}

// Scenario Evaluation Types
export interface ScenarioEvaluation {
  scenarioId: string
  status: NodeStatus
  confidence: number
  timestamp: Date
  marketData: MarketData
  indicators: { [key: string]: any }
  filters: { [key: string]: boolean }
  probability: number
  risk: RiskAssessment
}

export interface RiskAssessment {
  level: 'LOW' | 'MEDIUM' | 'HIGH'
  factors: RiskFactor[]
  score: number
  recommendations: string[]
}

// Mind Map Rendering Types
export interface MindMapConfig {
  layout: 'radial' | 'hierarchical' | 'force-directed' | 'custom'
  spacing: {
    nodeDistance: number
    levelDistance: number
    siblingDistance: number
  }
  animations: {
    duration: number
    easing: string
    stagger: number
  }
  styling: {
    nodeColors: { [status: string]: string }
    connectionColors: { [type: string]: string }
    nodeSizes: { [type: string]: number }
  }
}
