/**
 * OpenSea MCP Server Implementation
 * Provides Model Context Protocol access to OpenSea marketplace data
 */

import { OpenSeaTools } from './opensea-tools'

export interface MCPRequest {
  method: string
  params?: any
  id?: string | number
}

export interface MCPResponse {
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
  id?: string | number
}

export interface OpenSeaConfig {
  accessToken: string
  baseUrl?: string
  chainId?: number
}

export class OpenSeaMCPServer {
  private tools: OpenSeaTools
  private config: OpenSeaConfig

  constructor(config: OpenSeaConfig) {
    this.config = {
      baseUrl: 'https://api.opensea.io/v2',
      chainId: 1, // Default to Ethereum mainnet
      ...config
    }
    this.tools = new OpenSeaTools(this.config)
  }

  /**
   * Handle MCP request and route to appropriate tool
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      // Route based on MCP method
      switch (request.method) {
        case 'tools/list':
          return this.listTools(request)
        
        case 'tools/call':
          return this.callTool(request)
        
        case 'resources/list':
          return this.listResources(request)
        
        case 'resources/read':
          return this.readResource(request)
        
        default:
          return {
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`
            },
            id: request.id
          }
      }
    } catch (error) {
      return {
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error'
        },
        id: request.id
      }
    }
  }

  /**
   * List available OpenSea tools
   */
  private listTools(request: MCPRequest): MCPResponse {
    const tools = [
      {
        name: 'search',
        description: 'AI-powered search across OpenSea marketplace data',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            chain: { type: 'string', description: 'Blockchain to search (optional)' }
          },
          required: ['query']
        }
      },
      {
        name: 'search_collections',
        description: 'Search for NFT collections by name or metadata',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Collection search query' },
            chain: { type: 'string', description: 'Filter by blockchain' },
            limit: { type: 'number', description: 'Max results to return' }
          },
          required: ['query']
        }
      },
      {
        name: 'get_collection',
        description: 'Get detailed information about a specific collection',
        inputSchema: {
          type: 'object',
          properties: {
            slug: { type: 'string', description: 'Collection slug identifier' },
            includes: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Additional data to include (activity, analytics, offers)'
            }
          },
          required: ['slug']
        }
      },
      {
        name: 'search_tokens',
        description: 'Search for cryptocurrencies and ERC-20 tokens',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Token name or symbol' },
            chain: { type: 'string', description: 'Blockchain network' }
          },
          required: ['query']
        }
      },
      {
        name: 'get_token',
        description: 'Get detailed token information including price data',
        inputSchema: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Token contract address' },
            chain: { type: 'string', description: 'Blockchain network' },
            includes: { 
              type: 'array',
              items: { type: 'string' },
              description: 'Additional data (price_history, activity, ohlcv)'
            }
          },
          required: ['address']
        }
      },
      {
        name: 'get_token_swap_quote',
        description: 'Get a swap quote for token exchange',
        inputSchema: {
          type: 'object',
          properties: {
            fromToken: { type: 'string', description: 'Source token address' },
            toToken: { type: 'string', description: 'Destination token address' },
            amount: { type: 'string', description: 'Amount to swap (in native units)' },
            chain: { type: 'string', description: 'Blockchain network' }
          },
          required: ['fromToken', 'toToken', 'amount']
        }
      },
      {
        name: 'get_token_balances',
        description: 'Get all token balances for a wallet',
        inputSchema: {
          type: 'object',
          properties: {
            wallet: { type: 'string', description: 'Wallet address' },
            chain: { type: 'string', description: 'Blockchain network' }
          },
          required: ['wallet']
        }
      },
      {
        name: 'get_nft_balances',
        description: 'Get all NFTs owned by a wallet',
        inputSchema: {
          type: 'object',
          properties: {
            wallet: { type: 'string', description: 'Wallet address' },
            chain: { type: 'string', description: 'Blockchain network' },
            collection: { type: 'string', description: 'Filter by collection slug' }
          },
          required: ['wallet']
        }
      },
      {
        name: 'get_trending_collections',
        description: 'Get trending NFT collections',
        inputSchema: {
          type: 'object',
          properties: {
            timeframe: { 
              type: 'string', 
              enum: ['ONE_HOUR', 'ONE_DAY', 'SEVEN_DAYS', 'THIRTY_DAYS'],
              description: 'Time period for trends'
            },
            chain: { type: 'string', description: 'Filter by blockchain' },
            limit: { type: 'number', description: 'Max results' }
          },
          required: ['timeframe']
        }
      },
      {
        name: 'get_top_collections',
        description: 'Get top NFT collections by various metrics',
        inputSchema: {
          type: 'object',
          properties: {
            sortBy: { 
              type: 'string',
              enum: ['volume', 'floor_price', 'sales_count'],
              description: 'Metric to sort by'
            },
            chain: { type: 'string', description: 'Filter by blockchain' },
            limit: { type: 'number', description: 'Max results' }
          },
          required: ['sortBy']
        }
      }
    ]

    return {
      result: { tools },
      id: request.id
    }
  }

  /**
   * Execute a specific tool
   */
  private async callTool(request: MCPRequest): Promise<MCPResponse> {
    const { name, arguments: args } = request.params || {}

    if (!name) {
      return {
        error: {
          code: -32602,
          message: 'Invalid params: tool name required'
        },
        id: request.id
      }
    }

    try {
      const result = await this.tools.execute(name, args)
      return {
        result,
        id: request.id
      }
    } catch (error) {
      return {
        error: {
          code: -32603,
          message: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        },
        id: request.id
      }
    }
  }

  /**
   * List available resources (collections, tokens, etc.)
   */
  private listResources(request: MCPRequest): MCPResponse {
    const resources = [
      {
        uri: 'opensea://collections/trending',
        name: 'Trending Collections',
        description: 'Currently trending NFT collections',
        mimeType: 'application/json'
      },
      {
        uri: 'opensea://tokens/trending',
        name: 'Trending Tokens',
        description: 'Tokens with highest price changes',
        mimeType: 'application/json'
      },
      {
        uri: 'opensea://collections/top',
        name: 'Top Collections',
        description: 'Top collections by volume',
        mimeType: 'application/json'
      }
    ]

    return {
      result: { resources },
      id: request.id
    }
  }

  /**
   * Read a specific resource
   */
  private async readResource(request: MCPRequest): Promise<MCPResponse> {
    const { uri } = request.params || {}

    if (!uri) {
      return {
        error: {
          code: -32602,
          message: 'Invalid params: resource URI required'
        },
        id: request.id
      }
    }

    try {
      // Parse the custom URI scheme
      const url = new URL(uri)
      const path = url.pathname.split('/')

      let result
      switch (path[1]) {
        case 'collections':
          if (path[2] === 'trending') {
            result = await this.tools.execute('get_trending_collections', { 
              timeframe: 'ONE_DAY',
              limit: 10 
            })
          } else if (path[2] === 'top') {
            result = await this.tools.execute('get_top_collections', { 
              sortBy: 'volume',
              limit: 10 
            })
          }
          break
        
        case 'tokens':
          if (path[2] === 'trending') {
            result = await this.tools.execute('search_tokens', { 
              query: 'trending',
              limit: 10 
            })
          }
          break
      }

      return {
        result: {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(result, null, 2)
            }
          ]
        },
        id: request.id
      }
    } catch (error) {
      return {
        error: {
          code: -32603,
          message: `Resource read failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        },
        id: request.id
      }
    }
  }

  /**
   * Validate access token
   */
  async validateAccess(): Promise<boolean> {
    try {
      // Attempt a simple API call to validate the token
      await this.tools.execute('search_collections', { query: 'test', limit: 1 })
      return true
    } catch (error) {
      console.error('Access token validation failed:', error)
      return false
    }
  }
}