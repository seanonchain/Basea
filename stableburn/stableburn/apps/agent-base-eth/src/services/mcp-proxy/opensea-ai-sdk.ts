/**
 * OpenSea MCP Integration using AI SDK
 * Uses the experimental MCP client with SSE transport
 */

import { experimental_createMCPClient, streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { Tool } from 'ai'

export class OpenSeaAISDK {
  private mcpClient: any
  private tools: Record<string, Tool> = {}
  private accessToken: string
  private initialized: boolean = false

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * Initialize the MCP client and fetch available tools
   */
  async initialize() {
    try {
      console.log('🎨 Initializing OpenSea MCP with AI SDK...')
      
      // Create MCP client with SSE transport
      this.mcpClient = await experimental_createMCPClient({
        transport: {
          type: 'sse',
          url: 'https://mcp.opensea.io/sse',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      })

      // Fetch all available tools
      const allTools = await this.mcpClient.tools()
      this.tools = allTools
      
      console.log(`✅ OpenSea MCP initialized with ${Object.keys(this.tools).length} tools`)
      console.log('📋 Available tools:', Object.keys(this.tools).join(', '))
      
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize OpenSea MCP:', error)
      throw error
    }
  }

  /**
   * Get all available tools for use with AI SDK
   */
  getTools() {
    if (!this.initialized) {
      throw new Error('OpenSea MCP not initialized. Call initialize() first.')
    }
    return this.tools
  }

  /**
   * Process a message using OpenAI with MCP tools
   */
  async processWithTools(message: string, systemPrompt?: string) {
    if (!this.initialized) {
      await this.initialize()
    }

    const result = await streamText({
      model: openai('gpt-4-turbo-preview'),
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You are a helpful assistant with access to OpenSea NFT marketplace data. Use the available tools to answer questions about NFT collections, floor prices, trending collections, and more.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      tools: this.tools,
      toolChoice: 'auto',
      maxTools: 10
    })

    // Collect the full response
    let fullText = ''
    for await (const chunk of result.textStream) {
      fullText += chunk
    }

    return fullText
  }

  /**
   * Call a specific tool directly
   */
  async callTool(toolName: string, args: any = {}) {
    if (!this.initialized) {
      await this.initialize()
    }

    const tool = this.tools[toolName]
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`)
    }

    try {
      // Execute the tool
      const result = await tool.execute(args)
      return result
    } catch (error) {
      console.error(`Error calling tool ${toolName}:`, error)
      throw error
    }
  }

  /**
   * Get collection information (helper method)
   */
  async getCollection(slug: string) {
    return this.callTool('get_collection', { slug })
  }

  /**
   * Search for collections (helper method)
   */
  async searchCollections(query: string, chain?: string) {
    return this.callTool('search_collections', { query, chain })
  }

  /**
   * Get trending collections (helper method)
   */
  async getTrendingCollections(period?: string) {
    return this.callTool('get_trending_collections', { 
      period: period || 'ONE_DAY' 
    })
  }

  /**
   * Search across all OpenSea data (helper method)
   */
  async search(query: string) {
    return this.callTool('search', { query })
  }
}