import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('market_data')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('Database connection error:', testError)
      return NextResponse.json({ error: 'Database connection failed', details: testError }, { status: 500 })
    }
    
    // Get all data
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(200)
    
    if (error) {
      console.error('Error fetching data:', error)
      return NextResponse.json({ error: 'Failed to fetch data', details: error }, { status: 500 })
    }
    
    console.log('Database test successful, found', data?.length, 'records')
    
    // Check specifically for 2-hour data
    const twoHourData = data?.filter(item => item.timeframe === '2hour')
    console.log('2-hour data found:', twoHourData?.length || 0)
    
    // Group by symbol and timeframe
    const grouped = data?.reduce((acc, item) => {
      const key = `${item.symbol}-${item.timeframe}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(item)
      return acc
    }, {} as Record<string, any[]>)
    
    return NextResponse.json({
      totalRecords: data?.length || 0,
      twoHourRecords: twoHourData?.length || 0,
      groupedData: grouped,
      rawData: data?.slice(0, 10), // First 10 records
      twoHourData: twoHourData?.slice(0, 5) // First 5 2-hour records
    })
    
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ error: 'Test failed', details: error }, { status: 500 })
  }
}
