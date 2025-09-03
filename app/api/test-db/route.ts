import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('market_data')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('Database connection error:', connectionError)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: connectionError.message 
      }, { status: 500 })
    }

    // Check if we have any market data
    const { data: marketDataCount, error: countError } = await supabase
      .from('market_data')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Count query error:', countError)
      return NextResponse.json({ 
        error: 'Count query failed', 
        details: countError.message 
      }, { status: 500 })
    }

    // Check for SPX data specifically
    const { data: spxData, error: spxError } = await supabase
      .from('market_data')
      .select('*')
      .eq('symbol', '$SPX.X')
      .limit(5)
    
    if (spxError) {
      console.error('SPX query error:', spxError)
      return NextResponse.json({ 
        error: 'SPX query failed', 
        details: spxError.message 
      }, { status: 500 })
    }

    // Check for any symbols in the database
    const { data: symbols, error: symbolsError } = await supabase
      .from('market_data')
      .select('symbol')
      .limit(10)
    
    if (symbolsError) {
      console.error('Symbols query error:', symbolsError)
      return NextResponse.json({ 
        error: 'Symbols query failed', 
        details: symbolsError.message 
      }, { status: 500 })
    }

    // Get unique symbols
    const uniqueSymbols = Array.from(new Set(symbols?.map(s => s.symbol) || []))

    return NextResponse.json({
      success: true,
      connection: 'OK',
      totalRecords: marketDataCount?.length || 0,
      spxRecords: spxData?.length || 0,
      availableSymbols: uniqueSymbols,
      sampleSpxData: spxData?.slice(0, 2) || [],
      message: 'Database connection and queries successful'
    })

  } catch (error) {
    console.error('Unexpected error in test-db:', error)
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
