import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trading Scenarios - TradeMatrix',
  description: 'Interactive mind map analysis for different trading strategies',
}

export default function ScenariosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {children}
    </div>
  )
}
