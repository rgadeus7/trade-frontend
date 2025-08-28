# Indicator Framework Documentation

## Overview
This framework categorizes technical indicators into two main types to provide clearer analysis:

## 1. Directional Indicators (Trend-Based)
**Purpose**: Show trend direction and price momentum relative to reference levels
**Status Values**: `BULLISH`, `BEARISH`, `NEUTRAL`

### Current Directional Indicators:
- **SMA (Simple Moving Average)**: Price vs 89-period SMA
- **Price Action**: Price vs yesterday's close/high
- **Gap Analysis**: Gap up/down from previous close

### Logic:
- `BULLISH`: Price above reference level
- `BEARISH`: Price below reference level  
- `NEUTRAL`: Price at reference level

## 2. Momentum Indicators (Extreme-Based)
**Purpose**: Show when price is at extreme levels (overbought/oversold)
**Status Values**: `OVERBOUGHT`, `OVERSOLD`, `NEUTRAL`

### Current Momentum Indicators:
- **RSI (Relative Strength Index)**: Momentum oscillator
- **Bollinger Bands**: Price position relative to volatility bands

### Logic:
- `OVERBOUGHT`: Price at extreme high levels (RSI > 70, Price > Upper BB)
- `OVERSOLD`: Price at extreme low levels (RSI < 30, Price < Lower BB)
- `NEUTRAL`: Price within normal range

## Framework Benefits

### 1. Clear Separation
- **Directional Bias**: Shows overall trend direction (BULLISH/BEARISH)
- **Momentum Bias**: Shows market extremes (OVERBOUGHT/OVERSOLD)

### 2. Better Analysis
- You can see if the market is trending up but overbought
- You can see if the market is trending down but oversold
- Helps identify potential reversal points

### 3. Per-Timeframe Tracking
Each timeframe (Monthly, Weekly, Daily, 2-Hour) shows:
- **Directional Count**: Bullish/Bearish/Neutral indicators
- **Momentum Count**: Overbought/Oversold/Neutral indicators

## Example Interpretation

**Daily Timeframe:**
- Directional: 3 Bullish, 1 Bearish → **BULLISH BIAS**
- Momentum: 2 Overbought, 0 Oversold → **OVERBOUGHT BIAS**

**Interpretation**: Daily trend is bullish but price is overbought, suggesting potential pullback or consolidation.

## Configuration
Indicator types are defined in `trading-config.json`:
```json
{
  "indicatorTypes": {
    "directional": ["sma", "priceAction", "gapAnalysis"],
    "momentum": ["rsi", "bollingerBands"]
  }
}
```

## Adding New Indicators
1. Add indicator to appropriate category in `trading-config.json`
2. Update TypeScript interface in `trading-config.ts`
3. Implement indicator logic in `TradingChecklist.tsx`
4. Use appropriate status values based on indicator type
