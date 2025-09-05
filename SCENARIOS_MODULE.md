# 🧠 Trading Scenarios Module

A comprehensive, interactive mind map system for analyzing different trading strategies and market conditions.

## 🚀 Features

### **Interactive Mind Maps**
- **Pan & Zoom**: Navigate through complex scenario trees
- **Search & Filter**: Find specific scenarios quickly
- **Expandable Nodes**: Drill down into scenario details
- **Real-time Updates**: Live scenario evaluation

### **Multiple Trading Categories**
- **Day Trading**: Open scenarios, intraday patterns
- **VIX Trading**: Volatility regimes, fear/greed cycles
- **Mean Reversion**: Statistical extremes, range patterns

### **Flexible Configuration**
- **JSON-based**: Easy to modify without code changes
- **Custom Views**: Multiple visualization options
- **Dynamic Filters**: Configurable conditions and thresholds
- **Extensible**: Add new categories and scenarios easily

## 📁 Module Structure

```
trade-frontend/
├── app/scenarios/              # App router pages
│   ├── page.tsx               # Main scenarios page
│   └── layout.tsx             # Scenarios layout
├── components/scenarios/       # React components
│   ├── ScenarioMindMap.tsx    # Main mind map component
│   └── ScenarioNode.tsx       # Individual scenario nodes
├── lib/scenarios/             # Business logic
│   ├── scenarioEngine.ts      # Scenario evaluation engine
│   └── scenarioConfig.ts      # Configuration management
├── config/scenarios/          # Scenario configurations
│   ├── day-trading.json      # Day trading scenarios
│   ├── vix-trading.json      # VIX trading scenarios
│   └── mean-reversion.json   # Mean reversion scenarios
└── types/scenarios.ts         # TypeScript definitions
```

## 🎯 Usage

### **1. Access the Module**
Navigate to `/scenarios` in your application or click "Trading Scenarios" in the sidebar.

### **2. Select Trading Category**
Choose from:
- **Day Trading**: Intraday strategies based on market open conditions
- **VIX Trading**: Volatility-based strategies and sentiment analysis
- **Mean Reversion**: Statistical reversal strategies

### **3. Explore Scenarios**
- **Click nodes** to select and view details
- **Expand nodes** to see filters and sub-scenarios
- **Use search** to find specific scenarios
- **Toggle visibility** to focus on relevant scenarios

### **4. Evaluate Scenarios**
- Click **"Evaluate"** button on any scenario
- View real-time analysis results
- See probability and risk assessments

## ⚙️ Configuration

### **Adding New Scenarios**

1. **Create JSON Configuration**:
```json
{
  "id": "new-scenario",
  "name": "New Scenario Name",
  "description": "Scenario description",
  "position": "top-1/2 left-1/4",
  "probability": 75,
  "riskLevel": "MEDIUM",
  "conditions": [
    {
      "field": "price",
      "operator": "gt",
      "value": "sma_20",
      "description": "Price above 20 SMA"
    }
  ]
}
```

2. **Add to Category**:
```json
{
  "scenarios": {
    "new-scenario": { /* scenario config */ }
  }
}
```

### **Customizing Views**

Each category supports multiple view types:
- **mind-map**: Hierarchical node visualization
- **flow-chart**: Step-by-step decision flow
- **timeline**: Chronological scenario progression
- **dashboard**: Grid-based component layout

### **Filter Configuration**

Filters support multiple types:
- **price**: Price-based conditions
- **indicator**: Technical indicator conditions
- **volume**: Volume-based conditions
- **time**: Time-based conditions
- **correlation**: Correlation-based conditions
- **custom**: Custom formula conditions

## 🔧 Integration

### **With Existing Codebase**
- **Zero Impact**: Completely isolated from existing components
- **Reuse Services**: Leverages existing data and analysis services
- **Same Types**: Extends current type system
- **Independent Routes**: New `/scenarios` path

### **Data Sources**
The module integrates with:
- **Market Data**: Real-time price and volume data
- **Technical Indicators**: RSI, SMA, Bollinger Bands, etc.
- **Timeframe Service**: Multi-timeframe analysis
- **Database**: Historical data and analysis results

## 🎨 Customization

### **Styling**
- **Theme Colors**: Customize node colors and gradients
- **Animations**: Adjust animation timing and effects
- **Layout**: Modify node positioning and spacing
- **Typography**: Customize fonts and text styling

### **Components**
- **Custom Nodes**: Create specialized node types
- **Enhanced Filters**: Add new filter types
- **Visual Elements**: Custom charts and indicators
- **Interactive Features**: Add custom interactions

## 🚀 Future Enhancements

### **Phase 1 (Current)**
- ✅ Basic mind map functionality
- ✅ Three trading categories
- ✅ Interactive nodes and connections
- ✅ Search and filtering

### **Phase 2 (Planned)**
- [ ] Advanced visualization modes
- [ ] Real-time market data integration
- [ ] Historical scenario analysis
- [ ] Performance tracking

### **Phase 3 (Future)**
- [ ] AI-powered scenario suggestions
- [ ] Backtesting integration
- [ ] Risk management tools
- [ ] Portfolio optimization

## 🛠️ Development

### **Adding New Categories**

1. Create category configuration in `config/scenarios/`
2. Add category to `scenarioConfig.ts`
3. Implement category-specific logic if needed
4. Test with sample data

### **Extending Scenario Engine**

1. Add new filter types in `scenarioEngine.ts`
2. Implement evaluation logic
3. Add new status types if needed
4. Update type definitions

### **Custom Components**

1. Create component in `components/scenarios/`
2. Add to component library
3. Update view configurations
4. Test integration

## 📚 Examples

### **Day Trading Scenario**
```json
{
  "id": "open-above-yesterday-high",
  "name": "Open Above Yesterday High",
  "description": "Market opens above yesterday's high",
  "conditions": [
    {
      "field": "open_price",
      "operator": "gt",
      "value": "yesterday_high"
    }
  ],
  "subScenarios": [
    {
      "id": "breakout",
      "name": "Breakout Continuation",
      "probability": 65
    }
  ]
}
```

### **VIX Trading Scenario**
```json
{
  "id": "low-volatility",
  "name": "Low Volatility Regime",
  "description": "VIX below 15",
  "conditions": [
    {
      "field": "vix",
      "operator": "lt",
      "value": 15
    }
  ]
}
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**
3. **Add scenarios** to configuration files
4. **Test thoroughly** with different market conditions
5. **Submit pull request**

## 📝 Notes

- **No Mock Data**: All scenarios use real market data
- **Performance**: Optimized for large scenario trees
- **Accessibility**: Keyboard navigation and screen reader support
- **Mobile**: Responsive design for all screen sizes

---

**Built with ❤️ for the trading community**
