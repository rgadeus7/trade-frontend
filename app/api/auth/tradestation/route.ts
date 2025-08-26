import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Generate a random state parameter for security
  const state = generateRandomState()
  
  // Build the authorization URL according to Trade Station OAuth spec
  const authUrl = `https://signin.tradestation.com/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.TRADESTATION_CLIENT_ID}&` +
    `redirect_uri=${process.env.TRADESTATION_REDIRECT_URI}&` +
    `audience=https://api.tradestation.com&` +
    `scope=openid profile offline_access MarketData ReadAccount&` +
    `state=${state}`

  // Redirect user to Trade Station login
  return NextResponse.redirect(authUrl)
}

function generateRandomState(): string {
  // Generate a random string for CSRF protection
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}
