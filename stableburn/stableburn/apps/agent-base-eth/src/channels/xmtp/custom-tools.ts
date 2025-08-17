import { Tool } from '@langchain/core/tools'
import { z } from 'zod'
import type { AgentBaseEth } from '../../core/agent'

/**
 * Create custom LangChain tools for agent.base.eth services
 */
export function createCustomTools(agent: AgentBaseEth): Tool[] {
  const tools: Tool[] = []

  // Discovery Service Tool
  tools.push(new Tool({
    name: 'discovery_search',
    description: 'Search for x402 resources, MCP endpoints, and Web3 services in the discovery registry',
    schema: z.object({
      query: z.string().describe('Search query for resources'),
      category: z.string().optional().describe('Optional category filter: mcp, x402, defi, nft, etc.')
    }),
    func: async ({ query, category }) => {
      try {
        const discovery = agent.getDiscoveryService()
        const results = await discovery.search(query, category)
        
        if (results.length === 0) {
          return 'No resources found matching your query. Try different search terms.'
        }
        
        return `Found ${results.length} resources:\n${results.map((r: any) => 
          `- ${r.name}: ${r.description}\n  URL: ${r.url}\n  Price: ${r.price || 'Free'}`
        ).join('\n')}`
      } catch (error) {
        return `Error searching discovery service: ${error}`
      }
    }
  }))

  // OpenSea MCP Proxy Tool
  tools.push(new Tool({
    name: 'opensea_search',
    description: 'Search OpenSea NFT marketplace data (requires x402 payment)',
    schema: z.object({
      query: z.string().describe('Search query for NFT collections or tokens'),
      searchType: z.enum(['collections', 'tokens', 'trending']).describe('Type of search to perform')
    }),
    func: async ({ query, searchType }) => {
      try {
        const mcpProxy = agent.getMCPProxy()
        
        // Check if user has paid
        const paymentHandler = agent.getPaymentHandler()
        const isPaid = await paymentHandler.checkPayment('opensea-search')
        
        if (!isPaid) {
          return 'OpenSea data access requires an x402 micropayment of 0.001 USDC. Please send payment to continue.'
        }
        
        const result = await mcpProxy.proxyOpenSeaRequest({
          method: 'tools/call',
          params: {
            name: `search_${searchType}`,
            arguments: { query, limit: 5 }
          }
        })
        
        return `OpenSea ${searchType} results:\n${JSON.stringify(result, null, 2)}`
      } catch (error) {
        return `Error accessing OpenSea data: ${error}`
      }
    }
  }))

  // Token Burn Tool
  tools.push(new Tool({
    name: 'databurn_info',
    description: 'Get information about $DATABURN token and burning mechanics',
    schema: z.object({
      action: z.enum(['stats', 'burn', 'price']).describe('Information to retrieve')
    }),
    func: async ({ action }) => {
      try {
        const tokenomics = agent.getTokenomicsManager()
        
        switch (action) {
          case 'stats':
            const stats = await tokenomics.getBurnStats()
            return `$DATABURN Statistics:\n- Total Burned: ${stats.totalBurned}\n- Burns Today: ${stats.burnsToday}\n- Current Supply: ${stats.currentSupply}`
          
          case 'burn':
            return 'To burn $DATABURN tokens, send any token as a tip. It will be automatically converted to $DATABURN and burned, reducing the total supply.'
          
          case 'price':
            const price = await tokenomics.getCurrentPrice()
            return `Current $DATABURN price: $${price.usd} USD`
          
          default:
            return 'Invalid action. Use: stats, burn, or price'
        }
      } catch (error) {
        return `Error retrieving $DATABURN information: ${error}`
      }
    }
  }))

  // Payment Status Tool
  tools.push(new Tool({
    name: 'payment_status',
    description: 'Check x402 payment status and requirements',
    schema: z.object({
      service: z.string().describe('Service to check payment for')
    }),
    func: async ({ service }) => {
      try {
        const paymentHandler = agent.getPaymentHandler()
        const status = await paymentHandler.getPaymentStatus(service)
        
        if (status.paid) {
          return `✅ Payment confirmed for ${service}. Access granted until ${new Date(status.expiresAt).toLocaleString()}`
        } else {
          return `❌ Payment required for ${service}.\nPrice: ${status.price} USDC\nPayment address: ${status.paymentAddress}\nSend payment to access this service.`
        }
      } catch (error) {
        return `Error checking payment status: ${error}`
      }
    }
  }))

  // Agent Info Tool
  tools.push(new Tool({
    name: 'agent_info',
    description: 'Get information about agent.base.eth capabilities and services',
    schema: z.object({
      topic: z.enum(['about', 'services', 'pricing', 'contact']).describe('Information topic')
    }),
    func: async ({ topic }) => {
      switch (topic) {
        case 'about':
          return `I am agent.base.eth, an AI agent on the Base blockchain providing:
- OpenSea NFT marketplace data (via MCP protocol)
- Discovery service for x402 resources and MCP endpoints
- $DATABURN token burning mechanism
- Gasless USDC transactions via Coinbase CDP

I accept micropayments via x402 protocol and all payments are converted to $DATABURN and burned.`
        
        case 'services':
          return `Available Services:
1. **OpenSea Data** - Search NFT collections, tokens, and trends (0.001 USDC per query)
2. **Discovery Service** - Find Web3 resources and MCP endpoints (Free)
3. **Token Burns** - Accept tips in any token, auto-convert to $DATABURN and burn
4. **Gasless Transactions** - Execute USDC transfers without gas fees`
        
        case 'pricing':
          return `Pricing Model:
- Discovery searches: FREE
- OpenSea data: 0.001 USDC per query
- Token burns: Any amount accepted as tips
- Gasless transactions: FREE (sponsored by CDP)`
        
        case 'contact':
          return `Contact agent.base.eth:
- XMTP: Message me directly at this address
- Web: https://agent.base.eth (coming soon)
- ENS: agent.base.eth
- GitHub: https://github.com/yourusername/agent-base-eth`
        
        default:
          return 'Please specify: about, services, pricing, or contact'
      }
    }
  }))

  return tools
}