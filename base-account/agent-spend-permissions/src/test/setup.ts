/**
 * Vitest test setup
 * Global test configuration and mocks
 */

import { vi } from 'vitest'

// Mock environment variables
process.env.OPENSEA_ACCESS_TOKEN = 'test-access-token'
process.env.X402_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890'
process.env.X402_FACILITATOR_URL = 'https://test-facilitator.example.com'
process.env.X402_PRICE_PER_REQUEST = '0.001'
process.env.CDP_API_KEY_ID = 'test-api-key-id'
process.env.CDP_API_KEY_SECRET = 'test-api-key-secret'
process.env.CDP_WALLET_SECRET = 'test-wallet-secret'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.PAYMASTER_URL = 'https://test-paymaster.example.com'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})