# 🚀 Trade Station API Integration Guide

This guide will walk you through setting up Trade Station API integration for your S&P Market Signals Dashboard.

## 🎯 **What You'll Get:**

- **Real-time SPY, SPX, ES data** from Trade Station
- **OAuth 2.0 authentication** - secure and professional
- **Market data streaming** for live signals
- **Professional API** with good documentation
- **Real technical indicators** calculated from historical data

## 🔑 **Step 1: Get Trade Station API Credentials**

### **1.1 Create Developer Account**
1. Go to [Trade Station Developers](https://developers.tradestation.com/)
2. Click **"Get API Key"**
3. **Sign up** for a free developer account
4. **Verify your email**

### **1.2 Create Application**
1. **Log into** Trade Station Developer Portal
2. Click **"Create New App"**
3. **Fill in app details:**
   - **App Name**: `Trading Signals Dashboard`
   - **Description**: `Real-time S&P market signals dashboard`
   - **Website**: `https://your-app.vercel.app`
   - **Callback URLs**: 
     ```
     https://your-app.vercel.app/api/auth/callback
     http://localhost:3000/api/auth/callback
     ```

### **1.3 Get Your Credentials**
After creating your app, you'll get:
- **Client ID** (looks like: `abc123def456`)
- **Client Secret** (looks like: `xyz789uvw012`)

## 🔐 **Step 2: Set Up OAuth Authentication**

### **2.1 Environment Variables**
Create or update your `.env.local` file:

```bash
# .env.local
TRADESTATION_CLIENT_ID=your_client_id_here
TRADESTATION_CLIENT_SECRET=your_client_secret_here
TRADESTATION_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
TRADESTATION_AUTH_URL=https://signin.tradestation.com/authorize
TRADESTATION_TOKEN_URL=https://signin.tradestation.com/oauth/token
TRADESTATION_API_URL=https://api.tradestation.com/v2
```

### **2.2 OAuth Flow Implementation**
Based on the [Trade Station Auth Code Flow documentation](https://api.tradestation.com/docs/fundamentals/authentication/auth-code), here's how to implement authentication:

```typescript
// app/api/auth/tradestation/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authUrl = `https://signin.tradestation.com/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.TRADESTATION_CLIENT_ID}&` +
    `redirect_uri=${process.env.TRADESTATION_REDIRECT_URI}&` +
    `audience=https://api.tradestation.com&` +
    `scope=openid profile offline_access MarketData ReadAccount&` +
    `state=${generateRandomState()}`

  return NextResponse.redirect(authUrl)
}

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15)
}
```

### **2.3 Callback Handler**
```typescript
// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.json({ error: 'Authorization code not received' }, { status: 400 })
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://signin.tradestation.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.TRADESTATION_CLIENT_ID!,
        client_secret: process.env.TRADESTATION_CLIENT_SECRET!,
        code: code,
        redirect_uri: process.env.TRADESTATION_REDIRECT_URI!,
      }),
    })

    const tokens = await tokenResponse.json()
    
    // Store tokens securely (in production, use a database)
    // For now, we'll redirect with tokens in URL (not secure for production)
    return NextResponse.redirect(`/dashboard?access_token=${tokens.access_token}`)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 500 })
  }
}
```

## 📊 **Step 3: Get Real Market Data**

### **3.1 Two API Endpoints You Need**

Your dashboard uses **BOTH** Trade Station API endpoints:

#### **Endpoint 1: Real-time Quotes (v2)**
```typescript
GET https://api.tradestation.com/v2/marketdata/quotes/{symbol}
```
- **Purpose**: Current price, change, volume
- **Use case**: Live signal generation
- **Example**: `https://api.tradestation.com/v2/marketdata/quotes/SPY`

#### **Endpoint 2: Historical Data (v3)**
```typescript
GET https://api.tradestation.com/v3/marketdata/barcharts/@{symbol}?barsback=100&interval=120&unit=Minute
```
- **Purpose**: Historical OHLC data for technical analysis
- **Use case**: Calculate RSI, MACD, Bollinger Bands
- **Example**: `https://api.tradestation.com/v3/marketdata/barcharts/@ES?barsback=100&interval=120&unit=Minute`

### **3.2 Update Your API Route**
Replace the mock data in `app/api/tradestation-api/route.ts`:

