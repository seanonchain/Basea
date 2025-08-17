/**
 * x402 Dynamic Endpoint Wrapper
 * Monetizes OpenSea MCP and other API endpoints with x402 payments
 */

import { NextRequest, NextResponse } from 'next/server'
import { X402Middleware } from '@/lib/x402/middleware'
import { OpenSeaMCPServer } from '@/lib/mcp/opensea-server'

// Initialize x402 middleware
const x402Middleware = new X402Middleware({
  recipientAddress: process.env.X402_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
  pricePerRequest: process.env.X402_PRICE_PER_REQUEST || '0.001',
  facilitatorUrl: process.env.X402_FACILITATOR_URL
})

// Cache for MCP servers
const mcpServers = new Map<string, any>()

/**
 * Handle all HTTP methods with x402 payment verification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'DELETE')
}

/**
 * Main request handler with x402 payment verification
 */
async function handleRequest(
  request: NextRequest,
  path: string[],
  method: string
): Promise<NextResponse> {
  try {
    // Determine the service and tool from path
    const service = path[0] // e.g., 'opensea', 'hyperbolic', etc.
    const tool = path[1] || 'default' // e.g., 'search', 'get_collection', etc.

    // Verify x402 payment
    const paymentResult = await x402Middleware.verifyPayment(request)
    
    if (!paymentResult.valid) {
      // Return 402 Payment Required with payment details
      return x402Middleware.createPaymentRequiredResponse(tool)
    }

    // Route to appropriate service handler
    switch (service) {
      case 'opensea':
        return await handleOpenSeaRequest(request, path.slice(1), method, paymentResult.payment)
      
      case 'mcp':
        return await handleMCPRequest(request, path.slice(1), method, paymentResult.payment)
      
      case 'pricing':
        return handlePricingRequest()
      
      case 'bazaar':
        return await handleBazaarRequest(request, method)
      
      default:
        return NextResponse.json(
          { error: `Unknown service: ${service}` },
          { status: 404 }
        )
    }
  } catch (error) {
    console.error('x402 endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle OpenSea-specific requests
 */
async function handleOpenSeaRequest(
  request: NextRequest,
  path: string[],
  method: string,
  payment: any
): Promise<NextResponse> {
  try {
    // Get or create OpenSea MCP server
    if (!mcpServers.has('opensea')) {
      const accessToken = process.env.OPENSEA_ACCESS_TOKEN
      if (!accessToken) {
        return NextResponse.json(
          { error: 'OpenSea not configured' },
          { status: 503 }
        )
      }

      mcpServers.set('opensea', new OpenSeaMCPServer({
        accessToken,
        chainId: 8453 // Base mainnet
      }))
    }

    const server = mcpServers.get('opensea')!
    const tool = path[0] || 'search'

    // Handle based on method
    if (method === 'POST') {
      const body = await request.json()
      
      // Create MCP request
      const mcpRequest = {
        method: 'tools/call',
        params: {
          name: tool,
          arguments: body
        },
        id: `${Date.now()}`
      }

      // Execute through MCP server
      const response = await server.handleRequest(mcpRequest)

      // Add payment info to response
      return NextResponse.json({
        ...response.result,
        payment: {
          amount: payment.amount,
          token: payment.token,
          timestamp: payment.timestamp
        }
      })
    } else if (method === 'GET') {
      // Handle GET requests for specific tools
      const url = new URL(request.url)
      const params = Object.fromEntries(url.searchParams)

      const mcpRequest = {
        method: 'tools/call',
        params: {
          name: tool,
          arguments: params
        },
        id: `${Date.now()}`
      }

      const response = await server.handleRequest(mcpRequest)

      return NextResponse.json({
        ...response.result,
        payment: {
          amount: payment.amount,
          token: payment.token,
          timestamp: payment.timestamp
        }
      })
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  } catch (error) {
    console.error('OpenSea handler error:', error)
    return NextResponse.json(
      { error: 'OpenSea request failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle generic MCP requests
 */
async function handleMCPRequest(
  request: NextRequest,
  path: string[],
  method: string,
  payment: any
): Promise<NextResponse> {
  try {
    const serverName = path[0]
    
    if (!mcpServers.has(serverName)) {
      return NextResponse.json(
        { error: `MCP server '${serverName}' not found` },
        { status: 404 }
      )
    }

    const server = mcpServers.get(serverName)!
    const body = await request.json()

    // Add payment tracking
    body.x402Payment = payment

    const response = await server.handleRequest(body)

    return NextResponse.json(response)
  } catch (error) {
    console.error('MCP handler error:', error)
    return NextResponse.json(
      { error: 'MCP request failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle pricing information requests
 */
function handlePricingRequest(): NextResponse {
  const pricing = x402Middleware.getPricing()
  
  return NextResponse.json({
    currency: 'USDC',
    chain: 'base',
    pricing: pricing.map(tier => ({
      endpoint: `/api/x402/opensea/${tier.tool}`,
      price: tier.price,
      description: tier.description
    })),
    payment: {
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      recipient: process.env.X402_WALLET_ADDRESS,
      facilitator: process.env.X402_FACILITATOR_URL
    }
  })
}

/**
 * Handle x402 Bazaar discovery requests
 */
async function handleBazaarRequest(
  request: NextRequest,
  method: string
): Promise<NextResponse> {
  try {
    // Return service discovery information
    if (method === 'GET') {
      return NextResponse.json({
        name: 'OpenSea MCP x402 Service',
        description: 'Access OpenSea NFT marketplace data with micropayments',
        version: '1.0.0',
        endpoints: [
          {
            path: '/api/x402/opensea/search',
            method: 'POST',
            price: '0.001',
            description: 'AI-powered search across OpenSea'
          },
          {
            path: '/api/x402/opensea/search_collections',
            method: 'POST',
            price: '0.0005',
            description: 'Search NFT collections'
          },
          {
            path: '/api/x402/opensea/get_collection',
            method: 'POST',
            price: '0.0005',
            description: 'Get collection details'
          },
          {
            path: '/api/x402/opensea/get_token_swap_quote',
            method: 'POST',
            price: '0.002',
            description: 'Get token swap quotes'
          },
          {
            path: '/api/x402/opensea/get_trending_collections',
            method: 'POST',
            price: '0.001',
            description: 'Get trending NFT collections'
          }
        ],
        payment: {
          currency: 'USDC',
          chain: 'base',
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          recipient: process.env.X402_WALLET_ADDRESS
        },
        tags: ['nft', 'opensea', 'marketplace', 'blockchain', 'base']
      })
    }

    // Register with Bazaar
    if (method === 'POST') {
      const body = await request.json()
      
      // In production, this would register with the actual Bazaar
      console.log('Registering with x402 Bazaar:', body)
      
      return NextResponse.json({
        success: true,
        message: 'Service registered with x402 Bazaar',
        serviceId: `opensea-mcp-${Date.now()}`
      })
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  } catch (error) {
    console.error('Bazaar handler error:', error)
    return NextResponse.json(
      { error: 'Bazaar request failed' },
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-402-payment',
      'Access-Control-Max-Age': '86400'
    }
  })
}