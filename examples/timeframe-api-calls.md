# Timeframe-Specific API Calls Architecture

## Overview

The new architecture makes **separate API calls** for each timeframe (Daily, 2-Hour, Weekly, Monthly) instead of using the same data source for all timeframes. This ensures that each timeframe gets its own dedicated data and indicators.

## How It Works

### 1. **Separate API Calls for Each Timeframe**

```typescript
// Each timeframe makes its own API call with different parameters
const dailyData = await getMarketData('$SPX.X', 'daily', 500)
const hourlyData = await getMarketData('$SPX.X', '2hour', 500)
const weeklyData = await getMarketData('$SPX.X', 'weekly', 500)
const monthlyData = await getMarketData('$SPX.X', 'monthly', 500)
```

### 2. **Timeframe-Specific Data Service**

The `timeframeDataService` handles all timeframe operations:

```typescript
// Get data for a specific timeframe
const dailyData = await timeframeDataService.getTimeframeData('SPX', 'daily', 500)

// Get data for all timeframes in parallel
const allTimeframes = await timeframeDataService.getAllTimeframesData('SPX', 500)

// Get data for multiple symbols across all timeframes
const multiSymbolData = await timeframeDataService.getMultipleSymbolsData(['SPX', 'SPY'], 500)
```

### 3. **Separate Indicator Calculations**

Each timeframe gets its own indicator calculations:

```typescript
// Daily indicators calculated from daily data
const dailyIndicators = calculateIndicators(dailyData, 'daily')

// Weekly indicators calculated from weekly data  
const weeklyIndicators = calculateIndicators(weeklyData, 'weekly')

// Monthly indicators calculated from monthly data
const monthlyIndicators = calculateIndicators(monthlyData, 'monthly')
```

## Benefits

### ✅ **Accurate Data**
- Each timeframe uses its own historical data
- No mixing of different timeframe data
- Proper OHLC data for each timeframe

### ✅ **Proper Indicators**
- SMA calculated from the correct timeframe data
- RSI calculated from the correct timeframe prices
- Bollinger Bands calculated from the correct timeframe volatility

### ✅ **Extensible Architecture**
- Easy to add new timeframes (just add to the array)
- Easy to add new indicators (just add to the INDICATORS object)
- Easy to add new symbols (just add to the symbol map)

### ✅ **Performance**
- Parallel API calls for all timeframes
- Cached data per timeframe
- Efficient data processing

## Example: Adding a New Timeframe

To add a new timeframe (e.g., "4-Hour"):

1. **Add to the service:**
```typescript
// In timeframeDataService.ts
const timeframes: TimeframeType[] = ['daily', '2hour', '4hour', 'weekly', 'monthly']
```

2. **Add to the TIMEFRAMES array:**
```typescript
// In TradingChecklistV2.tsx
{
  name: '4-Hour',
  serviceTimeframe: '4hour' as const,
  getData: (serviceData) => {
    const data = serviceData['4hour']
    // ... data processing
  }
}
```

3. **The system automatically:**
- Makes API calls for 4-hour data
- Calculates 4-hour specific indicators
- Displays 4-hour analysis in the UI

## Database Structure

The database table `market_data` has a `timeframe` column that allows storing different timeframes:

```sql
CREATE TABLE market_data (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10),
  timeframe VARCHAR(10), -- 'daily', '2hour', 'weekly', 'monthly'
  timestamp TIMESTAMP,
  open DECIMAL,
  high DECIMAL,
  low DECIMAL,
  close DECIMAL,
  volume BIGINT
);
```

## API Call Flow

1. **Component loads** → Fetches SPX data
2. **Timeframe service** → Makes 4 parallel API calls:
   - `getMarketData('$SPX.X', 'daily', 500)`
   - `getMarketData('$SPX.X', '2hour', 500)`
   - `getMarketData('$SPX.X', 'weekly', 500)`
   - `getMarketData('$SPX.X', 'monthly', 500)`
3. **Indicator calculations** → Each timeframe gets its own indicators
4. **UI rendering** → Displays timeframe-specific analysis

This architecture ensures that each timeframe analysis is based on its own dedicated data source, providing accurate and reliable technical analysis.
