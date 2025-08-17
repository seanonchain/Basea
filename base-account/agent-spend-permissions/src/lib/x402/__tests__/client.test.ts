/**
 * Tests for x402 Client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { X402Client } from '../client'

describe('X402Client', () => {
  let client: X402Client

  beforeEach(() => {
    // Mock private key for testing
    client = new X402Client({
      walletPrivateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      facilitatorUrl: 'https://test-facilitator.example.com',
      maxPaymentPerRequest: '0.01',
      autoApprove: true
    })

    // Reset fetch mock
    vi.mocked(global.fetch).mockReset()
  })

  describe('makePayment', () => {
    it('should make payment through facilitator', async () => {
      const paymentRequest = {
        recipient: '0x1234567890123456789012345678901234567890',
        amount: '0.001',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        chain: 'base',
        description: 'Test payment'
      }

      // Mock facilitator response
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          transactionHash: '0xtxhash123'
        })
      } as Response)

      const result = await client.makePayment(paymentRequest)

      expect(result.success).toBe(true)
      expect(result.payment).toBeDefined()
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-facilitator.example.com',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should reject payment exceeding maximum', async () => {
      const paymentRequest = {
        recipient: '0x1234567890123456789012345678901234567890',
        amount: '0.02', // Exceeds max of 0.01
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        chain: 'base',
        description: 'Test payment'
      }

      const result = await client.makePayment(paymentRequest)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Payment exceeds maximum')
    })

    it('should handle facilitator errors', async () => {
      const paymentRequest = {
        recipient: '0x1234567890123456789012345678901234567890',
        amount: '0.001',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        chain: 'base',
        description: 'Test payment'
      }

      // Mock facilitator error
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({
          message: 'Facilitator error'
        })
      } as Response)

      const result = await client.makePayment(paymentRequest)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Facilitator error')
    })

    it('should handle network errors', async () => {
      const paymentRequest = {
        recipient: '0x1234567890123456789012345678901234567890',
        amount: '0.001',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        chain: 'base',
        description: 'Test payment'
      }

      // Mock network error
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      const result = await client.makePayment(paymentRequest)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Facilitator connection failed')
    })
  })

  describe('createFetchInterceptor', () => {
    it('should intercept 402 responses and make payment', async () => {
      const interceptor = client.createFetchInterceptor()

      // Mock initial 402 response
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          status: 402,
          headers: {
            get: () => JSON.stringify({
              recipient: '0x1234567890123456789012345678901234567890',
              amount: '0.001',
              token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              chain: 'base',
              description: 'API access'
            })
          }
        } as any)
        // Mock facilitator response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        } as Response)
        // Mock successful retry
        .mockResolvedValueOnce({
          status: 200,
          json: async () => ({ data: 'success' })
        } as Response)

      const response = await interceptor('http://test.com/api')

      expect(response.status).toBe(200)
      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(3)
    })

    it('should pass through non-402 responses', async () => {
      const interceptor = client.createFetchInterceptor()

      vi.mocked(global.fetch).mockResolvedValue({
        status: 200,
        json: async () => ({ data: 'success' })
      } as Response)

      const response = await interceptor('http://test.com/api')

      expect(response.status).toBe(200)
      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
    })
  })

  describe('payment history', () => {
    it('should track payment history', async () => {
      const paymentRequest = {
        recipient: '0x1234567890123456789012345678901234567890',
        amount: '0.001',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        chain: 'base',
        description: 'Test payment'
      }

      // Mock successful payment
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      await client.makePayment(paymentRequest)

      const history = client.getPaymentHistory()
      expect(history).toHaveLength(1)
      expect(history[0].payment.amount).toBe('0.001')
    })

    it('should calculate total spent', async () => {
      // Make multiple payments
      const paymentRequest = {
        recipient: '0x1234567890123456789012345678901234567890',
        amount: '0.001',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        chain: 'base',
        description: 'Test payment'
      }

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      await client.makePayment(paymentRequest)
      await client.makePayment({ ...paymentRequest, amount: '0.002' })

      const total = client.getTotalSpent()
      expect(parseFloat(total)).toBeCloseTo(0.003, 6)
    })

    it('should clear payment history', async () => {
      const paymentRequest = {
        recipient: '0x1234567890123456789012345678901234567890',
        amount: '0.001',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        chain: 'base',
        description: 'Test payment'
      }

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      await client.makePayment(paymentRequest)
      expect(client.getPaymentHistory()).toHaveLength(1)

      client.clearHistory()
      expect(client.getPaymentHistory()).toHaveLength(0)
    })
  })

  describe('auto-approval', () => {
    it('should auto-approve payments when enabled', async () => {
      const paymentRequest = {
        recipient: '0x1234567890123456789012345678901234567890',
        amount: '0.001',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        chain: 'base',
        description: 'Test payment'
      }

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const result = await client.makePayment(paymentRequest)
      expect(result.success).toBe(true)
    })

    it('should reject payments when auto-approve is disabled', async () => {
      const clientNoAuto = new X402Client({
        walletPrivateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        autoApprove: false
      })

      const paymentRequest = {
        recipient: '0x1234567890123456789012345678901234567890',
        amount: '0.001',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        chain: 'base',
        description: 'Test payment'
      }

      const result = await clientNoAuto.makePayment(paymentRequest)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Payment declined')
    })
  })
})