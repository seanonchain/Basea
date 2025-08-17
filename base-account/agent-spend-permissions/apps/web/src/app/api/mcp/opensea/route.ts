/**
 * OpenSea MCP Server HTTP Endpoint
 * Provides Model Context Protocol access via HTTP/SSE
 */

import { NextRequest, NextResponse } from 'next/server'
import { OpenSeaMCPServer } from '@/lib/mcp/opensea-server'

// Initialize MCP server with access token
let mcpServer: OpenSeaMCPServer | null = null

function getMCPServer(): OpenSeaMCPServer {
  if (!mcpServer) {
    const accessToken = process.env.OPENSEA_ACCESS_TOKEN
    if (!accessToken) {
      throw new Error('OPENSEA_ACCESS_TOKEN not configured')
    }
    
    mcpServer = new OpenSeaMCPServer({
      accessToken,
      chainId: 8453 // Base mainnet
    })
  }
  return mcpServer
}

/**
 * Handle MCP requests over HTTP
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.OPENSEA_ACCESS_TOKEN

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const providedToken = authHeader.replace('Bearer ', '')
    if (providedToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 403 }
      )
    }

    // Parse MCP request
    const mcpRequest = await request.json()
    
    // Get or create MCP server
    const server = getMCPServer()
    
    // Handle the request
    const response = await server.handleRequest(mcpRequest)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('MCP request error:', error)
    return NextResponse.json(
      {
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}

/**
 * Handle Server-Sent Events for streaming MCP
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.OPENSEA_ACCESS_TOKEN

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const providedToken = authHeader.replace('Bearer ', '')
    if (providedToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 403 }
      )
    }

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'connection',
            status: 'connected',
            message: 'OpenSea MCP Server ready'
          })}\n\n`)
        )

        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: Date.now()
              })}\n\n`)
            )
          } catch (error) {
            clearInterval(heartbeat)
          }
        }, 30000) // Send heartbeat every 30 seconds

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat)
          controller.close()
        })
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    })
  } catch (error) {
    console.error('SSE connection error:', error)
    return NextResponse.json(
      { error: 'Failed to establish SSE connection' },
      { status: 500 }
    )
  }
}

/**
 * Handle OPTIONS for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}