# 🔑 Direct API Token Testing Guide

This guide shows you how to test your Trade Station API integration using a direct token (bypassing OAuth for now).

## 🚀 **Quick Test Setup**

### **Option 1: URL Parameter (Easiest)**
Add your token directly to the URL:
```
http://localhost:3000?token=YOUR_API_TOKEN_HERE
```

### **Option 2: Dashboard Button**
1. **Open** your dashboard
2. **Click** "Use API Token" button
3. **Enter** your Trade Station API token
4. **Press** Enter

## 🔍 **What Happens When You Use a Token**

1. **Dashboard updates** to show "Connected with API Token"
2. **Real API calls** are made to Trade Station
3. **Mock data is replaced** with live market data
4. **Technical indicators** are calculated from real historical data

## 📊 **API Endpoints Being Called**

### **Real-time Quotes (v2)**
```
GET https://api.tradestation.com/v2/marketdata/quotes/SPY
GET https://api.tradestation.com/v2/marketdata/quotes/SPX  
GET https://api.tradestation.com/v2/marketdata/quotes/ES
```

### **Historical Data (v3)**
```
GET https://api.tradestation.com/v3/marketdata/barcharts/@SPY?barsback=100&interval=120&unit=Minute
GET https://api.tradestation.com/v3/marketdata/barcharts/@SPX?barsback=100&interval=120&unit=Minute
GET https://api.tradestation.com/v3/marketdata/barcharts/@ES?barsback=100&interval=120&unit=Minute
```

## 🧪 **Testing Your Token**

### **1. Test in Browser Console**
```javascript
// Test if your token works
fetch('/api/tradestation-api?symbol=SPY&token=YOUR_TOKEN')
  .then(res => res.json())
  .then(data => console.log('SPY Data:', data))
  .catch(err => console.error('Error:', err))
```

### **2. Test with cURL**
```bash
curl "http://localhost:3000/api/tradestation-api?symbol=SPY&token=YOUR_TOKEN"
```

### **3. Test All Symbols**
```bash
curl "http://localhost:3000/api/tradestation-api?symbol=SPY&token=YOUR_TOKEN"
curl "http://localhost:3000/api/tradestation-api?symbol=SPX&token=YOUR_TOKEN"
curl "http://localhost:3000/api/tradestation-api?symbol=ES&token=YOUR_TOKEN"
```

## ✅ **Expected Results**

### **Successful Response:**
```json
{
  "symbol": "SPY",
  "instrumentType": "SPY",
  "price": 450.25,
  "change": 1.25,
  "volume": 48500000,
  "timestamp": "2024-01-15T14:30:00.000Z",
  "signals": {
    "signal": "BUY",
    "confidence": 0.85,
    "indicators": {
      "rsi": "32.5",
      "macd": "0.85",
      "bbPosition": "0.15",
      "vix": "N/A"
    },
    "reasoning": "RSI indicates oversold conditions, Price near lower Bollinger Band, ETF - high liquidity"
  }
}
```

### **Error Response (Invalid Token):**
```json
{
  "error": "Failed to fetch Trade Station data"
}
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Failed to fetch Trade Station data"**
- **Cause**: Invalid or expired token
- **Solution**: Get a fresh token from Trade Station

### **Issue 2: "Trade Station quotes API error: 401"**
- **Cause**: Unauthorized - token doesn't have required permissions
- **Solution**: Check your token has `MarketData` scope

### **Issue 3: "Trade Station barcharts API error: 404"**
- **Cause**: Symbol not found or invalid format
- **Solution**: Verify symbol format (SPY, SPX, ES)

### **Issue 4: "Failed to fetch real data, falling back to mock"**
- **Cause**: API call succeeded but data processing failed
- **Solution**: Check browser console for detailed error

## 🔧 **Debugging Tips**

### **1. Check Browser Console**
Look for detailed error messages and API responses.

### **2. Verify Token Permissions**
Your token needs these scopes:
- `MarketData` - for quotes and barcharts
- `ReadAccount` - optional, for account info

### **3. Check Network Tab**
In browser DevTools, see the actual API calls and responses.

### **4. Test Token Directly**
Use Postman or cURL to test your token with Trade Station directly.

## 📱 **Dashboard Indicators**

### **When Using API Token:**
- ✅ **Green dot** shows "Connected with API Token"
- ✅ **Loading message** says "Loading real market data..."
- ✅ **Description** shows "Real-time signals from Trade Station API"

### **When Using Mock Data:**
- 🔵 **Blue dot** shows "Connected to Trade Station"
- 🔵 **Loading message** says "Loading market signals..."
- 🔵 **Description** shows "Real-time signals for SPY, SPX & ES Futures via Trade Station"

## 🎯 **Next Steps After Testing**

1. ✅ **Verify token works** with all symbols
2. ✅ **Check real data** appears in dashboard
3. ✅ **Test technical indicators** are calculated correctly
4. ✅ **Deploy to Vercel** with environment variables
5. ✅ **Implement OAuth flow** for production use

## 💡 **Pro Tips**

- **Keep your token secure** - don't commit it to git
- **Test during market hours** for most accurate data
- **Monitor API rate limits** to avoid being blocked
- **Use refresh tokens** for long-term access in production

---

**Ready to test with real market data! 🚀📈**
