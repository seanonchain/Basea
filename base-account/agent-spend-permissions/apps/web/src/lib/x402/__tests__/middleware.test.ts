/**
 * Tests for x402 Middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { X402Middleware } from '../middleware'

describe('X402Middleware', () => {
  let middleware: X402Middleware

  beforeEach(() => {
    middleware = new X402Middleware({
      recipientAddress: '0x1234567890123456789012345678901234567890',
      pricePerRequest: '0.001',
      facilitatorUrl: 'https://test-facilitator.example.com'
    })
  })

  describe('verifyPayment', () => {
    it('should reject request without payment header', async () => {
      const request = new NextRequest('http://localhost/api/test')
      
      const result = await middleware.verifyPayment(request)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Payment required')
    })

    it('should validate correct payment structure', async () => {
      const payment = {
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: '0.001',
        from: '0xabc123',
        to: '0x1234567890123456789012345678901234567890',
        signature: '0xsignature',
        nonce: 'nonce-123',
        timestamp: Date.now()
      }

      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-402-payment': JSON.stringify(payment)
        }
      })

      const result = await middleware.verifyPayment(request)
      
      expect(result.valid).toBe(true)
      expect(result.payment).toEqual(payment)
    })

    it('should reject expired payments', async () => {
      const payment = {
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: '0.001',
        from: '0xabc123',
        to: '0x1234567890123456789012345678901234567890',
        signature: '0xsignature',
        nonce: 'nonce-123',
        timestamp: Date.now() - 10 * 60 * 1000 // 10 minutes ago
      }

      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-402-payment': JSON.stringify(payment)
        }
      })

      const result = await middleware.verifyPayment(request)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Payment expired')
    })

    it('should reject insufficient payment amount', async () => {
      const payment = {
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: '0.0001', // Less than required
        from: '0xabc123',
        to: '0x1234567890123456789012345678901234567890',
        signature: '0xsignature',
        nonce: 'nonce-123',
        timestamp: Date.now()
      }

      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-402-payment': JSON.stringify(payment)
        }
      })

      const result = await middleware.verifyPayment(request)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Insufficient payment')
    })

    it('should reject wrong recipient address', async () => {
      const payment = {
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: '0.001',
        from: '0xabc123',
        to: '0xwrongaddress', // Wrong recipient
        signature: '0xsignature',
        nonce: 'nonce-123',
        timestamp: Date.now()
      }

      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-402-payment': JSON.stringify(payment)
        }
      })

      const result = await middleware.verifyPayment(request)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid recipient address')
    })

    it('should prevent replay attacks', async () => {
      const payment = {
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: '0.001',
        from: '0xabc123',
        to: '0x1234567890123456789012345678901234567890',
        signature: '0xsignature',
        nonce: 'nonce-123',
        timestamp: Date.now()
      }

      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-402-payment': JSON.stringify(payment)
        }
      })

      // First payment should succeed
      const result1 = await middleware.verifyPayment(request)
      expect(result1.valid).toBe(true)

      // Second payment with same nonce should fail
      const result2 = await middleware.verifyPayment(request)
      expect(result2.valid).toBe(false)
      expect(result2.error).toContain('Payment already processed')
    })
  })

  describe('createPaymentRequest', () => {
    it('should create payment request for a tool', () => {
      const request = middleware.createPaymentRequest('search')
      
      expect(request.recipient).toBe('0x1234567890123456789012345678901234567890')
      expect(request.amount).toBe('0.001')
      expect(request.token).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')
      expect(request.chain).toBe('base')
      expect(request.description).toContain('search')
    })

    it('should use default price for unknown tools', () => {
      const request = middleware.createPaymentRequest('unknown_tool')
      
      expect(request.amount).toBe('0.001')
      expect(request.description).toContain('API access')
    })
  })

  describe('createPaymentRequiredResponse', () => {
    it('should create 402 response with payment details', () => {
      const response = middleware.createPaymentRequiredResponse('search')
      
      expect(response.status).toBe(402)
      
      // Parse the response body
      const body = JSON.parse(response.body?.toString() || '{}')
      expect(body.error).toBe('Payment Required')
      expect(body.code).toBe(402)
      expect(body.payment).toBeDefined()
      expect(body.payment.recipient).toBe('0x1234567890123456789012345678901234567890')
    })
  })

  describe('getPricing', () => {
    it('should return all pricing tiers', () => {
      const pricing = middleware.getPricing()
      
      expect(pricing).toBeInstanceOf(Array)
      expect(pricing.length).toBeGreaterThan(0)
      
      const searchTier = pricing.find(p => p.tool === 'search')
      expect(searchTier).toBeDefined()
      expect(searchTier?.price).toBe('0.001')
    })
  })

  describe('updatePricing', () => {
    it('should update pricing for a tool', () => {
      middleware.updatePricing('custom_tool', '0.005', 'Custom tool access')
      
      const pricing = middleware.getPricing()
      const customTier = pricing.find(p => p.tool === 'custom_tool')
      
      expect(customTier).toBeDefined()
      expect(customTier?.price).toBe('0.005')
      expect(customTier?.description).toBe('Custom tool access')
    })
  })
})