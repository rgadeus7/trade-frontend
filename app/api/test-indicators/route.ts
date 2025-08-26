import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing indicators table...')
    
    // Get all indicators data
    const { data, error } = await supabase
      .from('indicators')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)
    
    if (error) {
      console.error('Error fetching indicators:', error)
      return NextResponse.json({ error: 'Failed to fetch indicators', details: error }, { status: 500 })
    }
    
    console.log('Indicators test successful, found', data?.length, 'records')
    
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
      groupedData: grouped,
      rawData: data?.slice(0, 10) // First 10 records
    })
    
  } catch (error) {
    console.error('Test indicators endpoint error:', error)
    return NextResponse.json({ error: 'Test failed', details: error }, { status: 500 })
  }
}
