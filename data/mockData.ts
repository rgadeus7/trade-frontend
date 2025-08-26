export interface PortfolioPosition {
  symbol: string
  name: string
  shares: number
  currentPrice: number
  change: number
  changePercent: number
  marketValue: number
  costBasis: number
  gainLoss: number
  gainLossPercent: number
}

export interface PortfolioData {
  totalValue: number
  dailyChange: number
  dailyChangePercent: number
  totalGainLoss: number
  totalGainLossPercent: number
  positions: PortfolioPosition[]
}

export interface MarketIndex {
  name: string
  symbol: string
  value: number
  change: number
  changePercent: number
}

export interface MarketData {
  indices: MarketIndex[]
  topGainers: Array<{
    symbol: string
    name: string
    price: number
    change: number
    changePercent: number
  }>
  topLosers: Array<{
    symbol: string
    name: string
    price: number
    change: number
    changePercent: number
  }>
}

export interface Trade {
  id: string
  symbol: string
  type: 'buy' | 'sell'
  shares: number
  price: number
  timestamp: string
  status: 'completed' | 'pending' | 'cancelled'
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  timestamp: string
  sentiment: 'positive' | 'negative' | 'neutral'
  impact: 'high' | 'medium' | 'low'
}

export const mockPortfolioData: PortfolioData = {
  totalValue: 125847.32,
  dailyChange: 2341.67,
  dailyChangePercent: 1.89,
  totalGainLoss: 15678.45,
  totalGainLossPercent: 14.23,
  positions: [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 50,
      currentPrice: 175.43,
      change: 2.34,
      changePercent: 1.35,
      marketValue: 8771.50,
      costBasis: 8125.00,
      gainLoss: 646.50,
      gainLossPercent: 7.96
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      shares: 25,
      currentPrice: 245.67,
      change: -5.23,
      changePercent: -2.08,
      marketValue: 6141.75,
      costBasis: 5875.00,
      gainLoss: 266.75,
      gainLossPercent: 4.54
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 30,
      currentPrice: 325.89,
      change: 4.56,
      changePercent: 1.42,
      marketValue: 9776.70,
      costBasis: 9150.00,
      gainLoss: 626.70,
      gainLossPercent: 6.85
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      shares: 20,
      currentPrice: 128.45,
      change: 1.23,
      changePercent: 0.97,
      marketValue: 2569.00,
      costBasis: 2400.00,
      gainLoss: 169.00,
      gainLossPercent: 7.04
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      shares: 15,
      currentPrice: 145.67,
      change: 3.45,
      changePercent: 2.42,
      marketValue: 2185.05,
      costBasis: 1950.00,
      gainLoss: 235.05,
      gainLossPercent: 12.05
    }
  ]
}

export const mockMarketData: MarketData = {
  indices: [
    {
      name: 'S&P 500',
      symbol: 'SPX',
      value: 4567.89,
      change: 23.45,
      changePercent: 0.52
    },
    {
      name: 'NASDAQ',
      symbol: 'NDX',
      value: 14234.56,
      change: 67.89,
      changePercent: 0.48
    },
    {
      name: 'DOW JONES',
      symbol: 'DJI',
      value: 34567.89,
      change: 123.45,
      changePercent: 0.36
    }
  ],
  topGainers: [
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 485.67, change: 23.45, changePercent: 5.08 },
    { symbol: 'AMD', name: 'Advanced Micro Devices', price: 123.45, change: 5.67, changePercent: 4.82 },
    { symbol: 'CRM', name: 'Salesforce Inc.', price: 234.56, change: 8.90, changePercent: 3.95 }
  ],
  topLosers: [
    { symbol: 'WMT', name: 'Walmart Inc.', price: 156.78, change: -4.56, changePercent: -2.82 },
    { symbol: 'KO', name: 'Coca-Cola Company', price: 54.32, change: -1.23, changePercent: -2.21 },
    { symbol: 'PG', name: 'Procter & Gamble', price: 145.67, change: -2.34, changePercent: -1.58 }
  ]
}

export const mockTradeData: Trade[] = [
  {
    id: '1',
    symbol: 'AAPL',
    type: 'buy',
    shares: 10,
    price: 175.43,
    timestamp: '2024-01-15T14:30:00Z',
    status: 'completed'
  },
  {
    id: '2',
    symbol: 'TSLA',
    type: 'sell',
    shares: 5,
    price: 245.67,
    timestamp: '2024-01-15T13:45:00Z',
    status: 'completed'
  },
  {
    id: '3',
    symbol: 'MSFT',
    type: 'buy',
    shares: 15,
    price: 325.89,
    timestamp: '2024-01-15T12:15:00Z',
    status: 'pending'
  },
  {
    id: '4',
    symbol: 'GOOGL',
    type: 'buy',
    shares: 8,
    price: 128.45,
    timestamp: '2024-01-15T11:30:00Z',
    status: 'completed'
  },
  {
    id: '5',
    symbol: 'AMZN',
    type: 'sell',
    shares: 12,
    price: 145.67,
    timestamp: '2024-01-15T10:45:00Z',
    status: 'completed'
  }
]

export const mockNewsData: NewsItem[] = [
  {
    id: '1',
    title: 'Federal Reserve Signals Potential Rate Cuts in 2024',
    summary: 'The Federal Reserve has indicated a more dovish stance, suggesting potential interest rate cuts in the coming year.',
    source: 'Financial Times',
    timestamp: '2024-01-15T15:00:00Z',
    sentiment: 'positive',
    impact: 'high'
  },
  {
    id: '2',
    title: 'Tech Stocks Rally on Strong Earnings Reports',
    summary: 'Major technology companies report better-than-expected earnings, driving market optimism.',
    source: 'Bloomberg',
    timestamp: '2024-01-15T14:30:00Z',
    sentiment: 'positive',
    impact: 'medium'
  },
  {
    id: '3',
    title: 'Oil Prices Decline Amid Global Economic Concerns',
    summary: 'Crude oil prices fall as investors worry about global economic growth and demand.',
    source: 'Reuters',
    timestamp: '2024-01-15T14:00:00Z',
    sentiment: 'negative',
    impact: 'medium'
  },
  {
    id: '4',
    title: 'Cryptocurrency Market Shows Signs of Recovery',
    summary: 'Bitcoin and other cryptocurrencies gain momentum as institutional adoption increases.',
    source: 'CoinDesk',
    timestamp: '2024-01-15T13:30:00Z',
    sentiment: 'positive',
    impact: 'low'
  },
  {
    id: '5',
    title: 'Housing Market Data Shows Mixed Signals',
    summary: 'Recent housing market indicators present conflicting data on the state of real estate.',
    source: 'Wall Street Journal',
    timestamp: '2024-01-15T13:00:00Z',
    sentiment: 'neutral',
    impact: 'low'
  }
]
