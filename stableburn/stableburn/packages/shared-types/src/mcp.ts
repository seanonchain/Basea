export interface MCPRequest {
  method: string
  params?: any
  id?: string | number
}

export interface MCPResponse {
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
  id?: string | number
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

export interface MCPServer {
  name: string
  version: string
  tools: MCPTool[]
}