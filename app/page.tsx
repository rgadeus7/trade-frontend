'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import SignalDashboard from '@/components/SignalDashboard'

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [apiToken, setApiToken] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is authenticated (has access token)
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')
    const token = urlParams.get('token') // Direct API token
    
    if (accessToken) {
      // Store token securely (in production, use proper state management)
      localStorage.setItem('tradestation_access_token', accessToken)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (token) {
      // Direct API token provided
      setApiToken(token)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else {
      // Check if token exists in localStorage
      const storedToken = localStorage.getItem('tradestation_access_token')
      if (storedToken) {
        setApiToken(storedToken)
      }
    }
  }, [])

  const handleTradeStationLogin = () => {
    window.location.href = '/api/auth/tradestation'
  }

  const handleLogout = () => {
    localStorage.removeItem('tradestation_access_token')
    setApiToken(null)
  }

  const handleDirectToken = () => {
    const token = prompt('Enter your Trade Station API token:')
    if (token) {
      setApiToken(token)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Trade Station Authentication Banner */}
            {!apiToken ? (
              <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center justify-between p-6">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Connect to Trade Station</h3>
                    <p className="text-blue-700">Get daily SPY, SPX, and ES market data with 89 EMA</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleDirectToken}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      Use API Token
                    </button>
                    <button
                      onClick={handleTradeStationLogin}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Connect Trade Station
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">
                        Connected with API Token
                      </h3>
                      <p className="text-green-700">
                        Receiving daily market data with 89 EMA
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}

            {/* S&P Market Data Dashboard */}
            <SignalDashboard apiToken={apiToken || undefined} />
          </div>
        </main>
      </div>
    </div>
  )
}
