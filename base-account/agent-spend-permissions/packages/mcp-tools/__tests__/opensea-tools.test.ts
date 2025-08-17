/**
 * Tests for OpenSea Tools
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OpenSeaTools } from '../opensea-tools'

describe('OpenSeaTools', () => {
  let tools: OpenSeaTools

  beforeEach(() => {
    tools = new OpenSeaTools({
      accessToken: 'test-token',
      baseUrl: 'https://api.opensea.io/v2',
      chainId: 8453
    })

    // Reset fetch mock
    vi.mocked(global.fetch).mockReset()
  })

  describe('execute', () => {
    it('should execute search tool', async () => {
      // Mock fetch responses
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collections: [] }),
        status: 200,
        statusText: 'OK'
      } as Response)

      const result = await tools.execute('search', { query: 'test' })

      expect(result).toBeDefined()
      expect(result.query).toBe('test')
      expect(result.results).toBeDefined()
      expect(result.results.collections).toBeInstanceOf(Array)
    })

    it('should execute search_collections tool', async () => {
      const mockCollections = [
        { name: 'Test Collection', slug: 'test-collection' }
      ]

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ collections: mockCollections }),
        status: 200,
        statusText: 'OK'
      } as Response)

      const result = await tools.execute('search_collections', {
        query: 'test',
        limit: 10
      })

      expect(result).toBeDefined()
      expect(result.collections).toBeInstanceOf(Array)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/collections'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-KEY': 'test-token'
          })
        })
      )
    })

    it('should execute get_collection tool', async () => {
      const mockCollection = {
        name: 'Test Collection',
        slug: 'test-collection',
        description: 'A test collection'
      }

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockCollection,
        status: 200,
        statusText: 'OK'
      } as Response)

      const result = await tools.execute('get_collection', {
        slug: 'test-collection'
      })

      expect(result).toBeDefined()
      expect(result.name).toBe('Test Collection')
      expect(result.slug).toBe('test-collection')
    })

    it('should execute get_trending_collections tool', async () => {
      const mockTrendingCollections = {
        collections: [
          { name: 'Trending Collection 1' },
          { name: 'Trending Collection 2' }
        ]
      }

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockTrendingCollections,
        status: 200,
        statusText: 'OK'
      } as Response)

      const result = await tools.execute('get_trending_collections', {
        timeframe: 'ONE_DAY',
        limit: 10
      })

      expect(result).toBeDefined()
      expect(result.timeframe).toBe('ONE_DAY')
      expect(result.collections).toBeInstanceOf(Array)
      expect(result.updatedAt).toBeDefined()
    })

    it('should execute get_token_swap_quote tool', async () => {
      const result = await tools.execute('get_token_swap_quote', {
        fromToken: '0x123',
        toToken: '0x456',
        amount: '100',
        chain: 'base'
      })

      expect(result).toBeDefined()
      expect(result.fromToken).toBe('0x123')
      expect(result.toToken).toBe('0x456')
      expect(result.fromAmount).toBe('100')
      expect(result.toAmount).toBeDefined()
      expect(result.route).toBeInstanceOf(Array)
    })

    it('should throw error for unknown tool', async () => {
      await expect(
        tools.execute('unknown_tool', {})
      ).rejects.toThrow('Unknown tool: unknown_tool')
    })
  })

  describe('chain mapping', () => {
    it('should map chain names correctly', () => {
      // Access private method through any type casting
      const mappedChain = (tools as any).mapChainName('ethereum')
      expect(mappedChain).toBe('ethereum')

      const mappedChain2 = (tools as any).mapChainName('eth')
      expect(mappedChain2).toBe('ethereum')

      const mappedChain3 = (tools as any).mapChainName('polygon')
      expect(mappedChain3).toBe('matic')
    })
  })

  describe('timeframe mapping', () => {
    it('should map timeframes correctly', () => {
      const mapped = (tools as any).mapTimeframe('ONE_DAY')
      expect(mapped).toBe('1d')

      const mapped2 = (tools as any).mapTimeframe('SEVEN_DAYS')
      expect(mapped2).toBe('7d')
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response)

      await expect(
        tools.execute('get_collection', { slug: 'nonexistent' })
      ).rejects.toThrow('Collection not found')
    })

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      await expect(
        tools.execute('search_collections', { query: 'test' })
      ).rejects.toThrow('Network error')
    })
  })
})