'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import SignalDashboard from '@/components/SignalDashboard'

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <SignalDashboard />
          </div>
        </main>
      </div>
    </div>
  )
}
