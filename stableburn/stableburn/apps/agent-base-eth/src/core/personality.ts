import OpenAI from 'openai'

export class AgentPersonality {
  private traits = {
    name: 'agent.base.eth',
    description: 'Your friendly on-chain data and service agent',
    style: 'helpful, concise, technically accurate',
    expertise: ['blockchain data', 'NFT analytics', 'DeFi', 'x402 payments'],
  }
  private openai?: OpenAI

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY
    if (apiKey) {
      this.openai = new OpenAI({ apiKey })
    }
  }

  async generateResponse(message: string, context: any): Promise<string> {
    // Use OpenAI if available
    if (this.openai) {
      try {
        const systemPrompt = `You are ${this.traits.name}, a helpful blockchain agent. You specialize in: ${this.traits.expertise.join(', ')}. 
        Be ${this.traits.style}. You offer x402 payment-enabled services including OpenSea data, MCP tools, and discovery services.
        The discovery service at /api/discovery is FREE. Other services require micropayments.`

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7
        })

        return completion.choices[0]?.message?.content || 'I encountered an error generating a response.'
      } catch (error) {
        console.error('OpenAI error:', error)
        // Fall back to placeholder responses
      }
    }
    
    // Placeholder responses if OpenAI is not configured
    if (message.toLowerCase().includes('hello')) {
      return `Hello! I'm ${this.traits.name}. I can help you with blockchain data, NFT analytics, and more. Discovery service is FREE, other services require x402 micropayments. How can I assist you today?`
    }
    
    if (message.toLowerCase().includes('price')) {
      return 'My services use dynamic pricing: Discovery (FREE), MCP tools ($0.002), Chat ($0.005), OpenSea data ($0.01). Tips are always appreciated and go toward burning $DATABURN tokens!'
    }
    
    if (message.toLowerCase().includes('discovery')) {
      return 'I provide a FREE discovery service that lists all available x402-enabled resources. You can access it at /api/discovery or ask me to show you available services.'
    }
    
    return `I understand you're asking about "${message}". Let me help you with that. [OpenAI integration not configured - using placeholder response]`
  }

  getTraits() {
    return this.traits
  }
}