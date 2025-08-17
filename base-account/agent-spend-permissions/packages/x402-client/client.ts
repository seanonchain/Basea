/**
 * x402 Payment Client
 * Handles automatic payment for x402-enabled APIs
 */

import { createWalletClient, http, parseUnits, formatUnits } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

export interface X402ClientConfig {
  walletPrivateKey?: string
  facilitatorUrl?: string
  maxPaymentPerRequest?: string // Max USDC per request
  autoApprove?: boolean // Auto-approve payments under threshold
}

export interface PaymentRequest {
  recipient: string
  amount: string
  token: string
  chain: string
  description: string
}

export class X402Client {
  private config: X402ClientConfig
  private walletClient: any
  private account: any
  private paymentHistory: Map<string, any>

  constructor(config: X402ClientConfig) {
    this.config = {
      facilitatorUrl: process.env.X402_FACILITATOR_URL,
      maxPaymentPerRequest: '0.01', // Default max $0.01 per request
      autoApprove: true,
      ...config
    }

    this.paymentHistory = new Map()

    // Initialize wallet if private key provided
    if (config.walletPrivateKey) {
      this.account = privateKeyToAccount(config.walletPrivateKey as `0x${string}`)
      this.walletClient = createWalletClient({
        account: this.account,
        chain: base,
        transport: http()
      })
    }
  }

  /**
   * Make an x402 payment
   */
  async makePayment(request: PaymentRequest): Promise<{
    success: boolean
    payment?: any
    error?: string
  }> {
    try {
      // Validate payment amount against max
      if (!this.validateAmount(request.amount)) {
        return {
          success: false,
          error: `Payment exceeds maximum: ${this.config.maxPaymentPerRequest} USDC`
        }
      }

      // Check if auto-approve is enabled
      if (!this.config.autoApprove) {
        const approved = await this.requestUserApproval(request)
        if (!approved) {
          return {
            success: false,
            error: 'Payment declined by user'
          }
        }
      }

      // Create payment object
      const payment = await this.createPayment(request)

      // If facilitator URL is provided, use it
      if (this.config.facilitatorUrl) {
        return await this.processThroughFacilitator(payment)
      }

      // Otherwise, process directly
      return await this.processDirectPayment(payment)
    } catch (error) {
      console.error('Payment error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      }
    }
  }

  /**
   * Create payment object with signature
   */
  private async createPayment(request: PaymentRequest): Promise<any> {
    const nonce = this.generateNonce()
    const timestamp = Date.now()

    const payment = {
      token: request.token,
      amount: request.amount,
      from: this.account.address,
      to: request.recipient,
      nonce,
      timestamp,
      chain: request.chain,
      description: request.description
    }

    // Sign the payment
    const message = this.createPaymentMessage(payment)
    const signature = await this.walletClient.signMessage({
      message
    })

    return {
      ...payment,
      signature
    }
  }

  /**
   * Process payment through CDP facilitator
   */
  private async processThroughFacilitator(payment: any): Promise<any> {
    try {
      const response = await fetch(this.config.facilitatorUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment,
          type: 'x402'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.message || 'Facilitator payment failed'
        }
      }

      const result = await response.json()

      // Store in history
      this.paymentHistory.set(payment.nonce, {
        payment,
        result,
        timestamp: Date.now()
      })

      return {
        success: true,
        payment: result
      }
    } catch (error) {
      return {
        success: false,
        error: 'Facilitator connection failed'
      }
    }
  }

  /**
   * Process payment directly on-chain
   */
  private async processDirectPayment(payment: any): Promise<any> {
    try {
      // Prepare USDC transfer
      const usdcAddress = payment.token
      const amount = parseUnits(payment.amount, 6) // USDC has 6 decimals

      // ERC20 transfer ABI
      const transferAbi = [
        {
          name: 'transfer',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ type: 'bool' }]
        }
      ]

      // Execute transfer
      const hash = await this.walletClient.writeContract({
        address: usdcAddress,
        abi: transferAbi,
        functionName: 'transfer',
        args: [payment.to, amount]
      })

      // Wait for confirmation
      const receipt = await this.walletClient.waitForTransactionReceipt({
        hash
      })

      if (receipt.status !== 'success') {
        return {
          success: false,
          error: 'Transaction failed'
        }
      }

      // Update payment with transaction hash
      payment.transactionHash = hash

      // Store in history
      this.paymentHistory.set(payment.nonce, {
        payment,
        receipt,
        timestamp: Date.now()
      })

      return {
        success: true,
        payment: {
          ...payment,
          transactionHash: hash
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Direct payment failed'
      }
    }
  }

  /**
   * Intercept fetch requests and add x402 payments
   */
  createFetchInterceptor() {
    const client = this

    return async function x402Fetch(
      url: string | URL | Request,
      init?: RequestInit
    ): Promise<Response> {
      // Make initial request
      const response = await fetch(url, init)

      // Check if payment is required
      if (response.status === 402) {
        const paymentHeader = response.headers.get('X-402-Payment-Request')
        if (!paymentHeader) {
          throw new Error('Payment required but no payment details provided')
        }

        const paymentRequest = JSON.parse(paymentHeader) as PaymentRequest

        // Make payment
        const paymentResult = await client.makePayment(paymentRequest)
        if (!paymentResult.success) {
          throw new Error(`Payment failed: ${paymentResult.error}`)
        }

        // Retry request with payment header
        const newInit = {
          ...init,
          headers: {
            ...init?.headers,
            'x-402-payment': JSON.stringify(paymentResult.payment)
          }
        }

        return fetch(url, newInit)
      }

      return response
    }
  }

  /**
   * Validate payment amount
   */
  private validateAmount(amount: string): boolean {
    try {
      const requested = parseUnits(amount, 6)
      const max = parseUnits(this.config.maxPaymentPerRequest!, 6)
      return requested <= max
    } catch {
      return false
    }
  }

  /**
   * Request user approval for payment
   */
  private async requestUserApproval(request: PaymentRequest): Promise<boolean> {
    // In a real implementation, this would show a UI prompt
    // For now, return true if auto-approve is enabled
    return this.config.autoApprove || false
  }

  /**
   * Create payment message for signing
   */
  private createPaymentMessage(payment: any): string {
    return `x402 Payment
To: ${payment.to}
Amount: ${payment.amount} USDC
Token: ${payment.token}
Chain: ${payment.chain}
Nonce: ${payment.nonce}
Timestamp: ${payment.timestamp}`
  }

  /**
   * Generate unique nonce
   */
  private generateNonce(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get payment history
   */
  getPaymentHistory(): any[] {
    return Array.from(this.paymentHistory.values())
  }

  /**
   * Get total spent
   */
  getTotalSpent(): string {
    let total = BigInt(0)
    for (const entry of this.paymentHistory.values()) {
      const amount = parseUnits(entry.payment.amount, 6)
      total += amount
    }
    return formatUnits(total, 6)
  }

  /**
   * Clear payment history
   */
  clearHistory() {
    this.paymentHistory.clear()
  }
}