```typescript
// Real Trade Station API integration using BOTH v2 and v3 endpoints
async function getRealTradeStationData(symbol: string) {
  try {
    // First, check if we have a valid access token
    let accessToken = await getValidAccessToken()
    
    if (!accessToken) {
      // Need to authenticate - redirect user to Trade Station login
      throw new Error('Authentication required')
    }
    
    // 1. Get current market data (v2 quotes endpoint)
    const quotesResponse = await fetch(`https://api.tradestation.com/v2/marketdata/quotes/${symbol}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!quotesResponse.ok) {
      throw new Error(`Trade Station quotes API error: ${quotesResponse.status}`)
    }
    
    const quotesData = await quotesResponse.json()
    
    // 2. Get historical data for technical indicators (v3 barcharts endpoint)
    const barchartsResponse = await fetch(`https://api.tradestation.com/v3/marketdata/barcharts/@${symbol}?barsback=100&interval=120&unit=Minute`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!barchartsResponse.ok) {
      throw new Error(`Trade Station barcharts API error: ${barchartsResponse.status}`)
    }
    
    const barchartsData = await barchartsResponse.json()
    
    // 3. Calculate real technical indicators from historical data
    const technicalIndicators = calculateRealTechnicalIndicators(barchartsData)
    
    // 4. Combine real-time data with technical analysis
    return transformTradeStationData(quotesData, symbol, technicalIndicators)
  } catch (error) {
    console.error('Failed to fetch real Trade Station data:', error)
    // Fall back to mock data
    return null
  }
}
```

### **3.3 Required Scopes**
Make sure your OAuth request includes these scopes:
```
openid profile offline_access MarketData ReadAccount
```

- **`openid`**: Required for authentication
- **`profile`**: User profile information
- **`offline_access`**: Refresh tokens for long-term access
- **`MarketData`**: Access to market quotes and data
- **`ReadAccount`**: Account information (optional)

## 🚀 **Step 4: Deploy to Vercel**

### **4.1 Environment Variables in Vercel**
1. Go to your Vercel dashboard
2. **Select your project**
3. Go to **Settings** → **Environment Variables**
4. **Add all your Trade Station variables:**
   ```
   TRADESTATION_CLIENT_ID=your_client_id
   TRADESTATION_CLIENT_SECRET=your_client_secret
   TRADESTATION_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
   ```

### **4.2 Update Callback URLs**
In Trade Station Developer Portal, update your callback URLs:
```
https://your-app.vercel.app/api/auth/callback
```

## 🔧 **Step 5: Test Your Integration**

### **5.1 Test Authentication**
1. **Visit** `/api/auth/tradestation`
2. **Log in** with Trade Station credentials
3. **Authorize** your application
4. **Check** if you get redirected back with tokens

### **5.2 Test Market Data**
1. **Get a valid access token**
2. **Test quotes endpoint**: `GET /api/tradestation-api?symbol=SPY`
3. **Verify** you get real data instead of mock data

### **5.3 Test Historical Data**
The barcharts endpoint will automatically be called when you fetch quotes, providing:
- **100 bars** of historical data
- **2-minute intervals** (120 seconds)
- **OHLC data** for technical analysis

## 🚨 **Important Security Notes**

### **Token Management:**
- **Access tokens expire** in 20 minutes
- **Use refresh tokens** to get new access tokens
- **Store tokens securely** (database, not localStorage)
- **Never expose** client secret in frontend code

### **Rate Limiting:**
- **Respect API limits** to avoid being blocked
- **Implement caching** for frequently requested data
- **Use WebSocket** for real-time updates when possible

## 📱 **Advanced Features**

### **Real-Time Streaming:**
```typescript
// For real-time ES futures data (24/7 trading)
const ws = new WebSocket('wss://api.tradestation.com/ws/marketdata')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.symbol === 'ES') {
    updateSignalDashboard(data)
  }
}
```

### **Custom Timeframes:**
```typescript
// Get different historical data intervals
const intervals = {
  '1M': '1&unit=Minute',      // 1 minute bars
  '5M': '5&unit=Minute',      // 5 minute bars
  '15M': '15&unit=Minute',    // 15 minute bars
  '1H': '60&unit=Minute',     // 1 hour bars
  '1D': '1&unit=Day'          // 1 day bars
}

// Example: Get 1-hour bars for the last 50 periods
const response = await fetch(`https://api.tradestation.com/v3/marketdata/barcharts/@${symbol}?barsback=50&interval=60&unit=Minute`)
```

## 🎯 **Next Steps**

1. ✅ **Get Trade Station API credentials**
2. ✅ **Set up OAuth authentication**
3. ✅ **Implement real data fetching** (both v2 and v3)
4. ✅ **Deploy to Vercel**
5. ✅ **Test with real market data**
6. ✅ **Add real-time streaming**
7. ✅ **Implement technical indicators** with real data

## 📚 **Resources**

- [Trade Station API Documentation](https://api.tradestation.com/docs)
- [Authentication Guide](https://api.tradestation.com/docs/fundamentals/authentication/auth-code)
- [Market Data Endpoints](https://api.tradestation.com/docs/market-data)
- [Barcharts API (v3)](https://api.tradestation.com/docs/market-data/barcharts)
- [Quotes API (v2)](https://api.tradestation.com/docs/market-data/quotes)
- [WebSocket Streaming](https://api.tradestation.com/docs/streaming)

---

**Ready to get real market data with professional technical analysis! 🚀📈**
