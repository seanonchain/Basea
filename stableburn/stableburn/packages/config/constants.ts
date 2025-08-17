// Chain configuration
export const BASE_CHAIN_ID = 8453
export const BASE_RPC_URL = 'https://mainnet.base.org'

// Token addresses
export const USDC_ADDRESS_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
export const PYUSD_ADDRESS_BASE = '0xCfC37A6AB183dd4aED08C204D1c2773c0b1BDf46'
export const PERMIT2_ADDRESS = '0x000000000022d473030f116ddee9f6b43ac78ba3'

// Test token for initial development (will be replaced with $DATABURN)
export const TEST_TOKEN_ADDRESS = '0xd47be5ca7c38b4beb6ffcb9b7da848de71ec8edb'

// DEX Router addresses
export const UNISWAP_V3_ROUTER_BASE = '0x2626664c2603336E57B271c5C0b26F421741e481' // Uniswap V3 SwapRouter02 on Base
export const UNISWAP_V3_QUOTER_BASE = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a' // Uniswap V3 Quoter V2 on Base

// Uniswap V3 Pool addresses on Base
export const USDC_ETH_POOL = '0xd0b53D9277642d899DF5C87A3966A349A798F224' // USDC/ETH 0.05% fee pool
export const WETH_ADDRESS_BASE = '0x4200000000000000000000000000000000000006' // Wrapped ETH on Base

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