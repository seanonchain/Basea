import * as fs from 'fs'
import {
  AgentKit,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  CdpWalletProvider,
  erc20ActionProvider,
  walletActionProvider,
} from '@coinbase/agentkit'
import { getLangChainTools } from '@coinbase/agentkit-langchain'
import { HumanMessage } from '@langchain/core/messages'
import { MemorySaver } from '@langchain/langgraph'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'
import type { Conversation } from '@xmtp/node-sdk'
import type { AgentBaseEth } from '../../core/agent'
import { createCustomTools } from './custom-tools'

// Storage constants
const WALLET_STORAGE_DIR = '.data/wallet'

// Global stores for memory and agent instances
const memoryStore: Record<string, MemorySaver> = {}
const agentStore: Record<string, any> = {}
const agentKitStore: Record<string, AgentKit> = {}

interface AgentConfig {
  configurable: {
    thread_id: string
  }
}

export class CoinbaseAgentKitManager {
  private agent: AgentBaseEth
  private llm?: ChatOpenAI

  constructor(agent: AgentBaseEth) {
    this.agent = agent
  }

  /**
   * Initialize the AgentKit manager
   */
  async initialize() {
    console.log('🤖 Initializing Coinbase AgentKit manager...')
    
    // Verify required environment variables
    const requiredVars = [
      'CDP_API_KEY_NAME',
      'CDP_API_KEY_PRIVATE_KEY',
      'NETWORK_ID',
      'OPENAI_API_KEY'
    ]
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        console.warn(`⚠️  Missing ${varName} - AgentKit features will be limited`)
      }
    }
    
    // Initialize OpenAI LLM if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.llm = new ChatOpenAI({
        model: 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY
      })
    }
    
    console.log('✅ AgentKit manager ready')
  }

  /**
   * Get or create memory for a user
   */
  private getMemory(userId: string): MemorySaver {
    if (!memoryStore[userId]) {
      memoryStore[userId] = new MemorySaver()
    }
    return memoryStore[userId]
  }

  /**
   * Get or create agent for a user
   */
  private async getAgent(userId: string) {
    if (!agentStore[userId]) {
      if (!this.llm) {
        throw new Error('OpenAI LLM not initialized')
      }
      
      const agentKit = await this.getAgentKit(userId)
      const tools = getLangChainTools(agentKit)
      
      // Add custom agent.base.eth tools
      const customTools = createCustomTools(this.agent)
      tools.push(...customTools)
      
      const memory = this.getMemory(userId)
      
      agentStore[userId] = createReactAgent({
        llm: this.llm,
        tools,
        checkpointSaver: memory,
        messageModifier: `
You are agent.base.eth, a helpful AI assistant on the Base blockchain that can:
- Search OpenSea NFT marketplace data
- Process x402 micropayments
- Discover Web3 resources and MCP endpoints
- Handle $DATABURN token operations
- Execute gasless USDC transactions via Coinbase CDP

When users ask about your capabilities, explain that you provide:
1. NFT market data (requires x402 payment)
2. Discovery service for Web3 resources
3. Token burning for $DATABURN
4. Gasless transaction execution

Always be helpful, concise, and professional.
`
      })
    }
    return agentStore[userId]
  }

  /**
   * Get or create AgentKit for a user
   */
  private async getAgentKit(userId: string): Promise<AgentKit> {
    if (!agentKitStore[userId]) {
      // Check if we have stored wallet data
      const walletData = this.getWalletData(userId)
      
      let agentKit: AgentKit
      
      if (walletData) {
        // Use existing wallet
        agentKit = await AgentKit.fromCdpWalletProvider({
          cdpWalletData: walletData,
          networkId: process.env.NETWORK_ID || 'base-mainnet'
        })
      } else {
        // Create new wallet
        agentKit = await AgentKit.configureWithWallet({
          cdpApiKeyName: process.env.CDP_API_KEY_NAME!,
          cdpApiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY!,
          networkId: process.env.NETWORK_ID || 'base-mainnet'
        })
        
        // Save wallet data
        const exportedWallet = await agentKit.exportWallet()
        this.saveWalletData(userId, exportedWallet)
      }
      
      agentKitStore[userId] = agentKit
    }
    
    return agentKitStore[userId]
  }

  /**
   * Save wallet data to storage
   */
  private saveWalletData(userId: string, walletData: string) {
    const localFilePath = `${WALLET_STORAGE_DIR}/${userId}.json`
    try {
      if (!fs.existsSync(localFilePath)) {
        console.log(`💾 Wallet data saved for user ${userId}`)
        fs.writeFileSync(localFilePath, walletData)
      }
    } catch (error) {
      console.error(`Failed to save wallet data: ${error}`)
    }
  }

  /**
   * Get wallet data from storage
   */
  private getWalletData(userId: string): string | null {
    const localFilePath = `${WALLET_STORAGE_DIR}/${userId}.json`
    try {
      if (fs.existsSync(localFilePath)) {
        return fs.readFileSync(localFilePath, 'utf-8')
      }
    } catch (error) {
      console.error(`Failed to read wallet data: ${error}`)
    }
    return null
  }

  /**
   * Process a message and determine if AgentKit should handle it
   */
  async processMessage(
    content: string,
    senderInboxId: string,
    conversation: Conversation
  ): Promise<boolean> {
    try {
      // Check if message requires AgentKit features
      const requiresAgentKit = this.shouldUseAgentKit(content)
      
      if (!requiresAgentKit) {
        return false // Let regular agent handle it
      }
      
      // Check if we have required config for AgentKit
      if (!process.env.CDP_API_KEY_NAME || !process.env.OPENAI_API_KEY) {
        await conversation.send(
          'AgentKit features are not fully configured. I can still help with discovery services and information queries!'
        )
        return false // Fall back to regular agent
      }
      
      // Get or create agent for this user
      const agent = await this.getAgent(senderInboxId)
      const config: AgentConfig = {
        configurable: { thread_id: senderInboxId }
      }
      
      // Stream the response
      console.log('🤖 Processing with AgentKit...')
      const stream = await agent.stream(
        { messages: [new HumanMessage(content)] },
        config
      )
      
      let response = ''
      for await (const chunk of stream) {
        if ('agent' in chunk) {
          response = chunk.agent.messages[chunk.agent.messages.length - 1].content
        } else if ('tools' in chunk) {
          console.log('🔧 Tool executed:', chunk.tools.messages[0].name)
        }
      }
      
      if (response) {
        await conversation.send(response)
        console.log('✅ AgentKit response sent')
        return true
      }
      
      return false
      
    } catch (error) {
      console.error('❌ AgentKit processing error:', error)
      await conversation.send(
        'I encountered an error processing your request with AgentKit. Let me try a different approach.'
      )
      return false
    }
  }

  /**
   * Determine if a message should be handled by AgentKit
   */
  private shouldUseAgentKit(content: string): boolean {
    const lowercaseContent = content.toLowerCase()
    
    // Keywords that indicate AgentKit functionality
    const agentKitKeywords = [
      'send',
      'transfer',
      'swap',
      'trade',
      'buy',
      'sell',
      'wallet',
      'balance',
      'usdc',
      'eth',
      'transaction',
      'deploy',
      'mint',
      'nft',
      'token',
      'gasless',
      'cdp'
    ]
    
    return agentKitKeywords.some(keyword => lowercaseContent.includes(keyword))
  }

  /**
   * Get AgentKit wallet address for a user
   */
  async getWalletAddress(userId: string): Promise<string | null> {
    try {
      const agentKit = await this.getAgentKit(userId)
      return agentKit.wallet.defaultAddress.toString()
    } catch (error) {
      console.error('Failed to get wallet address:', error)
      return null
    }
  }
}