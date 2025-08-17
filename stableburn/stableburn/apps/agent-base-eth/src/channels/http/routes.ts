import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { paymentMiddleware, Network } from 'x402-hono'
import { facilitator } from '@coinbase/x402'
import { AgentBaseEth } from '../../core/agent'

export class HttpServer {
  private app: Hono
  private agent: AgentBaseEth
  private port: number
  private receiverAddress: string

  constructor(agent: AgentBaseEth) {
    this.agent = agent
    this.app = new Hono()
    this.port = parseInt(process.env.PORT || '3001')
    this.receiverAddress = process.env.X402_RECEIVER_ADDRESS || '0x0000000000000000000000000000000000000000'
    
    this.setupMiddleware()
    this.setupRoutes()
  }

  private setupMiddleware() {
    // CORS middleware
    this.app.use('*', cors({
      origin: '*',
      allowHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-PAYMENT'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }))

    // x402 Payment middleware configuration
    const isMainnet = process.env.NETWORK === 'base'
    const facilitatorConfig = isMainnet ? facilitator : { url: 'https://x402.org/facilitator' }
    
    // Configure protected routes with x402 payments
    this.app.use(paymentMiddleware(
      this.receiverAddress,
      {
        // Discovery API - requires payment for full access
        '/api/discovery': {
          price: '$0.001',
          network: isMainnet ? 'base' : 'base-sepolia',
          config: {
            description: 'Access agent.base.eth discovery service listing x402 and MCP endpoints',
            outputSchema: {
              type: 'object',
              properties: {
                services: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      endpoint: { type: 'string' },
                      price: { type: 'string' },
                      description: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        // MCP proxy - requires payment per tool call
        '/api/mcp/:tool': {
          price: '$0.002',
          network: isMainnet ? 'base' : 'base-sepolia',
          config: {
            description: 'Access OpenSea MCP tools through agent.base.eth proxy',
            inputSchema: {
              type: 'object',
              properties: {
                tool: { type: 'string', description: 'MCP tool name' },
                params: { type: 'object', description: 'Tool parameters' }
              },
              required: ['tool']
            },
            outputSchema: {
              type: 'object',
              properties: {
                result: { type: 'object' },
                error: { type: 'string' }
              }
            }
          }
        },
        // Chat endpoint - requires payment for AI responses
        '/chat': {
          price: '$0.005',
          network: isMainnet ? 'base' : 'base-sepolia',
          config: {
            description: 'Chat with agent.base.eth AI assistant powered by GPT-4',
            inputSchema: {
              type: 'object',
              properties: {
                message: { type: 'string', description: 'User message' },
                context: { type: 'object', description: 'Optional conversation context' }
              },
              required: ['message']
            },
            outputSchema: {
              type: 'object',
              properties: {
                response: { type: 'string', description: 'AI response' }
              }
            }
          }
        },
        // Premium data endpoints
        '/api/data/opensea': {
          price: '$0.01',
          network: isMainnet ? 'base' : 'base-sepolia',
          config: {
            description: 'Access OpenSea NFT market data with enhanced formatting',
            inputSchema: {
              type: 'object',
              properties: {
                collection: { type: 'string', description: 'Collection slug' },
                format: { 
                  type: 'string', 
                  enum: ['json', 'markdown', 'html'],
                  description: 'Output format'
                }
              },
              required: ['collection']
            }
          }
        }
      },
      facilitatorConfig
    ))
  }

  private setupRoutes() {
    // Health check (free)
    this.app.get('/health', (c) => {
      return c.json({ status: 'ok', agent: 'agent.base.eth' })
    })

    // Chat endpoint (protected by x402)
    this.app.post('/chat', async (c) => {
      try {
        const { message, context } = await c.req.json()
        const response = await this.agent.handleMessage(message, context)
        return c.json({ response })
      } catch (error) {
        return c.json({ error: 'Failed to process message' }, 500)
      }
    })

    // Discovery API (protected by x402)
    this.app.get('/api/discovery', async (c) => {
      const services = await this.agent.getDiscoveryService().listServices()
      return c.json(services)
    })

    // MCP proxy (protected by x402)
    this.app.post('/api/mcp/:tool', async (c) => {
      try {
        const tool = c.req.param('tool')
        const body = await c.req.json()
        const result = await this.agent.getMCPProxy().handleRequest(tool, body)
        return c.json(result)
      } catch (error) {
        return c.json({ error: 'MCP request failed' }, 500)
      }
    })

    // OpenSea data endpoint (protected by x402)
    this.app.get('/api/data/opensea', async (c) => {
      try {
        const collection = c.req.query('collection')
        const format = c.req.query('format') || 'json'
        
        if (!collection) {
          return c.json({ error: 'Collection parameter required' }, 400)
        }

        // Fetch data from OpenSea via MCP
        const data = await this.agent.getMCPProxy().handleRequest('opensea_collection', { 
          collection,
          format 
        })
        
        // Format based on request
        if (format === 'markdown') {
          return c.text(this.formatAsMarkdown(data), 200, {
            'Content-Type': 'text/markdown'
          })
        } else if (format === 'html') {
          return c.html(this.formatAsHTML(data))
        } else {
          return c.json(data)
        }
      } catch (error) {
        return c.json({ error: 'Failed to fetch OpenSea data' }, 500)
      }
    })

    // Tips endpoint (free - tips are voluntary)
    this.app.post('/api/tip', async (c) => {
      try {
        const tipData = await c.req.json()
        // Process tip and forward to burn contract
        const result = await this.agent.getPaymentHandler().processPayment({
          ...tipData,
          to: this.receiverAddress,
          isTip: true
        })
        return c.json(result)
      } catch (error) {
        return c.json({ error: 'Tip processing failed' }, 500)
      }
    })

    // Agent info endpoint (free)
    this.app.get('/api/agent', (c) => {
      return c.json({
        name: 'agent.base.eth',
        description: 'AI agent providing x402-enabled services with $DATABURN tokenomics',
        capabilities: [
          'OpenSea MCP proxy with payments',
          'Discovery service for x402 resources',
          'AI-powered chat assistance',
          'Automatic $DATABURN token burns'
        ],
        pricing: {
          discovery: '$0.001',
          mcp_tools: '$0.002',
          chat: '$0.005',
          opensea_data: '$0.01'
        },
        payment: {
          address: this.receiverAddress,
          network: process.env.NETWORK || 'base-sepolia',
          token: 'USDC',
          burn_token: '$DATABURN'
        },
        contact: {
          xmtp: 'agent.base.eth',
          github: 'https://github.com/yourusername/agent-base-eth'
        }
      })
    })
  }

  private formatAsMarkdown(data: any): string {
    // Convert JSON data to formatted markdown
    let md = `# OpenSea Collection Data\n\n`
    
    if (data.collection) {
      md += `## ${data.collection.name}\n\n`
      md += `- **Slug**: ${data.collection.slug}\n`
      md += `- **Floor Price**: ${data.collection.floorPrice} ETH\n`
      md += `- **Total Volume**: ${data.collection.totalVolume} ETH\n`
      md += `- **Item Count**: ${data.collection.itemCount}\n\n`
    }
    
    if (data.items && data.items.length > 0) {
      md += `## Items\n\n`
      data.items.forEach((item: any) => {
        md += `### ${item.name}\n`
        md += `- Token ID: ${item.tokenId}\n`
        md += `- Price: ${item.price} ETH\n\n`
      })
    }
    
    return md
  }

  private formatAsHTML(data: any): string {
    // Convert JSON data to HTML
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>OpenSea Collection Data</title>
  <style>
    body { font-family: system-ui; padding: 2rem; }
    .collection { background: #f5f5f5; padding: 1rem; border-radius: 8px; }
    .item { margin: 1rem 0; padding: 1rem; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>OpenSea Collection Data</h1>`
    
    if (data.collection) {
      html += `
  <div class="collection">
    <h2>${data.collection.name}</h2>
    <p>Floor Price: ${data.collection.floorPrice} ETH</p>
    <p>Total Volume: ${data.collection.totalVolume} ETH</p>
  </div>`
    }
    
    html += `</body></html>`
    return html
  }

  async start() {
    return new Promise((resolve) => {
      serve({
        fetch: this.app.fetch,
        port: this.port
      })
      console.log(`🌐 HTTP server with x402 payments listening on port ${this.port}`)
      console.log(`💰 Receiver address: ${this.receiverAddress}`)
      console.log(`🔗 Network: ${process.env.NETWORK || 'base-sepolia'}`)
      resolve(true)
    })
  }
}