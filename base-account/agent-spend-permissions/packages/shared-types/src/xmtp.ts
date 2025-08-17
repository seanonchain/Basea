export interface XMTPMessage {
  id: string
  conversationId: string
  senderAddress: string
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface XMTPConversation {
  id: string
  peerAddress: string
  context?: {
    conversationId: string
    metadata: Record<string, any>
  }
}

export interface XMTPClientConfig {
  env: 'production' | 'dev' | 'local'
  privateKey: string
  enableLogging?: boolean
}