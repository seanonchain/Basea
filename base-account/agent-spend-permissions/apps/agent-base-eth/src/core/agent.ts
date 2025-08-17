import { XMTPClient } from '../channels/xmtp/client'
import { HttpServer } from '../channels/http/routes'
import { DiscoveryService } from '../services/discovery/registry'
import { MCPProxy } from '../services/mcp-proxy/router'
import { PaymentHandler } from '../services/payments/x402-receiver'
import { TokenomicsManager } from '../services/tokenomics/burn-contract'
import { AgentPersonality } from './personality'
import { ConversationMemory } from './memory'

export class AgentBaseEth {
  private xmtpClient?: XMTPClient
  private httpServer: HttpServer
  private discoveryService: DiscoveryService
  private mcpProxy: MCPProxy
  private paymentHandler: PaymentHandler
  private tokenomics: TokenomicsManager
  private personality: AgentPersonality
  private memory: ConversationMemory

  constructor() {
    this.personality = new AgentPersonality()
    this.memory = new ConversationMemory()
    this.discoveryService = new DiscoveryService()
    this.mcpProxy = new MCPProxy()
    this.paymentHandler = new PaymentHandler()
    this.tokenomics = new TokenomicsManager()
    this.httpServer = new HttpServer(this)
  }

  async initialize() {
    console.log('🚀 Initializing agent.base.eth...')
    
    // Initialize XMTP if configured
    if (process.env.XMTP_PRIVATE_KEY) {
      this.xmtpClient = new XMTPClient()
      await this.xmtpClient.initialize()
    }
    
    // Start HTTP server
    await this.httpServer.start()
    
    // Initialize services
    await this.discoveryService.initialize()
    await this.mcpProxy.initialize()
    await this.paymentHandler.initialize()
    await this.tokenomics.initialize()
    
    console.log('✅ agent.base.eth is ready!')
  }

  async handleMessage(content: string, context: any): Promise<string> {
    // Store in memory
    await this.memory.addMessage(content, context)
    
    // Generate response using personality
    const response = await this.personality.generateResponse(content, context)
    
    // Store response
    await this.memory.addResponse(response, context)
    
    return response
  }

  getDiscoveryService() {
    return this.discoveryService
  }

  getMCPProxy() {
    return this.mcpProxy
  }

  getPaymentHandler() {
    return this.paymentHandler
  }
}