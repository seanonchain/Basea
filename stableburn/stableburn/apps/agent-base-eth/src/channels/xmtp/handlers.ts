import { DiscoveryService } from '../../services/discovery/registry'
import OpenAI from 'openai'

export class MessageHandlers {
  private discoveryService: DiscoveryService
  private openai?: OpenAI

  constructor(discoveryService: DiscoveryService) {
    this.discoveryService = discoveryService
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY
    if (apiKey) {
      this.openai = new OpenAI({ apiKey })
    }
  }

  async handlePaymentRequest(message: string): Promise<string> {
    // Parse payment request
    // Validate x402 payment
    // Process request
    return 'Payment processed successfully'
  }

  async handleDiscoveryRequest(message: string): Promise<string> {
    try {
      // Fetch the latest services from both internal and facilitator
      const services = await this.discoveryService.listServices()
      
      // Format the response
      let response = '🔍 **X402 Service Discovery**\n\n'
      
      if (services.internal && services.internal.length > 0) {
        response += '**Internal Services:**\n'
        services.internal.forEach((service: any) => {
          response += `• ${service.name} - ${service.description}\n`
          response += `  Endpoint: ${service.endpoint}\n`
        })
        response += '\n'
      }
      
      if (services.facilitator && services.facilitator.length > 0) {
        response += '**Facilitator Services:**\n'
        services.facilitator.forEach((service: any) => {
          response += `• ${service.name || service.url}\n`
          if (service.description) {
            response += `  ${service.description}\n`
          }
          if (service.price) {
            response += `  Price: ${service.price}\n`
          }
        })
        response += '\n'
      }
      
      response += `\n📊 Total: ${services.summary.totalServices} services available`
      
      return response
    } catch (error) {
      console.error('Discovery error:', error)
      return 'Sorry, I encountered an error fetching the service list. Please try again.'
    }
  }

  async handleMCPRequest(message: string): Promise<string> {
    // Route to appropriate MCP tool
    return 'MCP request processed'
  }

  async handleTip(amount: string, token: string): Promise<string> {
    // Process tip
    // Convert to $DATABURN
    // Burn tokens
    return `Thank you for your ${amount} ${token} tip! It will be converted to $DATABURN and burned.`
  }

  async handleMessageWithTools(message: string): Promise<string> {
    if (!this.openai) {
      return await this.handleBasicMessage(message)
    }

    try {
      const tools: OpenAI.Chat.ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: 'discovery_service',
            description: 'Get a list of all available x402-enabled services from the facilitator and internal registry',
            parameters: {
              type: 'object',
              properties: {
                refresh: {
                  type: 'boolean',
                  description: 'Whether to refresh the facilitator list (default: true)'
                }
              }
            }
          }
        }
      ]

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are agent.base.eth, a helpful blockchain agent. When users ask about available services, 
            x402 services, or what tools are available, use the discovery_service function to get the latest list.
            Format responses in a clear, concise manner suitable for XMTP messages.`
          },
          { role: 'user', content: message }
        ],
        tools,
        tool_choice: 'auto'
      })

      const responseMessage = completion.choices[0].message

      // Check if the model wants to use a tool
      if (responseMessage.tool_calls) {
        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === 'discovery_service') {
            const discoveryResult = await this.handleDiscoveryRequest(message)
            
            // Get final response from the model with the tool result
            const finalCompletion = await this.openai.chat.completions.create({
              model: 'gpt-4-turbo-preview',
              messages: [
                { role: 'system', content: 'You are agent.base.eth. Format the discovery results in a user-friendly way.' },
                { role: 'user', content: message },
                responseMessage,
                {
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: discoveryResult
                }
              ]
            })
            
            return finalCompletion.choices[0].message.content || 'Discovery completed.'
          }
        }
      }

      return responseMessage.content || 'I encountered an error processing your request.'
    } catch (error) {
      console.error('OpenAI error:', error)
      return await this.handleBasicMessage(message)
    }
  }

  private async handleBasicMessage(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('discovery') || lowerMessage.includes('services') || lowerMessage.includes('list')) {
      return await this.handleDiscoveryRequest(message)
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! I\'m agent.base.eth. I can help you discover x402 services, access NFT data, and more. Ask me about available services!'
    }
    
    return 'I can help you with x402 service discovery, NFT data, and blockchain queries. Try asking "What services are available?"'
  }
}