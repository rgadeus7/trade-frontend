import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to avoid static generation issues with search params
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.json({ error: 'Authorization code not received' }, { status: 400 })
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://signin.tradestation.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.TRADESTATION_CLIENT_ID!,
        client_secret: process.env.TRADESTATION_CLIENT_SECRET!,
        code: code,
        redirect_uri: process.env.TRADESTATION_REDIRECT_URI!,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', tokenResponse.status, errorText)
      throw new Error(`Token exchange failed: ${tokenResponse.status}`)
    }

    const tokens = await tokenResponse.json()
    
    // Store tokens securely (in production, use a database)
    // For now, we'll redirect with tokens in URL (not secure for production)
    // TODO: Implement secure token storage
    return NextResponse.redirect(`/dashboard?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.json({ 
      error: 'Failed to exchange code for tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
