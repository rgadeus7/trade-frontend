'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import PortfolioOverview from '@/components/PortfolioOverview'
import MarketWatch from '@/components/MarketWatch'
import TradingChart from '@/components/TradingChart'
import RecentTrades from '@/components/RecentTrades'
import NewsFeed from '@/components/NewsFeed'
import { mockPortfolioData, mockMarketData, mockTradeData, mockNewsData } from '@/data/mockData'

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [portfolioData, setPortfolioData] = useState(mockPortfolioData)
  const [marketData, setMarketData] = useState(mockMarketData)
  const [tradeData, setTradeData] = useState(mockTradeData)
  const [newsData, setNewsData] = useState(mockNewsData)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update portfolio values with small random changes
      setPortfolioData(prev => ({
        ...prev,
        totalValue: prev.totalValue * (1 + (Math.random() - 0.5) * 0.02),
        dailyChange: prev.dailyChange * (1 + (Math.random() - 0.5) * 0.1),
        positions: prev.positions.map(pos => ({
          ...pos,
          currentPrice: pos.currentPrice * (1 + (Math.random() - 0.5) * 0.01),
          change: pos.change * (1 + (Math.random() - 0.5) * 0.1)
        }))
      }))

      // Update market data
      setMarketData(prev => ({
        ...prev,
        indices: prev.indices.map(index => ({
          ...index,
          value: index.value * (1 + (Math.random() - 0.5) * 0.005),
          change: index.change * (1 + (Math.random() - 0.5) * 0.1)
        }))
      }))
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          portfolioData={portfolioData}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Portfolio Overview */}
            <PortfolioOverview data={portfolioData} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Market Watch */}
              <div className="lg:col-span-2">
                <MarketWatch data={marketData} />
              </div>
              
              {/* Recent Trades */}
              <div>
                <RecentTrades data={tradeData} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trading Chart */}
              <div className="lg:col-span-2">
                <TradingChart />
              </div>
              
              {/* News Feed */}
              <div>
                <NewsFeed data={newsData} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
