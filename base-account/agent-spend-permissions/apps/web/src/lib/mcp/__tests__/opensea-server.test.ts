/**
 * Tests for OpenSea MCP Server
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OpenSeaMCPServer } from '../opensea-server'

describe('OpenSeaMCPServer', () => {
  let server: OpenSeaMCPServer

  beforeEach(() => {
    server = new OpenSeaMCPServer({
      accessToken: 'test-token',
      chainId: 8453
    })
  })

  describe('handleRequest', () => {
    it('should handle tools/list request', async () => {
      const request = {
        method: 'tools/list',
        id: 1
      }

      const response = await server.handleRequest(request)

      expect(response.result).toBeDefined()
      expect(response.result.tools).toBeInstanceOf(Array)
      expect(response.result.tools.length).toBeGreaterThan(0)
      expect(response.id).toBe(1)
    })

    it('should return error for unknown method', async () => {
      const request = {
        method: 'unknown/method',
        id: 2
      }

      const response = await server.handleRequest(request)

      expect(response.error).toBeDefined()
      expect(response.error.code).toBe(-32601)
      expect(response.error.message).toContain('Method not found')
    })

    it('should handle tools/call request', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'search',
          arguments: { query: 'test' }
        },
        id: 3
      }

      // Mock the tools.execute method
      vi.spyOn(server['tools'], 'execute').mockResolvedValue({
        query: 'test',
        results: []
      })

      const response = await server.handleRequest(request)

      expect(response.result).toBeDefined()
      expect(response.error).toBeUndefined()
      expect(response.id).toBe(3)
    })

    it('should handle resources/list request', async () => {
      const request = {
        method: 'resources/list',
        id: 4
      }

      const response = await server.handleRequest(request)

      expect(response.result).toBeDefined()
      expect(response.result.resources).toBeInstanceOf(Array)
      expect(response.result.resources.length).toBeGreaterThan(0)
    })

    it('should handle resources/read request', async () => {
      const request = {
        method: 'resources/read',
        params: { uri: 'opensea://collections/trending' },
        id: 5
      }

      // Mock the tools.execute method
      vi.spyOn(server['tools'], 'execute').mockResolvedValue({
        collections: []
      })

      const response = await server.handleRequest(request)

      expect(response.result).toBeDefined()
      expect(response.result.contents).toBeInstanceOf(Array)
      expect(response.result.contents[0]).toHaveProperty('uri')
      expect(response.result.contents[0]).toHaveProperty('mimeType')
      expect(response.result.contents[0]).toHaveProperty('text')
    })

    it('should return error for missing tool name', async () => {
      const request = {
        method: 'tools/call',
        params: { arguments: { query: 'test' } },
        id: 6
      }

      const response = await server.handleRequest(request)

      expect(response.error).toBeDefined()
      expect(response.error.code).toBe(-32602)
      expect(response.error.message).toContain('tool name required')
    })
  })

  describe('validateAccess', () => {
    it('should validate access token', async () => {
      // Mock successful API call
      vi.spyOn(server['tools'], 'execute').mockResolvedValue({
        collections: []
      })

      const isValid = await server.validateAccess()
      expect(isValid).toBe(true)
    })

    it('should return false for invalid token', async () => {
      // Mock failed API call
      vi.spyOn(server['tools'], 'execute').mockRejectedValue(
        new Error('Unauthorized')
      )

      const isValid = await server.validateAccess()
      expect(isValid).toBe(false)
    })
  })
})