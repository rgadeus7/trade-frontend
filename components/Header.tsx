'use client'

import { useState } from 'react'
import { Menu, Bell, Search, User, Settings, LogOut } from 'lucide-react'
import { PortfolioData } from '@/data/mockData'

interface HeaderProps {
  onMenuClick: () => void
  portfolioData: PortfolioData
}

export default function Header({ onMenuClick, portfolioData }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button and search */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search stocks, crypto, or news..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-80"
            />
          </div>
        </div>

        {/* Center - Portfolio summary */}
        <div className="flex items-center space-x-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">Portfolio Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(portfolioData.totalValue)}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">Daily Change</p>
            <div className="flex items-center space-x-1">
              <span className={`text-lg font-semibold ${
                portfolioData.dailyChange >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                {formatCurrency(portfolioData.dailyChange)}
              </span>
              <span className={`text-sm ${
                portfolioData.dailyChangePercent >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                ({formatPercent(portfolioData.dailyChangePercent)})
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">Total P&L</p>
            <div className="flex items-center space-x-1">
              <span className={`text-lg font-semibold ${
                portfolioData.totalGainLoss >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                {formatCurrency(portfolioData.totalGainLoss)}
              </span>
              <span className={`text-sm ${
                portfolioData.totalGainLossPercent >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                ({formatPercent(portfolioData.totalGainLossPercent)})
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-danger-500 rounded-full"></span>
            </button>
            
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <p className="text-sm text-gray-900">AAPL reached your target price of $175</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <p className="text-sm text-gray-900">Your TSLA sell order was executed</p>
                    <p className="text-xs text-gray-500">15 minutes ago</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <p className="text-sm text-gray-900">Market alert: S&P 500 up 0.5%</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">John Doe</span>
            </button>
            
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
