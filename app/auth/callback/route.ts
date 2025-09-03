import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    try {
      // Create Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            flowType: 'pkce',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        }
      )
      
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        // Redirect to login with error
        return NextResponse.redirect(
          `${requestUrl.origin}/?error=${encodeURIComponent('Authentication failed. Please try again.')}`
        )
      }
      
      // Successful authentication - redirect to dashboard
      return NextResponse.redirect(requestUrl.origin)
      
    } catch (error) {
      console.error('Unexpected auth callback error:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`
      )
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(requestUrl.origin)
}
