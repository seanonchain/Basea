export interface X402Config {
  recipientAddress: string
  pricePerRequest: string
  facilitatorUrl?: string
  tokenAddress?: string
  allowedTokens?: string[]
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
  price: string
  description?: string
}

export interface X402Resource {
  id: string
  name: string
  description: string
  endpoint: string
  pricing: X402PricingTier[]
  metadata?: Record<string, any>
}