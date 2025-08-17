import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const client = createPublicClient({ chain: base, transport: http() })
// Simple in-memory nonce store (swap for Redis or DB in production)
const nonces = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 })
    }

    console.log('Creating session for address:', address)

    // Create session token (simplified - in production use proper JWT with SESSION_SECRET)
    // For demo purposes, using simple encoding - in production, use proper JWT:
    // const jwt = require('jsonwebtoken')
    // const sessionToken = jwt.sign({ address, timestamp: Date.now() }, process.env.SESSION_SECRET)
    const sessionToken = Buffer.from(`${address}:${Date.now()}`).toString('base64')

    const response = NextResponse.json({ 
      ok: true, 
      address,
      sessionToken 
    })

    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    return response
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  const nonce = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  nonces.add(nonce)
  return NextResponse.json({ nonce })
}