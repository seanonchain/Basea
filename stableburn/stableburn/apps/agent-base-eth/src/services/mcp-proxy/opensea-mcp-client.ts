/**
 * OpenSea MCP Client
 * Interfaces with the OpenSea Model Context Protocol server
 */

interface MCPRequest {
  method: string
  params: {
    name: string
    arguments?: any
  }
}

interface MCPResponse {
  content?: Array<{
    type: string
    text?: string
  }>
  isError?: boolean
  error?: any
}

export class OpenSeaMCPClient {
  private baseUrl: string
  private headers: Record<string, string>
  private sessionId: string

  constructor(accessToken: string) {
    // Use inline token URL since we're making direct HTTP requests
    this.baseUrl = `https://mcp.opensea.io/${accessToken}/mcp`
    // Generate a unique session ID
    this.sessionId = `agent-base-eth-${Date.now()}-${Math.random().toString(36).substring(7)}`
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Mcp-Session-Id': this.sessionId
    }
  }

  /**
   * Call an OpenSea MCP tool
   */
  async callTool(toolName: string, args: any = {}): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      },
      id: Date.now()
    }

    try {
      console.log(`🎨 Calling OpenSea MCP tool: ${toolName}`, args)
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`MCP request failed: ${response.status} ${response.statusText}`)
      }

      const data: any = await response.json()
      
      // Handle JSON-RPC error
      if (data.error) {
        throw new Error(data.error.message || 'MCP tool execution failed')
      }

      // Extract the content from the JSON-RPC result
      if (data.result?.content && data.result.content.length > 0) {
        const textContent = data.result.content.find((c: any) => c.type === 'text')
        if (textContent?.text) {
          try {
            // Try to parse as JSON first
            return JSON.parse(textContent.text)
          } catch {
            // Return as plain text if not JSON
            return textContent.text
          }
        }
      }

      return data.result || data
    } catch (error) {
      console.error(`OpenSea MCP error for tool ${toolName}:`, error)
      throw error
    }
  }

  /**
   * Get available tools from the MCP server
   */
  async listTools(): Promise<any> {
    const request = {
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {},
      id: Date.now()
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`Failed to list tools: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to list MCP tools:', error)
      throw error
    }
  }
}