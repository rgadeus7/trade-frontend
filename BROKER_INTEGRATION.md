# 🏦 Broker Integration Guide - Real Market Data

This guide will help you integrate your trading dashboard with real broker APIs to get live data for **SPY**, **SPX**, and **ES Futures**.

## 🎯 **Supported Instruments**

- **SPY** - SPDR S&P 500 ETF Trust
- **SPX** - S&P 500 Index (Cash)
- **ES** - E-mini S&P 500 Futures

## 🚀 **Interactive Brokers Integration (Recommended)**

### **Option 1: IB Client Portal API (Cloud-Based - No TWS Required)**

#### **Setup Steps:**
1. **Enable API Access** in your IB account
   - Log into Interactive Brokers
   - Go to Settings → API Settings
   - Enable "Enable Active X and Socket Clients"

2. **Get API Credentials**
   - Generate API key in your account
   - Note your Client ID and Account ID

3. **Use Cloud-Based API Endpoints**
   ```typescript
   // app/api/ib-api/route.ts
   export async function GET(request: NextRequest) {
     try {
       const { searchParams } = new URL(request.url)
       const symbol = searchParams.get('symbol')
       
       // Authenticate with IB Cloud API
       const authResponse = await fetch('https://www.interactivebrokers.com/portal_proxy/v1/iserver/auth/status', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${process.env.IB_ACCESS_TOKEN}`
         }
       })
       
       if (!authResponse.ok) {
         throw new Error('IB authentication failed')
       }
       
       // Get market data from IB Cloud
       const marketDataResponse = await fetch('https://www.interactivebrokers.com/portal_proxy/v1/iserver/marketdata/snapshot', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${process.env.IB_ACCESS_TOKEN}`
         },
         body: JSON.stringify({
           conids: [getContractId(symbol)]
         })
       })
       
       const marketData = await marketDataResponse.json()
       return NextResponse.json(marketData)
     } catch (error) {
       return NextResponse.json({ error: 'Failed to fetch IB data' }, { status: 500 })
     }
   }
   ```

#### **Contract Definitions:**
   ```typescript
   function getContractId(symbol: string): number {
     const contractIds = {
       'SPY': 756733, // SPDR S&P 500 ETF
       'SPX': 138930718, // S&P 500 Index
       'ES': 138930718 // E-mini S&P 500 Futures
     }
     return contractIds[symbol as keyof typeof contractIds] || 756733
   }
   ```

### **Option 2: IB Gateway Cloud (Advanced)**

1. **Set up IB Gateway Cloud**
2. **Use cloud endpoints:**
   ```typescript
   const response = await fetch('https://api.interactivebrokers.com/v1/marketdata/snapshot', {
     method: 'POST',
     headers: { 
       'Content-Type': 'application/json',
       'X-IB-Client-Id': process.env.IB_CLIENT_ID
     },
     body: JSON.stringify({
       conids: [getContractId(symbol)]
     })
   })
   ```

## 🍰 **Tasty Trade Integration**

### **API Setup:**
1. **Get API Keys** from Tasty Trade dashboard
2. **Use REST API directly:**
   ```typescript
   const response = await fetch(`https://api.tastyworks.com/quotes/${symbol}`, {
     headers: {
       'Authorization': `Bearer ${process.env.TASTY_TOKEN}`,
       'Content-Type': 'application/json'
     }
   })
   ```

## 📊 **Trade Station Integration**

### **API Setup:**
1. **Register for Trade Station API** at [Trade Station](https://developers.tradestation.com/)
2. **Get Client ID and Secret**

### **Usage:**
```typescript
const response = await fetch(`https://api.tradestation.com/v2/marketdata/quotes/${symbol}`, {
  headers: {
    'Authorization': `Bearer ${process.env.TRADESTATION_TOKEN}`,
    'Content-Type': 'application/json'
  }
})
```

## 🔧 **Real Signal Generation**

### **Technical Indicators with Real Data:**
```typescript
// Calculate RSI from real price data
function calculateRSI(prices: number[], period: number = 14): number {
  let gains = 0
  let losses = 0
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i-1]
    if (change > 0) gains += change
    else losses += Math.abs(change)
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

// Calculate MACD
function calculateMACD(prices: number[]): { macd: number, signal: number } {
  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)
  const macd = ema12 - ema26
  const signal = calculateEMA([macd], 9)
  
  return { macd, signal }
}
```

## 📡 **Real-Time Data Streaming**

### **WebSocket Implementation:**
```typescript
// For ES Futures (24/7 trading) - use broker's WebSocket endpoints
const ws = new WebSocket('wss://api.interactivebrokers.com/ws/marketdata')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.symbol === 'ES') {
    updateSignalDashboard(data)
  }
}
```

## 🚨 **Risk Management Features**

### **Position Sizing Calculator:**
```typescript
function calculatePositionSize(
  accountValue: number,
  riskPerTrade: number,
  stopLoss: number,
  entryPrice: number
): number {
  const riskAmount = accountValue * (riskPerTrade / 100)
  const priceRisk = Math.abs(entryPrice - stopLoss)
  return riskAmount / priceRisk
}
```

### **Volatility Alerts:**
```typescript
function checkVolatility(vix: number): string {
  if (vix > 35) return 'EXTREME - Reduce position sizes'
  if (vix > 25) return 'HIGH - Use tight stops'
  if (vix > 15) return 'NORMAL - Standard risk management'
  return 'LOW - Consider wider stops'
}
```

## 🔐 **Security Best Practices**

1. **Environment Variables:**
   ```bash
   IB_ACCESS_TOKEN=your_ib_access_token
   IB_CLIENT_ID=your_client_id
   IB_ACCOUNT_ID=your_account_id
   TASTY_TOKEN=your_tasty_token
   TRADESTATION_TOKEN=your_tradestation_token
   ```

2. **API Key Rotation**
3. **Rate Limiting**
4. **Error Handling**

## 📱 **Mobile Notifications**

### **Signal Alerts:**
```typescript
// Send push notifications for high-confidence signals
if (signal.confidence >= 0.8) {
  await sendPushNotification({
    title: `${symbol} ${signal.signal} Signal`,
    body: `Confidence: ${(signal.confidence * 100).toFixed(0)}%`,
    data: { symbol, signal: signal.signal }
  })
}
```

## 🎯 **Next Steps**

1. **Choose your primary broker** (IB recommended for futures)
2. **Enable API access** in your broker account
3. **Get API credentials** (tokens, client IDs)
4. **Replace mock data** with real API calls
5. **Test with paper trading** first
6. **Implement real-time updates** for live signals
7. **Add risk management** features
8. **Set up alerts** for high-confidence signals

## 📚 **Resources**

- [Interactive Brokers Client Portal API](https://www.interactivebrokers.com/portal_proxy/v1/iserver)
- [IB Cloud Gateway](https://www.interactivebrokers.com/portal_proxy/v1/iserver)
- [Tasty Trade API](https://tastyworks.com/api)
- [Trade Station API](https://developers.tradestation.com/)
- [S&P 500 Futures (ES) Specifications](https://www.cmegroup.com/trading/equity-index/us-index/e-mini-sandp500.html)

---

**Ready to trade with real data! 🚀📈**
