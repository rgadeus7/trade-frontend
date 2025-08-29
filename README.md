# 🚀 TradeMatrix - Advanced Trading Analysis Framework

A comprehensive, dynamic trading analysis platform that provides multi-timeframe technical analysis with configurable indicators and real-time market data integration.

## ✨ Features

### 🎯 **Dynamic Indicator Framework**
- **Configuration-driven**: All indicators and categories are defined in `trading-config.json`
- **No hardcoding**: Easy to add, modify, or remove indicators without code changes
- **Flexible categorization**: Support for multiple categories and subcategories
- **Real-time updates**: Changes to config reflect immediately in the UI

### 📊 **Multi-Timeframe Analysis**
- **Daily, 2-Hour, Weekly, Monthly** timeframes
- **Consolidated view** with expandable sections
- **Summary statistics** for each timeframe
- **Cross-timeframe confluence** analysis

### 🔧 **Technical Indicators**

#### **Directional Indicators**
- **SMA (89-period)**: Trend direction analysis
- **SMA Low**: Support level analysis
- **PSAR**: Trend reversal detection

#### **Momentum Indicators**
- **RSI (14-period)**: Overbought/Oversold conditions
- **Multi-level analysis**: Strong/Moderate/Weak signals

#### **Volatility Indicators**
- **Bollinger Bands (20, 50, 89)**: Volatility and trend analysis
- **ATR (14, 20)**: Average True Range volatility measurement

#### **Volume Indicators**
- **VWAP**: Volume Weighted Average Price (configurable lookback)
- **Volume Profile**: Point of Control and Value Area analysis
- **Real volume data** integration from database

#### **Price Action Indicators**
- **Close vs Previous Close**: Session momentum
- **Open vs Previous Close**: Gap analysis
- **Close vs Previous High**: Breakout detection
- **Gap Analysis**: Gap up/down identification

### 🎨 **Modern UI/UX**
- **Clean, responsive design** with Tailwind CSS
- **Collapsible sections** for better information density
- **Color-coded status indicators** (Bullish/Bearish/Overbought/Oversold/No Bias)
- **Strength classification** (Strong/Moderate/Weak)
- **Real-time price updates**

### 📈 **Data Integration**
- **Real-time market data** from multiple sources
- **Historical OHLCV data** for technical analysis
- **Database integration** with Supabase
- **Configurable data periods** for each indicator

## 🛠️ Technical Architecture

### **Frontend Stack**
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons

### **Data Layer**
- **Supabase** for database
- **Real-time data fetching**
- **Historical data management**
- **Timeframe-specific data services**

### **Analysis Engine**
- **Custom technical analysis library**
- **Configurable indicator parameters**
- **Dynamic calculation methods**
- **Multi-timeframe processing**

## 📁 Project Structure

```
trade-frontend/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── TradingChecklistV2.tsx    # Main analysis component
│   ├── SignalDashboard.tsx       # Dashboard layout
│   ├── IndicatorAnalysis.tsx     # Indicator breakdown
│   └── Sidebar.tsx               # Navigation
├── config/                 # Configuration files
│   ├── trading-config.json      # Main trading configuration
│   └── trading-config.ts        # TypeScript interfaces
├── lib/                    # Core libraries
│   ├── technicalAnalysis.ts     # Technical analysis functions
│   ├── timeframeDataService.ts  # Data service layer
│   ├── database.ts              # Database operations
│   └── supabase.ts              # Supabase client
└── types/                  # TypeScript type definitions
```

## ⚙️ Configuration

### **Indicator Configuration**
All indicators are configured in `config/trading-config.json`:

```json
{
  "indicatorCategories": {
    "technical": {
      "subcategories": {
        "directional": ["sma", "smaLow", "psar"],
        "momentum": ["rsi"],
        "volatility": ["bollingerBands", "atr"],
        "volume": ["vwap", "volumeProfile"]
      }
    },
    "price-action": {
      "subcategories": {
        "price-action": ["price-action", "openVsPreviousClose", "closeVsPreviousHigh"]
      }
    }
  }
}
```

### **Lookback Periods**
- **VWAP**: Configurable lookback (default: 10 periods)
- **Volume Profile**: Configurable lookback (default: 20 periods)
- **All indicators**: Dynamic data period support

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Supabase account (for database)

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd trade-frontend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Supabase credentials

# Run the development server
npm run dev
```

### **Environment Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Usage

### **Adding New Indicators**
1. Add indicator definition to `trading-config.json`
2. Add calculation logic to `TradingChecklistV2.tsx`
3. Update TypeScript interfaces if needed
4. Restart the application

### **Modifying Indicator Parameters**
1. Edit the `configurable` section in `trading-config.json`
2. Changes reflect immediately in the UI
3. No code changes required

### **Customizing Categories**
1. Modify `indicatorCategories` in config
2. Add new subcategories as needed
3. Assign indicators to appropriate categories

## 🔄 Recent Updates

### **v2.0 - Dynamic Framework**
- ✅ **Removed hardcoded values** - fully configurable
- ✅ **Added VWAP and Volume Profile** indicators
- ✅ **Enhanced Price Action** with new conditions
- ✅ **Improved UI/UX** with better information density
- ✅ **Real volume data** integration
- ✅ **Configurable lookback periods** for volume indicators

### **v1.5 - Multi-Timeframe Support**
- ✅ **Daily, 2-Hour, Weekly, Monthly** analysis
- ✅ **Consolidated summary** statistics
- ✅ **Expandable timeframe sections**
- ✅ **Cross-timeframe confluence** analysis

## 🎯 Roadmap

### **Phase 3 - Confluence Logic**
- [ ] **Confluence scoring algorithm**
- [ ] **Signal strength weighting**
- [ ] **Multi-indicator confirmation**
- [ ] **Risk assessment integration**

### **Phase 4 - Counter-Trend Detection**
- [ ] **Reversal pattern recognition**
- [ ] **Divergence analysis**
- [ ] **Overbought/Oversold reversal signals**
- [ ] **Trend exhaustion detection**

### **Phase 5 - Advanced Features**
- [ ] **Backtesting framework**
- [ ] **Performance analytics**
- [ ] **Alert system**
- [ ] **Portfolio integration**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/config` directory
- Review the example configurations

---

**Built with ❤️ for the trading community**
