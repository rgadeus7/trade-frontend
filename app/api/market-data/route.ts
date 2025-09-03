import { NextRequest, NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/database'

// Force dynamic rendering to avoid static generation issues with search params
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const symbol = searchParams.get('symbol')

    if (symbol) {
      // Get data for specific symbol - getDashboardData already returns an array
      const data = await getDashboardData(symbol)
      return NextResponse.json(data)
    } else {
      // Get data for all symbols
      const data = await getDashboardData()
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
