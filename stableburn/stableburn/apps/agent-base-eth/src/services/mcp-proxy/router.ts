import { OpenSeaTools } from '@agent-spend-permissions/mcp-tools/opensea-tools'
import fetch from 'node-fetch'

export class MCPProxy {
  private servers: Map<string, any> = new Map()
  private openSeaTools?: OpenSeaTools
  private zoraApiKey?: string

  async initialize() {
    console.log('🔌 Initializing MCP proxy...')
    
    // Initialize OpenSea tools if access token is available
    const openSeaToken = process.env.OPENSEA_ACCESS_TOKEN
    if (openSeaToken) {
      this.openSeaTools = new OpenSeaTools({
        accessToken: openSeaToken,
        chainId: 8453 // Base chain
      })
      console.log('✅ OpenSea MCP tools initialized')
    } else {
      console.log('⚠️  OpenSea access token not configured')
    }
    
    // Initialize Zora API
    this.zoraApiKey = process.env.ZORA_API_KEY
    if (this.zoraApiKey) {
      console.log('✅ Zora API initialized')
    } else {
      console.log('⚠️  Zora API key not configured')
    }
    
    // Register available MCP servers
    this.servers.set('opensea', {
      name: 'OpenSea',
      endpoint: 'https://api.opensea.io/v2'
    })
    
    this.servers.set('zora', {
      name: 'Zora',
      endpoint: 'https://api.zora.co'
    })
  }

  async handleRequest(tool: string, params: any) {
    // Route to appropriate handler
    if (tool.startsWith('opensea_')) {
      return this.handleOpenSeaRequest(tool.replace('opensea_', ''), params)
    }
    
    if (tool.startsWith('zora_')) {
      return this.handleZoraRequest(tool.replace('zora_', ''), params)
    }
    
    throw new Error(`Unknown tool: ${tool}`)
  }

  private async handleOpenSeaRequest(tool: string, params: any) {
    if (!this.openSeaTools) {
      throw new Error('OpenSea tools not initialized. Please configure OPENSEA_ACCESS_TOKEN')
    }
    
    try {
      console.log(`🎨 OpenSea request: ${tool}`, params)
      
      // Handle specific queries
      if (params.query?.toLowerCase().includes('based punks') || params.collection?.toLowerCase().includes('based-punks')) {
        // Get Based Punks collection data
        const result = await this.openSeaTools.execute('get_collection', {
          collection_slug: 'based-punks'
        })
        return {
          success: true,
          data: result,
          tool: 'get_collection',
          params: { collection_slug: 'based-punks' }
        }
      }
      
      // Default tool execution
      const result = await this.openSeaTools.execute(tool, params)
      return {
        success: true,
        data: result,
        tool,
        params
      }
    } catch (error: any) {
      console.error('OpenSea error:', error)
      return {
        success: false,
        error: error.message,
        tool,
        params
      }
    }
  }

  private async handleZoraRequest(tool: string, params: any) {
    try {
      console.log(`🌟 Zora request: ${tool}`, params)
      
      const headers: any = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
      
      if (this.zoraApiKey) {
        headers['X-API-KEY'] = this.zoraApiKey
      }
      
      // Handle specific Zora queries
      if (tool === 'new_creator_coins' || params.query?.toLowerCase().includes('new') || params.query?.toLowerCase().includes('creator coins')) {
        // Get recent creator coins from Zora
        const response = await fetch('https://api.zora.co/discover/creator-tokens?sort=newest&limit=10', {
          headers
        })
        
        if (!response.ok) {
          throw new Error(`Zora API error: ${response.statusText}`)
        }
        
        const data = await response.json()
        return {
          success: true,
          data,
          tool: 'new_creator_coins',
          params
        }
      }
      
      // Default response for other Zora tools
      return {
        success: true,
        data: {
          message: 'Zora tool executed',
          tool,
          params
        }
      }
    } catch (error: any) {
      console.error('Zora error:', error)
      return {
        success: false,
        error: error.message,
        tool,
        params
      }
    }
  }
  
  async getAvailableTools() {
    return {
      opensea: [
        'search',
        'get_collection',
        'search_collections',
        'get_token',
        'search_tokens',
        'get_trending_collections'
      ],
      zora: [
        'new_creator_coins',
        'get_creator_token',
        'search_creator_tokens'
      ]
    }
  }
}