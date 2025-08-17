import * as fs from 'fs'
import * as path from 'path'
import { Client, type Conversation, type DecodedMessage, type XmtpEnv } from '@xmtp/node-sdk'
import { privateKeyToAccount } from 'viem/accounts'
import { generatePrivateKey } from 'viem/accounts'
import { CoinbaseAgentKitManager } from './agentkit-manager'
import type { AgentBaseEth } from '../../core/agent'

// Storage paths
const XMTP_STORAGE_DIR = '.data/xmtp'
const WALLET_STORAGE_DIR = '.data/wallet'

export class XMTPClient {
  private client?: Client
  private agent: AgentBaseEth
  private agentKitManager: CoinbaseAgentKitManager
  private conversations: Map<string, Conversation> = new Map()
  private isListening: boolean = false

  constructor(agent: AgentBaseEth) {
    this.agent = agent
    this.agentKitManager = new CoinbaseAgentKitManager(agent)
    this.ensureLocalStorage()
  }

  /**
   * Ensure local storage directories exist
   */
  private ensureLocalStorage() {
    if (!fs.existsSync(XMTP_STORAGE_DIR)) {
      fs.mkdirSync(XMTP_STORAGE_DIR, { recursive: true })
    }
    if (!fs.existsSync(WALLET_STORAGE_DIR)) {
      fs.mkdirSync(WALLET_STORAGE_DIR, { recursive: true })
    }
  }

  /**
   * Create a signer from private key
   */
  private createSigner(privateKey: string) {
    // Remove 0x prefix if present and ensure it's properly formatted
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey
    const account = privateKeyToAccount(`0x${cleanKey}`)
    return {
      getAddress: async () => account.address,
      signMessage: async (message: string | Uint8Array) => {
        const signature = await account.signMessage({
          message: typeof message === 'string' ? message : Buffer.from(message).toString()
        })
        return Buffer.from(signature.slice(2), 'hex')
      }
    }
  }

  /**
   * Get encryption key from hex string
   */
  private getEncryptionKeyFromHex(hexKey: string): Uint8Array {
    // Remove 0x prefix if present
    const cleanHex = hexKey.startsWith('0x') ? hexKey.slice(2) : hexKey
    return Buffer.from(cleanHex, 'hex')
  }

  /**
   * Initialize XMTP client
   */
  async initialize() {
    console.log('🔌 Initializing XMTP client...')
    
    try {
      // Get wallet key and encryption key from environment
      const walletKey = process.env.WALLET_KEY || process.env.XMTP_PRIVATE_KEY
      const encryptionKey = process.env.ENCRYPTION_KEY
      const xmtpEnv = (process.env.XMTP_ENV || 'production') as XmtpEnv
      
      if (!walletKey) {
        throw new Error('WALLET_KEY or XMTP_PRIVATE_KEY environment variable is required')
      }
      
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY environment variable is required')
      }
      
      // Create signer and encryption key
      const signer = this.createSigner(walletKey)
      const dbEncryptionKey = this.getEncryptionKeyFromHex(encryptionKey)
      
      // Create XMTP client
      this.client = await Client.create(signer, {
        dbEncryptionKey,
        env: xmtpEnv
      })
      
      console.log('✅ XMTP client ready')
      console.log(`📬 Inbox ID: ${this.client.inboxId}`)
      console.log(`🔑 Address: ${this.client.accountAddress}`)
      
      // Initialize AgentKit manager
      await this.agentKitManager.initialize()
      
      // Start listening for messages
      await this.startListening()
      
    } catch (error) {
      console.error('❌ Failed to initialize XMTP client:', error)
      throw error
    }
  }

  /**
   * Start listening for XMTP messages
   */
  private async startListening() {
    if (!this.client || this.isListening) return
    
    console.log('👂 Listening for XMTP messages...')
    this.isListening = true
    
    try {
      // Sync conversations first
      await this.client.conversations.sync()
      
      // Stream all messages
      const stream = await this.client.conversations.streamAllMessages()
      
      for await (const message of stream) {
        // Skip messages from self to prevent loops
        if (message.senderInboxId.toLowerCase() === this.client.inboxId.toLowerCase()) {
          continue
        }
        
        // Handle the message
        await this.handleMessage(message)
      }
    } catch (error) {
      console.error('❌ Error in message stream:', error)
      this.isListening = false
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect...')
        this.startListening()
      }, 5000)
    }
  }

  /**
   * Handle incoming XMTP message
   */
  private async handleMessage(message: DecodedMessage) {
    try {
      console.log(`📨 Message from ${message.senderInboxId}: ${message.content}`)
      
      // Get or create conversation
      let conversation = this.conversations.get(message.conversationId)
      if (!conversation) {
        conversation = await this.client!.conversations.getConversationById(message.conversationId)
        if (conversation) {
          this.conversations.set(message.conversationId, conversation)
        }
      }
      
      if (!conversation) {
        console.log('❌ Unable to find conversation, skipping message')
        return
      }
      
      // Check content type
      if (message.contentType?.typeId !== 'text') {
        await conversation.send('I currently only support text messages. Please send your request as text.')
        return
      }
      
      const content = message.content as string
      const context = {
        conversationId: message.conversationId,
        senderInboxId: message.senderInboxId,
        senderAddress: message.senderAddress,
        timestamp: Date.now(),
        platform: 'xmtp'
      }
      
      // Check if this is an AgentKit command
      const agentKitResponse = await this.agentKitManager.processMessage(
        content,
        message.senderInboxId,
        conversation
      )
      
      if (agentKitResponse) {
        // AgentKit handled the message
        return
      }
      
      // Otherwise, use the regular agent handler
      const response = await this.agent.handleMessage(content, context)
      
      // Send response
      await conversation.send(response)
      console.log(`✅ Sent response: ${response.substring(0, 100)}...`)
      
    } catch (error) {
      console.error('❌ Error handling message:', error)
      
      // Try to send error message
      try {
        const conversation = await this.client!.conversations.getConversationById(message.conversationId)
        if (conversation) {
          await conversation.send('Sorry, I encountered an error processing your message. Please try again.')
        }
      } catch (sendError) {
        console.error('❌ Failed to send error message:', sendError)
      }
    }
  }

  /**
   * Send a message to a specific address
   */
  async sendMessage(address: string, content: string) {
    if (!this.client) {
      throw new Error('XMTP client not initialized')
    }
    
    try {
      // Check if we can message this address
      const canMessage = await this.client.canMessage([address])
      if (!canMessage[0]) {
        console.log(`❌ Cannot message ${address} - they are not on XMTP`)
        return false
      }
      
      // Create or get conversation
      const conversation = await this.client.conversations.newConversation(address)
      
      // Send message
      await conversation.send(content)
      console.log(`✅ Message sent to ${address}`)
      return true
      
    } catch (error) {
      console.error(`❌ Failed to send message to ${address}:`, error)
      throw error
    }
  }

  /**
   * Get client status
   */
  getStatus() {
    if (!this.client) {
      return {
        connected: false,
        listening: false
      }
    }
    
    return {
      connected: true,
      listening: this.isListening,
      inboxId: this.client.inboxId,
      address: this.client.accountAddress,
      conversationCount: this.conversations.size
    }
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect() {
    this.isListening = false
    if (this.client) {
      // XMTP node-sdk doesn't have a disconnect method, but we can clear state
      this.conversations.clear()
      this.client = undefined
    }
    console.log('👋 XMTP client disconnected')
  }
}