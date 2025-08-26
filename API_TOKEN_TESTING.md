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
2. **Real API calls** are made to Trade Station (6 calls total: 2 per symbol)
3. **Mock data is replaced** with live market data
4. **Technical indicators** are calculated from real historical data
5. **Both daily and 2-hour data** are displayed

## 📊 **API Endpoints Being Called**

### **Dual Timeframe Data (v3)**
For each symbol (SPY, SPX, ES), we make 2 API calls:

#### **Daily Data:**
```
GET https://api.tradestation.com/v3/marketdata/barcharts/SPY?barsback=1000&interval=1&unit=Daily
GET https://api.tradestation.com/v3/marketdata/barcharts/$SPX.X?barsback=1000&interval=1&unit=Daily
GET https://api.tradestation.com/v3/marketdata/barcharts/@ES?barsback=1000&interval=1&unit=Daily
```

#### **2-Hour Data (120-minute intervals):**
```
GET https://api.tradestation.com/v3/marketdata/barcharts/SPY?barsback=1000&interval=120&unit=Minute
GET https://api.tradestation.com/v3/marketdata/barcharts/$SPX.X?barsback=1000&interval=120&unit=Minute
GET https://api.tradestation.com/v3/marketdata/barcharts/@ES?barsback=1000&interval=120&unit=Minute
```

### **Symbol Formats:**
- **SPY:** `SPY` (plain symbol)
- **SPX:** `$SPX.X` (index format)
- **ES:** `@ES` (futures format)

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
  "daily": {
    "price": 642.47,
    "change": 1.25,
    "volume": 51274332,
    "timestamp": "2025-08-25T20:00:00Z"
  },
  "hourly": {
    "price": 642.15,
    "change": 0.15,
    "volume": 12500000,
    "timestamp": "2025-08-25T18:00:00Z"
  },
  "sma89": 635.82,
  "ema89": 638.45,
  "sma2h": 641.23
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

### **Issue 2: "Trade Station API error: 401"**
- **Cause**: Unauthorized - token doesn't have required permissions
- **Solution**: Check your token has `MarketData` scope

### **Issue 3: "Trade Station API error: 404"**
- **Cause**: Symbol not found or invalid format
- **Solution**: Verify symbol format (SPY, $SPX.X, @ES)

### **Issue 4: "Failed to fetch real data, falling back to mock"**
- **Cause**: API call succeeded but data processing failed
- **Solution**: Check browser console for detailed error

## 🔧 **Debugging Tips**

### **1. Check Browser Console**
Look for detailed error messages and API responses. You'll see:
- API call URLs being made
- Response status codes
- Raw Trade Station responses
- Transformation steps

### **2. Verify Token Permissions**
Your token needs these scopes:
- `MarketData` - for quotes and barcharts
- `ReadAccount` - optional, for account info

### **3. Check Network Tab**
In browser DevTools, see the actual API calls and responses.

### **4. Test Token Directly**
Use Postman or cURL to test your token with Trade Station directly.

## 📊 **What You'll See in Dashboard**

### **For Each Instrument (SPY, SPX, ES):**

#### **📅 Daily Data Section (Gray):**
- **Daily Price** - Latest daily closing price
- **Daily Change** - Percentage change from previous day
- **Volume (Daily)** - Daily trading volume

#### **⏰ 2-Hour Data Section (Purple):**
- **2-Hour Price** - Latest 2-hour closing price
- **2-Hour Change** - Percentage change from previous 2-hour period

#### **📊 Technical Indicators:**
- **89 SMA** - Simple Moving Average (calculated from daily data) - Green section
- **89 EMA** - Exponential Moving Average (calculated from daily data) - Blue section
- **2-Hour SMA** - 89-period SMA (calculated from 2-hour data) - Purple section
- **Position Indicators** - Above/Below SMA/EMA with distances

## 📱 **Dashboard Indicators**

### **When Using API Token:**
- ✅ **Green dot** shows "Connected with API Token"
- ✅ **Loading message** says "Loading real market data from Trade Station..."
- ✅ **Description** shows "Daily & 2-hour data from Trade Station API"
- ✅ **Refresh button** available for manual updates

### **When Using Mock Data:**
- 🔵 **Gray dot** shows "Using mock data - Add API token for real data"
- 🔵 **Description** shows "Daily & 2-hour market data for SPY, SPX & ES (Mock Data)"

## 🎯 **Next Steps After Testing**

1. ✅ **Verify token works** with all symbols
2. ✅ **Check both timeframes** display correctly
3. ✅ **Test technical indicators** are calculated correctly
4. ✅ **Verify 2-hour SMA** is calculated from 2-hour data
5. ✅ **Deploy to Vercel** with environment variables
6. ✅ **Implement OAuth flow** for production use

## 💡 **Pro Tips**

- **Keep your token secure** - don't commit it to git
- **Test during market hours** for most accurate data
- **Monitor API rate limits** to avoid being blocked
- **Use refresh tokens** for long-term access in production
- **Check console logs** for detailed API call information

---

**Ready to test with real market data across multiple timeframes! 🚀📈**
