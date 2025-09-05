import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'config', 'trading-config.json')
    const configData = fs.readFileSync(configPath, 'utf8')
    const config = JSON.parse(configData)
    
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error reading trading config:', error)
    return NextResponse.json(
      { error: 'Failed to load trading configuration' },
      { status: 500 }
    )
  }
}
