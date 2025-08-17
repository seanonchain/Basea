/**
 * XMTP Message Handlers using AI SDK
 * Integrates OpenSea MCP tools with conversation handling
 */

import { DiscoveryService } from '../../services/discovery/registry'
import { OpenSeaAISDK } from '../../services/mcp-proxy/opensea-ai-sdk'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export class AIMessageHandlers {
  private discoveryService: DiscoveryService
  private openSeaMCP?: OpenSeaAISDK
  private initialized: boolean = false

  constructor(discoveryService: DiscoveryService) {
    this.discoveryService = discoveryService
  }

  /**
   * Initialize the AI SDK handlers
   */
  async initialize() {
    const openSeaToken = process.env.OPENSEA_ACCESS_TOKEN
    if (openSeaToken) {
      try {
        this.openSeaMCP = new OpenSeaAISDK(openSeaToken)
        await this.openSeaMCP.initialize()
        this.initialized = true
        console.log('✅ AI SDK message handlers initialized with OpenSea MCP')
      } catch (error) {
        console.error('Failed to initialize OpenSea MCP:', error)
      }
    }
  }

  /**
   * Process a message with AI SDK and MCP tools
   */
  async handleMessageWithTools(message: string): Promise<string> {
    // Initialize if not already done
    if (!this.initialized) {
      await this.initialize()
    }

    // If OpenSea MCP is not available, fall back to basic response
    if (!this.openSeaMCP) {
      return this.handleBasicMessage(message)
    }

    try {
      // Get all available tools
      const openSeaTools = this.openSeaMCP.getTools()
      
      // Add discovery tool
      const customTools = {
        discovery_service: {
          description: 'Get a list of all available x402-enabled services',
          parameters: {
            type: 'object',
            properties: {
              refresh: {
                type: 'boolean',
                description: 'Whether to refresh the list'
              }
            }
          },
          execute: async () => {
            const services = await this.discoveryService.listServices()
            return services
          }
        }
      }

      // Combine all tools
      const allTools = {
        ...openSeaTools,
        ...customTools
      }

      // Process the message with tools
      const result = await streamText({
        model: openai('gpt-4-turbo-preview'),
        messages: [
          {
            role: 'system',
            content: `You are agent.base.eth, a helpful blockchain and NFT assistant. 
            You have access to OpenSea marketplace data and can help with:
            - NFT collection information and floor prices
            - Trending NFT collections
            - Token information and balances
            - Wallet portfolio analysis
            - x402 service discovery
            
            When users ask about NFT collections, use the OpenSea tools to get real-time data.
            Format responses clearly and concisely for XMTP messages.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        tools: allTools,
        toolChoice: 'auto',
        maxTools: 5
      })

      // Collect the full response
      let fullResponse = ''
      for await (const chunk of result.textStream) {
        fullResponse += chunk
      }

      return fullResponse || 'I processed your request but couldn\'t generate a response.'
      
    } catch (error) {
      console.error('Error processing message with AI SDK:', error)
      // Fall back to OpenSea-specific processing if available
      if (this.openSeaMCP) {
        try {
          return await this.openSeaMCP.processWithTools(message)
        } catch (fallbackError) {
          console.error('Fallback processing also failed:', fallbackError)
        }
      }
      return this.handleBasicMessage(message)
    }
  }

  /**
   * Handle specific NFT queries
   */
  async handleNFTQuery(query: string): Promise<string> {
    if (!this.openSeaMCP) {
      return 'OpenSea MCP is not configured. Unable to fetch NFT data.'
    }

    const lowerQuery = query.toLowerCase()

    try {
      // Check for specific collection queries
      if (lowerQuery.includes('based punks') || lowerQuery.includes('basedpunks')) {
        const result = await this.openSeaMCP.getCollection('basedpunks')
        return this.formatCollectionResponse(result)
      }

      // Check for trending collections
      if (lowerQuery.includes('trending')) {
        const result = await this.openSeaMCP.getTrendingCollections()
        return this.formatTrendingResponse(result)
      }

      // Default to search
      const result = await this.openSeaMCP.search(query)
      return this.formatSearchResponse(result)

    } catch (error: any) {
      console.error('NFT query error:', error)
      return `Error fetching NFT data: ${error.message}`
    }
  }

  /**
   * Format collection response
   */
  private formatCollectionResponse(data: any): string {
    if (!data || !data.collection) {
      return 'Collection not found.'
    }

    const { collection } = data
    const stats = collection.stats || {}
    
    let response = `**${collection.name}**\n\n`
    
    if (stats.floor_price) {
      response += `💰 Floor Price: ${stats.floor_price} ETH\n`
    }
    if (stats.total_volume) {
      response += `📊 Total Volume: ${stats.total_volume} ETH\n`
    }
    if (stats.num_owners) {
      response += `👥 Owners: ${stats.num_owners}\n`
    }
    if (stats.total_supply) {
      response += `🎨 Total Supply: ${stats.total_supply}\n`
    }
    if (collection.description) {
      response += `\n${collection.description}`
    }

    return response
  }

  /**
   * Format trending collections response
   */
  private formatTrendingResponse(data: any): string {
    if (!data || !data.collections || data.collections.length === 0) {
      return 'No trending collections found.'
    }

    let response = '**🔥 Trending NFT Collections**\n\n'
    
    data.collections.slice(0, 10).forEach((collection: any, index: number) => {
      response += `${index + 1}. **${collection.name}**\n`
      if (collection.stats?.floor_price) {
        response += `   Floor: ${collection.stats.floor_price} ETH`
      }
      if (collection.stats?.one_day_volume) {
        response += ` | 24h Vol: ${collection.stats.one_day_volume} ETH`
      }
      response += '\n'
    })

    return response
  }

  /**
   * Format search response
   */
  private formatSearchResponse(data: any): string {
    if (!data) {
      return 'No results found.'
    }

    let response = '**Search Results**\n\n'
    
    if (data.collections && data.collections.length > 0) {
      response += '**Collections:**\n'
      data.collections.slice(0, 5).forEach((c: any) => {
        response += `• ${c.name}`
        if (c.stats?.floor_price) {
          response += ` (Floor: ${c.stats.floor_price} ETH)`
        }
        response += '\n'
      })
    }

    if (data.tokens && data.tokens.length > 0) {
      response += '\n**Tokens:**\n'
      data.tokens.slice(0, 5).forEach((t: any) => {
        response += `• ${t.name} (${t.symbol})\n`
      })
    }

    return response || 'No results found for your search.'
  }

  /**
   * Handle discovery requests
   */
  async handleDiscoveryRequest(): Promise<string> {
    try {
      const services = await this.discoveryService.listServices()
      
      let response = '🔍 **X402 Service Discovery**\n\n'
      
      if (services.internal && services.internal.length > 0) {
        response += '**Internal Services:**\n'
        services.internal.forEach((service: any) => {
          response += `• ${service.name} - ${service.description}\n`
        })
        response += '\n'
      }
      
      if (services.facilitator && services.facilitator.length > 0) {
        response += '**Facilitator Services:**\n'
        services.facilitator.forEach((service: any) => {
          response += `• ${service.name || service.url}\n`
        })
      }
      
      response += `\n📊 Total: ${services.summary.totalServices} services available`
      
      return response
    } catch (error) {
      console.error('Discovery error:', error)
      return 'Error fetching service list.'
    }
  }

  /**
   * Basic message handler (fallback)
   */
  private handleBasicMessage(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! I\'m agent.base.eth. I can help you with NFT data, blockchain queries, and x402 services. Try asking about NFT collections, floor prices, or trending collections!'
    }
    
    if (lowerMessage.includes('discovery') || lowerMessage.includes('services')) {
      return 'I can show you available x402 services. The discovery service is FREE at /api/discovery.'
    }
    
    if (lowerMessage.includes('help')) {
      return `I can help you with:
• NFT collection data and floor prices
• Trending NFT collections  
• Token information
• Wallet portfolio analysis
• x402 service discovery

Try asking: "What's the floor price of Based Punks?" or "Show me trending NFT collections"`
    }
    
    return 'I can help with NFT data and blockchain queries. Try asking about specific collections or trending NFTs!'
  }
}