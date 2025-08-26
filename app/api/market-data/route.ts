import { NextRequest, NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/database'

// Force dynamic rendering to avoid static generation issues with search params
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('API route called')
    const { searchParams } = request.nextUrl
    const symbol = searchParams.get('symbol')

    if (symbol) {
      // Get data for specific symbol
      const data = await getDashboardData()
      const symbolData = data.find(item => item.symbol === symbol)
      
      if (!symbolData) {
        return NextResponse.json({ error: 'Symbol not found' }, { status: 404 })
      }
      
      return NextResponse.json(symbolData)
    } else {
      // Get data for all symbols
      const data = await getDashboardData()
      console.log('API returning data:', data)
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Error fetching market data from database:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data' }, 
      { status: 500 }
    )
  }
}
