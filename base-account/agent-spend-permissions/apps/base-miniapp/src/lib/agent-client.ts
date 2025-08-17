// Agent client for connecting to agent.base.eth
import { useState, useCallback } from 'react'

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:3001'

export function useAgentClient() {
  const [isConnected, setIsConnected] = useState(false)

  const connect = useCallback(async () => {
    try {
      const response = await fetch(`${AGENT_API_URL}/health`)
      if (response.ok) {
        setIsConnected(true)
        return true
      }
    } catch (error) {
      console.error('Failed to connect to agent:', error)
    }
    return false
  }, [])

  const sendMessage = useCallback(async (message: string): Promise<string> => {
    try {
      const response = await fetch(`${AGENT_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          context: {
            source: 'base-miniapp',
            timestamp: new Date().toISOString()
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }, [])

  const getDiscoveryServices = useCallback(async () => {
    try {
      const response = await fetch(`${AGENT_API_URL}/api/discovery`)
      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch discovery services:', error)
      throw error
    }
  }, [])

  return {
    isConnected,
    connect,
    sendMessage,
    getDiscoveryServices
  }
}