'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import SignalDashboard from '@/components/SignalDashboard'

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Database Connection Status */}
            <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">
                      Connected to Database
                    </h3>
                    <p className="text-green-700">
                      Reading market data from Supabase
                    </p>
                  </div>
                </div>
                <div className="text-sm text-green-600">
                  Ready to display data
                </div>
              </div>
            </div>

            {/* S&P Market Data Dashboard */}
            <SignalDashboard />
          </div>
        </main>
      </div>
    </div>
  )
}
