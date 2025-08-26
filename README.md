# 🚀 S&P Market Signals Dashboard

A professional Next.js trading dashboard focused on **SPY**, **SPX**, and **ES Futures** with real-time market signals and technical analysis.

## 🎯 **Features**

- **Real-time S&P Market Signals** for SPY, SPX, and ES
- **Professional Trading Dashboard** with modern UI
- **Trade Station API Integration** for live market data
- **Technical Indicators**: RSI, MACD, Bollinger Bands, VIX
- **Responsive Design** optimized for all devices
- **OAuth 2.0 Authentication** with Trade Station
- **Real-time Data Updates** every 15 seconds
- **Signal Confidence Scoring** with risk alerts

## 🏦 **Broker Integration**

This dashboard integrates with **Trade Station** for real market data:

- ✅ **SPY** - SPDR S&P 500 ETF Trust
- ✅ **SPX** - S&P 500 Index (Cash)
- ✅ **ES** - E-mini S&P 500 Futures

## 🚀 **Quick Start**

### **1. Clone & Install**
```bash
git clone <your-repo-url>
cd trading-dashboard
npm install
```

### **2. Set Up Trade Station API**
1. **Get API credentials** from [Trade Station Developers](https://developers.tradestation.com/)
2. **Copy environment template:**
   ```bash
   cp env.example .env.local
   ```
3. **Fill in your credentials** in `.env.local`

### **3. Run Development Server**
```bash
npm run dev
```

### **4. Connect to Trade Station**
1. **Click "Connect Trade Station"** on the dashboard
2. **Log in** with your Trade Station credentials
3. **Authorize** the application
4. **Start receiving** real market signals!

## 🔑 **Trade Station Setup**

### **Step 1: Create Developer Account**
1. Visit [Trade Station Developers](https://developers.tradestation.com/)
2. Click **"Get API Key"**
3. **Sign up** for a free developer account

### **Step 2: Create Application**
1. **Log into** Trade Station Developer Portal
2. Click **"Create New App"**
3. **Configure your app:**
   - **App Name**: `Trading Signals Dashboard`
   - **Callback URLs**: 
     ```
     https://your-app.vercel.app/api/auth/callback
     http://localhost:3000/api/auth/callback
     ```

### **Step 3: Get Credentials**
After creating your app, you'll receive:
- **Client ID**
- **Client Secret**

### **Step 4: Environment Variables**
Create `.env.local` with your credentials:
```bash
TRADESTATION_CLIENT_ID=your_client_id_here
TRADESTATION_CLIENT_SECRET=your_client_secret_here
TRADESTATION_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
```

## 🚀 **Deploy to Vercel**

### **1. Push to GitHub**
```bash
git add .
git commit -m "Add Trade Station integration"
git push origin main
```

### **2. Deploy on Vercel**
1. **Import** your GitHub repository
2. **Add environment variables** in Vercel dashboard
3. **Deploy** automatically

### **3. Update Callback URLs**
In Trade Station Developer Portal, update callback URLs to your Vercel domain.

## 🏗️ **Project Structure**

```
trading-dashboard/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── tradestation/     # Trade Station OAuth
│   │   │   └── callback/         # OAuth callback handler
│   │   └── tradestation-api/     # Market data API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Main dashboard
├── components/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── SignalDashboard.tsx       # S&P signals dashboard
│   ├── PortfolioOverview.tsx
│   ├── MarketWatch.tsx
│   ├── TradingChart.tsx
│   ├── RecentTrades.tsx
│   └── NewsFeed.tsx
├── data/
│   └── mockData.ts               # Sample data (replaced by real API)
├── env.example                    # Environment variables template
├── TRADESTATION_SETUP.md         # Detailed setup guide
└── package.json
```

## 🔧 **API Endpoints**

### **Authentication**
- `GET /api/auth/tradestation` - Start OAuth flow
- `GET /api/auth/callback` - Handle OAuth callback

### **Market Data**
- `GET /api/tradestation-api?symbol=SPY` - Get SPY data
- `GET /api/tradestation-api?symbol=SPX` - Get SPX data
- `GET /api/tradestation-api?symbol=ES` - Get ES data

## 📊 **Signal Generation**

The dashboard generates trading signals based on:

- **RSI (Relative Strength Index)** - Oversold/overbought conditions
- **MACD** - Momentum and trend changes
- **Bollinger Bands** - Volatility and price extremes
- **VIX Impact** - Market fear and volatility
- **Market Hours** - Higher confidence during active trading

## 🚨 **Risk Management**

- **Signal Confidence Scoring** (0-100%)
- **High Conviction Alerts** for signals ≥80%
- **Risk Warnings** for volatile market conditions
- **Position Sizing Recommendations**

## 🎨 **UI Components**

- **Modern Card Design** with Tailwind CSS
- **Responsive Grid Layouts** for all screen sizes
- **Real-time Updates** with smooth animations
- **Professional Color Scheme** optimized for trading
- **Interactive Charts** with Recharts library

## 🔒 **Security Features**

- **OAuth 2.0 Authentication** with Trade Station
- **Secure Token Storage** (localStorage for demo, database for production)
- **Environment Variables** for sensitive credentials
- **CSRF Protection** with state parameters

## 📱 **Mobile Responsiveness**

- **Mobile-first design** approach
- **Touch-friendly** interface elements
- **Responsive charts** and data tables
- **Optimized navigation** for small screens

## 🚀 **Performance**

- **Next.js 14** with App Router
- **Server-side rendering** for fast initial loads
- **Optimized images** and assets
- **Efficient data fetching** with caching

## 🧪 **Testing**

### **Local Development**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### **API Testing**
Test your Trade Station integration:
```bash
# Test authentication
curl http://localhost:3000/api/auth/tradestation

# Test market data (after authentication)
curl "http://localhost:3000/api/tradestation-api?symbol=SPY"
```

## 📚 **Documentation**

- **[Trade Station Setup Guide](TRADESTATION_SETUP.md)** - Complete integration guide
- **[Broker Integration Guide](BROKER_INTEGRATION.md)** - Alternative broker options
- **[Deployment Guide](DEPLOYMENT.md)** - Vercel deployment steps

## 🤝 **Contributing**

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Trade Station API Issues**: [Trade Station Support](https://developers.tradestation.com/support)
- **Dashboard Issues**: Create an issue in this repository
- **General Questions**: Check the setup guides above

---

**Ready to trade with real market data! 🚀📈**

*Built with Next.js, TypeScript, Tailwind CSS, and Trade Station API*
