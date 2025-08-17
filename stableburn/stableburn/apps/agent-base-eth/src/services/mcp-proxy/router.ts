import { OpenSeaAISDK } from './opensea-ai-sdk'

export class MCPProxy {
  private servers: Map<string, any> = new Map()
  private openSeaMCP?: OpenSeaAISDK

  async initialize() {
    console.log('🔌 Initializing MCP proxy...')
    
    // Initialize OpenSea MCP with AI SDK if access token is available
    const openSeaToken = process.env.OPENSEA_ACCESS_TOKEN
    if (openSeaToken) {
      try {
        this.openSeaMCP = new OpenSeaAISDK(openSeaToken)
        await this.openSeaMCP.initialize()
        console.log('✅ MCP proxy initialized with OpenSea AI SDK')
      } catch (error) {
        console.log('⚠️  Could not initialize OpenSea MCP:', error)
      }
    } else {
      console.log('⚠️  OpenSea access token not configured')
    }
    
    // Register available MCP servers
    this.servers.set('opensea', {
      name: 'OpenSea MCP',
      endpoint: 'AI SDK integration'
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
      console.log(`🎨 OpenSea MCP request via AI SDK: ${tool}`, params)
      
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
      
      // Call the OpenSea MCP tool via AI SDK
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

  /**
   * List all available MCP servers
   */
  listServers() {
    return Array.from(this.servers.entries()).map(([key, value]) => ({
      id: key,
      ...value
    }))
  }

  /**
   * Get OpenSea AI SDK instance for direct use
   */
  getOpenSeaSDK() {
    return this.openSeaMCP
  }

  /**
   * List all available OpenSea tools
   */
  async listOpenSeaTools() {
    if (!this.openSeaMCP) {
      return []
    }
    
    const tools = this.openSeaMCP.getTools()
    return Object.keys(tools)
  }
}