import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface MarketData {
  id: number
  symbol: string
  timeframe: 'daily' | '2hour'
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  created_at: string
}

export interface Indicators {
  id: number
  symbol: string
  timeframe: 'daily' | '2hour'
  timestamp: string
  sma89: number
  ema89: number
  sma2h: number
  created_at: string
}
