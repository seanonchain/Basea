// Chain configuration
export const BASE_CHAIN_ID = 8453
export const BASE_RPC_URL = 'https://mainnet.base.org'

// Token addresses
export const USDC_ADDRESS_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
export const PERMIT2_ADDRESS = '0x000000000022d473030f116ddee9f6b43ac78ba3'

// API endpoints
export const X402_FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402-facilitator.coinbase.com'
export const OPENSEA_API_URL = 'https://api.opensea.io/v2'
export const ZORA_API_URL = 'https://api.zora.co'

// Agent configuration
export const AGENT_ENS_NAME = 'agent.base.eth'
export const AGENT_VERSION = '1.0.0'

// Pricing defaults (in USDC)
export const DEFAULT_X402_PRICE = '0.001'
export const DEFAULT_TIP_MINIMUM = '0.10'

// Rate limits
export const MAX_REQUESTS_PER_MINUTE = 60
export const MAX_REQUESTS_PER_DAY = 10000