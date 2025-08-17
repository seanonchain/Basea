interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  context?: any
}

export class ConversationMemory {
  private conversations: Map<string, Message[]> = new Map()
  private maxMessagesPerConversation = 100

  async addMessage(content: string, context: any) {
    const conversationId = context.conversationId || 'default'
    
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, [])
    }
    
    const messages = this.conversations.get(conversationId)!
    
    messages.push({
      id: this.generateId(),
      content,
      role: 'user',
      timestamp: new Date(),
      context
    })
    
    // Trim old messages if needed
    if (messages.length > this.maxMessagesPerConversation) {
      messages.shift()
    }
  }

  async addResponse(content: string, context: any) {
    const conversationId = context.conversationId || 'default'
    
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, [])
    }
    
    const messages = this.conversations.get(conversationId)!
    
    messages.push({
      id: this.generateId(),
      content,
      role: 'assistant',
      timestamp: new Date(),
      context
    })
  }

  getConversationHistory(conversationId: string): Message[] {
    return this.conversations.get(conversationId) || []
  }

  clearConversation(conversationId: string) {
    this.conversations.delete(conversationId)
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}