'use client'

import { useState } from 'react'
import { Bell, User, Settings, Menu } from 'lucide-react'
import { PortfolioData } from '@/data/mockData'

interface HeaderProps {
  onMenuClick: () => void
  portfolioData?: PortfolioData // Make optional
}

export default function Header({ onMenuClick, portfolioData }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Trading Dashboard</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Portfolio Summary - Only show if portfolioData is provided */}
          {portfolioData && (
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">Portfolio Value</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(portfolioData.totalValue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Today's P&L</p>
                <p className={`text-lg font-semibold ${
                  portfolioData.dailyChange >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {formatCurrency(portfolioData.dailyChange)}
                </p>
              </div>
            </div>
          )}

          {/* Notifications */}
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <User className="h-5 w-5" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Settings
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Sign out
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
