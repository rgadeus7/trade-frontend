'use client'

import { 
  Home, 
  TrendingUp, 
  BarChart3, 
  Wallet, 
  History, 
  Newspaper, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  isOpen: boolean
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('dashboard')

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    // Temporarily hidden - uncomment when ready to implement
    // { id: 'trading', label: 'Trading', icon: TrendingUp },
    // { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    // { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    // { id: 'history', label: 'Trade History', icon: History },
    // { id: 'news', label: 'News & Research', icon: Newspaper },
    // { id: 'settings', label: 'Settings', icon: Settings },
    // { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ]

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
                     {isOpen && (
             <h1 className="text-xl font-bold text-gradient">TradeMatrix</h1>
           )}
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">TP</span>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeItem === item.id
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Quick Actions - Temporarily hidden for clean interface */}
        {/* {isOpen && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full btn-primary text-sm">
                New Trade
              </button>
              <button className="w-full btn-secondary text-sm">
                Deposit Funds
              </button>
            </div>
          </div>
        )} */}


      </div>
    </div>
  )
}
