/**
 * x402 Payment Protocol Middleware
 * Handles payment verification and processing for API monetization
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseUnits } from 'viem'
import { base } from 'viem/chains'

export interface X402Config {
  recipientAddress: string
  pricePerRequest: string // Price in USDC
  facilitatorUrl?: string
  tokenAddress?: string // Default to USDC on Base
  allowedTokens?: string[] // List of accepted tokens
}

export interface X402Payment {
  token: string
  amount: string
  from: string
  to: string
  signature: string
  nonce: string
  timestamp: number
  transactionHash?: string
}

export interface X402PricingTier {
  tool: string
  price: string // Price in USDC
  description?: string
}

const DEFAULT_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base

export class X402Middleware {
  private config: X402Config
  private pricingTiers: Map<string, X402PricingTier>
  private paymentCache: Map<string, X402Payment>
  private publicClient: any

  constructor(config: X402Config) {
    this.config = {
      tokenAddress: DEFAULT_USDC_ADDRESS,
      facilitatorUrl: process.env.X402_FACILITATOR_URL,
      allowedTokens: [DEFAULT_USDC_ADDRESS],
      ...config
    }

    this.pricingTiers = new Map()
    this.paymentCache = new Map()
    
    // Initialize default pricing tiers for OpenSea tools
    this.initializeDefaultPricing()

    // Create public client for payment verification
    this.publicClient = createPublicClient({
      chain: base,
      transport: http()
    })
  }

  /**
   * Initialize default pricing for OpenSea MCP tools
   */
  private initializeDefaultPricing() {
    const defaultPricing: X402PricingTier[] = [
      { tool: 'search', price: '0.001', description: 'AI-powered search' },
      { tool: 'search_collections', price: '0.0005', description: 'Collection search' },
      { tool: 'get_collection', price: '0.0005', description: 'Collection details' },
      { tool: 'search_tokens', price: '0.0005', description: 'Token search' },
      { tool: 'get_token', price: '0.0005', description: 'Token details' },
      { tool: 'get_token_swap_quote', price: '0.002', description: 'Swap quote' },
      { tool: 'get_token_balances', price: '0.001', description: 'Token balances' },
      { tool: 'get_nft_balances', price: '0.001', description: 'NFT balances' },
      { tool: 'get_trending_collections', price: '0.001', description: 'Trending data' },
      { tool: 'get_top_collections', price: '0.001', description: 'Top collections' }
    ]

    defaultPricing.forEach(tier => {
      this.pricingTiers.set(tier.tool, tier)
    })
  }

  /**
   * Middleware to verify x402 payment
   */
  async verifyPayment(request: NextRequest): Promise<{ 
    valid: boolean; 
    payment?: X402Payment; 
    error?: string 
  }> {
    try {
      // Check for x402 payment header
      const paymentHeader = request.headers.get('x-402-payment')
      if (!paymentHeader) {
        return { 
          valid: false, 
          error: 'Payment required. Include x-402-payment header.' 
        }
      }

      // Parse payment details
      const payment = JSON.parse(paymentHeader) as X402Payment

      // Validate payment structure
      if (!this.validatePaymentStructure(payment)) {
        return { 
          valid: false, 
          error: 'Invalid payment structure' 
        }
      }

      // Check if payment is cached (to prevent replay attacks)
      const cacheKey = `${payment.from}-${payment.nonce}-${payment.timestamp}`
      if (this.paymentCache.has(cacheKey)) {
        return { 
          valid: false, 
          error: 'Payment already processed' 
        }
      }

      // Verify payment amount based on requested tool
      const tool = this.extractToolFromRequest(request)
      const requiredAmount = this.getRequiredAmount(tool)
      
      if (!this.verifyAmount(payment.amount, requiredAmount)) {
        return { 
          valid: false, 
          error: `Insufficient payment. Required: ${requiredAmount} USDC` 
        }
      }

      // Verify token is allowed
      if (!this.config.allowedTokens?.includes(payment.token)) {
        return { 
          valid: false, 
          error: 'Token not accepted' 
        }
      }

      // Verify recipient address
      if (payment.to.toLowerCase() !== this.config.recipientAddress.toLowerCase()) {
        return { 
          valid: false, 
          error: 'Invalid recipient address' 
        }
      }

      // Verify timestamp (prevent old payments)
      const maxAge = 5 * 60 * 1000 // 5 minutes
      if (Date.now() - payment.timestamp > maxAge) {
        return { 
          valid: false, 
          error: 'Payment expired' 
        }
      }

      // If transaction hash provided, verify on-chain
      if (payment.transactionHash) {
        const verified = await this.verifyOnChain(payment)
        if (!verified) {
          return { 
            valid: false, 
            error: 'On-chain verification failed' 
          }
        }
      }

      // Cache the payment
      this.paymentCache.set(cacheKey, payment)

      // Clean old cache entries
      this.cleanPaymentCache()

      return { valid: true, payment }
    } catch (error) {
      console.error('Payment verification error:', error)
      return { 
        valid: false, 
        error: 'Payment verification failed' 
      }
    }
  }

  /**
   * Create payment request details
   */
  createPaymentRequest(tool: string): {
    recipient: string
    amount: string
    token: string
    chain: string
    description: string
  } {
    const tier = this.pricingTiers.get(tool) || {
      tool: 'default',
      price: this.config.pricePerRequest,
      description: 'API access'
    }

    return {
      recipient: this.config.recipientAddress,
      amount: tier.price,
      token: this.config.tokenAddress || DEFAULT_USDC_ADDRESS,
      chain: 'base',
      description: tier.description || `Payment for ${tool}`
    }
  }

  /**
   * Handle payment required response
   */
  createPaymentRequiredResponse(tool: string): NextResponse {
    const paymentRequest = this.createPaymentRequest(tool)

    return NextResponse.json(
      {
        error: 'Payment Required',
        code: 402,
        payment: {
          ...paymentRequest,
          instructions: 'Include payment details in x-402-payment header',
          facilitator: this.config.facilitatorUrl
        }
      },
      { 
        status: 402,
        headers: {
          'X-402-Payment-Request': JSON.stringify(paymentRequest)
        }
      }
    )
  }

  /**
   * Validate payment structure
   */
  private validatePaymentStructure(payment: X402Payment): boolean {
    return !!(
      payment.token &&
      payment.amount &&
      payment.from &&
      payment.to &&
      payment.signature &&
      payment.nonce &&
      payment.timestamp
    )
  }

  /**
   * Extract tool name from request
   */
  private extractToolFromRequest(request: NextRequest): string {
    try {
      // Try to get tool from URL path
      const url = new URL(request.url)
      const pathParts = url.pathname.split('/')
      const tool = pathParts[pathParts.length - 1]
      
      if (tool && this.pricingTiers.has(tool)) {
        return tool
      }

      // Try to get from request body (for MCP requests)
      // This would need to be parsed from the actual request
      return 'default'
    } catch {
      return 'default'
    }
  }

  /**
   * Get required payment amount for a tool
   */
  private getRequiredAmount(tool: string): string {
    const tier = this.pricingTiers.get(tool)
    return tier?.price || this.config.pricePerRequest
  }

  /**
   * Verify payment amount
   */
  private verifyAmount(paid: string, required: string): boolean {
    try {
      const paidAmount = parseUnits(paid, 6) // USDC has 6 decimals
      const requiredAmount = parseUnits(required, 6)
      return paidAmount >= requiredAmount
    } catch {
      return false
    }
  }

  /**
   * Verify payment on-chain
   */
  private async verifyOnChain(payment: X402Payment): Promise<boolean> {
    try {
      if (!payment.transactionHash) return false

      // Get transaction receipt
      const receipt = await this.publicClient.getTransactionReceipt({
        hash: payment.transactionHash
      })

      if (!receipt || receipt.status !== 'success') {
        return false
      }

      // Verify the transaction matches payment details
      const tx = await this.publicClient.getTransaction({
        hash: payment.transactionHash
      })

      return (
        tx.from.toLowerCase() === payment.from.toLowerCase() &&
        tx.to?.toLowerCase() === payment.token.toLowerCase()
      )
    } catch (error) {
      console.error('On-chain verification error:', error)
      return false
    }
  }

  /**
   * Clean old payment cache entries
   */
  private cleanPaymentCache() {
    const maxAge = 10 * 60 * 1000 // 10 minutes
    const now = Date.now()

    for (const [key, payment] of this.paymentCache.entries()) {
      if (now - payment.timestamp > maxAge) {
        this.paymentCache.delete(key)
      }
    }
  }

  /**
   * Get pricing information
   */
  getPricing(): X402PricingTier[] {
    return Array.from(this.pricingTiers.values())
  }

  /**
   * Update pricing for a specific tool
   */
  updatePricing(tool: string, price: string, description?: string) {
    this.pricingTiers.set(tool, { tool, price, description })
  }
}