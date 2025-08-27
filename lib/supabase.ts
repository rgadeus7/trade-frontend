import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

export interface YesterdayData {
  close: number
  high: number
  low: number
  volume: number
  timestamp: string
}

// Note: Removed Indicators interface - indicators are calculated on-demand
