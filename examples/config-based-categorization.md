# Config-Based Indicator Categorization

## Overview

The indicator categorization (directional, momentum, volatility) is now **config-based** instead of hardcoded. This means you can easily change how indicators are categorized by updating the configuration file without touching the code.

## How It Works

### 1. **Configuration Structure**

The categorization is defined in `trade-frontend/config/trading-config.json`:

```json
{
  "indicatorCategories": {
    "technical": {
      "description": "Technical analysis indicators",
      "subcategories": {
        "directional": {
          "description": "Indicators that show trend direction",
          "indicators": ["sma", "sma-low", "psar"],
          "statusValues": ["BULLISH", "BEARISH", "NEUTRAL"],
          "buySignal": "Price above moving averages or bullish trend",
          "sellSignal": "Price below moving averages or bearish trend"
        },
        "momentum": {
          "description": "Oscillators that show overbought/oversold conditions",
          "indicators": ["rsi"],
          "statusValues": ["OVERBOUGHT", "OVERSOLD", "NO_BIAS"],
          "buySignal": "Momentum indicators show OVERSOLD conditions",
          "sellSignal": "Momentum indicators show OVERBOUGHT conditions"
        },
        "volatility": {
          "description": "Indicators that measure market volatility",
          "indicators": ["bollingerBands", "atr"],
          "statusValues": ["OVERBOUGHT", "OVERSOLD", "NEUTRAL"],
          "buySignal": "Low volatility suggests potential breakout",
          "sellSignal": "High volatility suggests potential reversal"
        }
      }
    },
    "price-action": {
      "description": "Price action analysis",
      "subcategories": {
        "directional": {
          "description": "Price action patterns and movements",
          "indicators": ["price-action"],
          "statusValues": ["BULLISH", "BEARISH"],
          "buySignal": "Price action shows bullish patterns",
          "sellSignal": "Price action shows bearish patterns"
        }
      }
    }
  }
}
```

### 2. **Dynamic Categorization in Code**

Instead of hardcoded values, the code now uses config-based categorization:

```typescript
// OLD (Hardcoded)
const INDICATORS = {
  sma: {
    category: 'technical' as const,
    subcategory: 'directional' as const,
    // ...
  }
}

// NEW (Config-based)
const INDICATORS = {
  sma: {
    getCategory: () => getIndicatorCategorization('sma') || { 
      category: 'technical', 
      subcategory: 'directional' 
    },
    // ...
  }
}
```

### 3. **Helper Functions**

The system provides helper functions to get categorization from config:

```typescript
// Get categorization for any indicator
const categorization = getIndicatorCategorization('rsi')
// Returns: { category: 'technical', subcategory: 'momentum' }

// Check if indicator is of a specific type
const isMomentum = isMomentumIndicator('rsi') // true
const isDirectional = isTrendIndicator('sma') // true
const isVolatility = isVolatilityIndicator('bollingerBands') // true
```

## Benefits

### ✅ **Easy to Modify**
- Change indicator categories by updating the config file
- No code changes required
- Version control friendly

### ✅ **Consistent**
- All categorization logic centralized in config
- No scattered hardcoded values throughout codebase

### ✅ **Extensible**
- Easy to add new categories or subcategories
- Easy to add new indicators to existing categories

### ✅ **Type Safe**
- TypeScript interfaces ensure config structure is correct
- Compile-time validation of categorization

## Example: Changing RSI from Momentum to Volatility

### 1. **Update Config**
```json
{
  "indicatorCategories": {
    "technical": {
      "subcategories": {
        "momentum": {
          "indicators": ["stoch"] // Remove RSI
        },
        "volatility": {
          "indicators": ["bollingerBands", "atr", "rsi"] // Add RSI
        }
      }
    }
  }
}
```

### 2. **Code Automatically Updates**
- RSI will now appear under "Volatility" section in UI
- All calculations and logic remain the same
- No code changes needed

## Example: Adding a New Indicator

### 1. **Add to Config**
```json
{
  "indicatorCategories": {
    "technical": {
      "subcategories": {
        "momentum": {
          "indicators": ["rsi", "stoch", "macd"] // Add MACD
        }
      }
    }
  }
}
```

### 2. **Add Indicator Logic**
```typescript
const INDICATORS = {
  macd: {
    id: 'macd',
    getCategory: () => getIndicatorCategorization('macd') || { 
      category: 'technical', 
      subcategory: 'momentum' 
    },
    calculate: (timeframe) => {
      // MACD calculation logic
    }
  }
}
```

### 3. **System Automatically**
- MACD appears in Momentum section
- Uses momentum status values (OVERBOUGHT, OVERSOLD, NO_BIAS)
- Follows momentum buy/sell signals

## Current Indicator Mappings

| Indicator | Category | Subcategory | Status Values |
|-----------|----------|-------------|---------------|
| SMA | Technical | Directional | BULLISH, BEARISH, NEUTRAL |
| SMA Low | Technical | Directional | BULLISH, BEARISH, NEUTRAL |
| RSI | Technical | Momentum | OVERBOUGHT, OVERSOLD, NO_BIAS |
| Bollinger Bands | Technical | Volatility | OVERBOUGHT, OVERSOLD, NEUTRAL |
| ATR | Technical | Volatility | OVERBOUGHT, OVERSOLD, NEUTRAL |
| PSAR | Technical | Directional | BULLISH, BEARISH, NEUTRAL |
| Price Action | Price Action | Directional | BULLISH, BEARISH |

## Configuration Functions

```typescript
// Get categorization for any indicator
getIndicatorCategorization(indicatorId: string): { category: string; subcategory: string } | null

// Check indicator types
isTrendIndicator(indicatorName: string): boolean
isMomentumIndicator(indicatorName: string): boolean
isVolatilityIndicator(indicatorName: string): boolean
isPriceActionIndicator(indicatorName: string): boolean

// Get indicators by category/subcategory
getIndicatorsByCategory(category: string, subcategory?: string): string[]

// Get status values for category/subcategory
getStatusValuesByCategory(category: string, subcategory?: string): string[]

// Get buy/sell signals for category/subcategory
getCategoryBuySignal(category: string, subcategory?: string): string
getCategorySellSignal(category: string, subcategory?: string): string
```

This config-based approach makes the system much more flexible and maintainable!
