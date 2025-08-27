# Trading Configuration

This directory contains the configuration files for the trading checklist indicators and thresholds.

## Files

- `trading-config.json` - Main configuration file with all thresholds and settings
- `trading-config.ts` - TypeScript interface and helper functions
- `README.md` - This documentation file

## Current Configuration

### SMA (Simple Moving Average)
- **Strength Threshold**: 2% (0.02)
- **Description**: Percentage deviation from SMA for STRONG vs MODERATE strength

### RSI (Relative Strength Index)
- **Overbought**: 
  - Strong: 80
  - Moderate: 70
- **Bullish**: 
  - Strong: 60
  - Moderate: 50
- **Bearish**: 
  - Strong: 40
  - Moderate: 50
- **Oversold**: 
  - Strong: 20
  - Moderate: 30

### Bollinger Bands
- **Strength Threshold**: 1% (0.01)
- **Description**: Percentage deviation from band for STRONG vs MODERATE strength

### Price Action
- **Strength Threshold**: 1% (0.01)
- **Description**: Percentage price difference for STRONG vs MODERATE strength

### Gap Analysis
- **Strength Threshold**: 1% (0.01)
- **Description**: Percentage gap size for STRONG vs MODERATE strength

## How to Modify

1. **Edit `trading-config.json`** to change any threshold values
2. **Restart the development server** to see changes take effect
3. **All indicators will automatically use the new values**

## Example Modifications

### Make RSI More Sensitive
```json
{
  "indicators": {
    "rsi": {
      "overbought": {
        "strong": 75,
        "moderate": 65
      },
      "bullish": {
        "strong": 55,
        "moderate": 45
      },
      "bearish": {
        "strong": 45,
        "moderate": 55
      },
      "oversold": {
        "strong": 25,
        "moderate": 35
      }
    }
  }
}
```

### Make SMA More Sensitive
```json
{
  "indicators": {
    "sma": {
      "strengthThreshold": 0.01
    }
  }
}
```

### Make Bollinger Bands Less Sensitive
```json
{
  "indicators": {
    "bollingerBands": {
      "strengthThreshold": 0.02
    }
  }
}
```

## Status Mapping

The configuration also includes descriptions of how each indicator determines status:

- **SMA**: Price > SMA = BULLISH, Price < SMA = BEARISH
- **RSI**: Based on threshold ranges (see above)
- **Bollinger Bands**: Above Upper = OVERBOUGHT, Between = NEUTRAL, Below Lower = OVERSOLD
- **Price Action**: Condition met = BULLISH, Condition not met = BEARISH

## Notes

- All thresholds are in decimal format (e.g., 0.02 = 2%)
- Changes take effect immediately after restarting the dev server
- The configuration is type-safe with TypeScript interfaces
- Helper functions are available in `trading-config.ts` for easy access
