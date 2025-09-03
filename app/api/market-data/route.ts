import { NextRequest, NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/database'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering to avoid static generation issues with search params
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client with user token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Verify the token is valid
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' }, 
        { status: 401 }
      )
    }

    // User is authenticated, proceed with data fetch
    const { searchParams } = request.nextUrl
    const symbol = searchParams.get('symbol')

    if (symbol) {
      // Get data for specific symbol
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
