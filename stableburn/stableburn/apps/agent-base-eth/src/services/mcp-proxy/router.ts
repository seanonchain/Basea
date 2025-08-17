import { OpenSeaMCPClient } from './opensea-mcp-client'

export class MCPProxy {
  private servers: Map<string, any> = new Map()
  private openSeaMCP?: OpenSeaMCPClient

  async initialize() {
    console.log('🔌 Initializing MCP proxy...')
    
    // Initialize OpenSea MCP client if access token is available
    const openSeaToken = process.env.OPENSEA_ACCESS_TOKEN
    if (openSeaToken) {
      this.openSeaMCP = new OpenSeaMCPClient(openSeaToken)
      console.log('✅ OpenSea MCP client initialized')
      
      // List available tools for debugging
      try {
        const tools = await this.openSeaMCP.listTools()
        console.log('📋 Available OpenSea MCP tools:', tools.tools?.map((t: any) => t.name).join(', '))
      } catch (error) {
        console.log('⚠️  Could not list OpenSea MCP tools:', error)
      }
    } else {
      console.log('⚠️  OpenSea access token not configured')
    }
    
    // Register available MCP servers
    this.servers.set('opensea', {
      name: 'OpenSea MCP',
      endpoint: 'https://mcp.opensea.io/mcp'
    })
  }

  async handleRequest(tool: string, params: any) {
    // Route to appropriate handler
    if (tool.startsWith('opensea_') || tool === 'opensea') {
      const toolName = tool === 'opensea' ? params.tool : tool.replace('opensea_', '')
      return this.handleOpenSeaRequest(toolName, params.args || params)
    }
    
    throw new Error(`Unknown tool: ${tool}`)
  }

  private async handleOpenSeaRequest(tool: string, params: any) {
    if (!this.openSeaMCP) {
      throw new Error('OpenSea MCP not initialized. Please configure OPENSEA_ACCESS_TOKEN')
    }
    
    try {
      console.log(`🎨 OpenSea MCP request: ${tool}`, params)
      
      // Map common parameters
      if (params.collection && !params.slug) {
        params.slug = params.collection
        delete params.collection
      }
      
      // Special handling for Based Punks query
      if (params.query?.toLowerCase().includes('based punks') || 
          params.slug?.toLowerCase().includes('basedpunks') ||
          params.slug?.toLowerCase().includes('based-punks')) {
        params.slug = 'basedpunks'
        delete params.query
      }
      
      // Call the OpenSea MCP tool
      const result = await this.openSeaMCP.callTool(tool, params)
      
      return {
        success: true,
        data: result,
        tool,
        params
      }
    } catch (error: any) {
      console.error('OpenSea MCP error:', error)
      return {
        success: false,
        error: error.message,
        tool,
        params
      }
    }
  }

  
  async getAvailableTools() {
    const tools: any = {}
    
    // Get OpenSea tools from MCP server if available
    if (this.openSeaMCP) {
      try {
        const mcpTools = await this.openSeaMCP.listTools()
        tools.opensea = mcpTools.tools?.map((t: any) => t.name) || []
      } catch {
        tools.opensea = [
          'search',
          'get_collection',
          'search_collections',
          'get_trending_collections',
          'get_top_collections',
          'search_tokens',
          'get_token',
          'get_token_balances',
          'get_nft_balances'
        ]
      }
    }
    
    return tools
  }
}