import express from 'express'
import { AgentBaseEth } from '../../core/agent'

export class HttpServer {
  private app: express.Application
  private agent: AgentBaseEth
  private port: number

  constructor(agent: AgentBaseEth) {
    this.agent = agent
    this.app = express()
    this.port = parseInt(process.env.PORT || '3001')
    
    this.setupMiddleware()
    this.setupRoutes()
  }

  private setupMiddleware() {
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      next()
    })
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', agent: 'agent.base.eth' })
    })

    // Chat endpoint
    this.app.post('/chat', async (req, res) => {
      try {
        const { message, context } = req.body
        const response = await this.agent.handleMessage(message, context)
        res.json({ response })
      } catch (error) {
        res.status(500).json({ error: 'Failed to process message' })
      }
    })

    // Discovery API
    this.app.get('/api/discovery', async (req, res) => {
      const services = await this.agent.getDiscoveryService().listServices()
      res.json(services)
    })

    // MCP proxy
    this.app.post('/api/mcp/:tool', async (req, res) => {
      try {
        const result = await this.agent.getMCPProxy().handleRequest(req.params.tool, req.body)
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: 'MCP request failed' })
      }
    })

    // x402 payment endpoints
    this.app.post('/api/x402/pay', async (req, res) => {
      try {
        const result = await this.agent.getPaymentHandler().processPayment(req.body)
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: 'Payment processing failed' })
      }
    })
  }

  async start() {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`🌐 HTTP server listening on port ${this.port}`)
        resolve(true)
      })
    })
  }
}