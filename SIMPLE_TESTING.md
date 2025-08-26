# 🎯 Simple Testing Guide - Daily Data & 89 EMA

Your app is now simplified to show only **daily market data** and **89 EMA** for SPY, SPX, and ES.

## 🚀 **Quick Test**

### **Option 1: URL Parameter**
```
http://localhost:3000?token=YOUR_API_TOKEN_HERE
```

### **Option 2: Dashboard Button**
1. **Open** your dashboard
2. **Click** "Use API Token" button
3. **Enter** your Trade Station API token
4. **Press** Enter

## 📊 **What You'll See**

### **For Each Instrument (SPY, SPX, ES):**
- ✅ **Current Price** - Latest daily closing price
- ✅ **Daily Change** - Percentage change from previous day
- ✅ **89 EMA** - 89-day Exponential Moving Average
- ✅ **Volume** - Daily trading volume
- ✅ **Above/Below EMA** - Price position relative to 89 EMA
- ✅ **Distance** - How far price is from 89 EMA

## 🔧 **API Call Made**

**Single API call per symbol:**
```
GET https://api.tradestation.com/v3/marketdata/barcharts/@ES?barsback=1000&interval=1&unit=Daily
```

**What this gives you:**
- 1000 bars of daily data
- Daily interval (1 day)
- OHLC (Open, High, Low, Close) data
- Volume data

## 🧮 **89 EMA Calculation**

The app calculates the 89-day Exponential Moving Average from the daily closing prices:
- Uses all available data (up to 1000 days)
- Falls back to simple average if less than 89 days available
- Updates every minute (cached for 5 minutes)

## 💾 **Caching**

- **5-minute cache** to avoid unnecessary API calls
- **Session storage** for your API token
- **Automatic fallback** to mock data if API fails

## 🎨 **Visual Indicators**

### **When Connected:**
- ✅ **Green dot** - "Connected with API Token"
- ✅ **Blue EMA section** - Shows 89 EMA value
- ✅ **Above/Below indicator** - Price vs EMA position

### **When Using Mock Data:**
- 🔵 **Blue dot** - "Connected to Trade Station"
- 🔵 **Mock values** - Simulated data for testing

## 🧪 **Test Your Token**

### **Browser Console Test:**
```javascript
fetch('/api/tradestation-api?symbol=ES&token=YOUR_TOKEN')
  .then(res => res.json())
  .then(data => console.log('ES Data:', data))
```

### **Expected Response:**
```json
{
  "symbol": "ES",
  "instrumentType": "ES",
  "price": 4500.25,
  "change": 1.25,
  "volume": 485000,
  "timestamp": "2024-01-15T14:30:00.000Z",
  "ema89": 4485.75
}
```

## 🚨 **Common Issues**

### **"Failed to fetch Trade Station data"**
- **Cause**: Invalid or expired token
- **Solution**: Get fresh token from Trade Station

### **"Trade Station API error: 401"**
- **Cause**: Unauthorized
- **Solution**: Check token has `MarketData` scope

### **"No data received from Trade Station"**
- **Cause**: Empty response from API
- **Solution**: Check symbol format (@ES, @SPY, @SPX)

## 📱 **Dashboard Features**

- **Instrument Filter** - View all or individual symbols
- **Auto-refresh** - Updates every minute
- **Real-time status** - Shows connection state
- **Clean interface** - Focused on essential data

## 🎯 **What's Removed**

- ❌ Complex technical indicators (RSI, MACD, Bollinger Bands)
- ❌ Trading signals and confidence scores
- ❌ Portfolio management
- ❌ Market watch
- ❌ News feed
- ❌ Trading charts

## 🚀 **Ready to Test!**

1. **Get your Trade Station API token**
2. **Test with the URL or button method**
3. **Verify daily data and 89 EMA appear**
4. **Check that caching works (no repeated API calls)**

---

**Simple, clean, focused on daily data and 89 EMA! 📈**
