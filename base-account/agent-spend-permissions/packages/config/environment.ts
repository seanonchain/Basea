export function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export function getOptionalEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue
}

export const env = {
  // CDP Configuration
  CDP_API_KEY_ID: () => getRequiredEnv('CDP_API_KEY_ID'),
  CDP_API_KEY_SECRET: () => getRequiredEnv('CDP_API_KEY_SECRET'),
  CDP_WALLET_SECRET: () => getRequiredEnv('CDP_WALLET_SECRET'),
  
  // OpenAI
  OPENAI_API_KEY: () => getRequiredEnv('OPENAI_API_KEY'),
  
  // Blockchain
  PAYMASTER_URL: () => getRequiredEnv('PAYMASTER_URL'),
  
  // Optional APIs
  ZORA_API_KEY: () => getOptionalEnv('ZORA_API_KEY'),
  OPENSEA_ACCESS_TOKEN: () => getOptionalEnv('OPENSEA_ACCESS_TOKEN'),
  
  // x402
  X402_WALLET_ADDRESS: () => getOptionalEnv('X402_WALLET_ADDRESS'),
  X402_FACILITATOR_URL: () => getOptionalEnv('X402_FACILITATOR_URL'),
  X402_PRICE_PER_REQUEST: () => getOptionalEnv('X402_PRICE_PER_REQUEST', '0.001'),
  
  // XMTP
  XMTP_ENV: () => getOptionalEnv('XMTP_ENV', 'production') as 'production' | 'dev' | 'local',
  XMTP_PRIVATE_KEY: () => getOptionalEnv('XMTP_PRIVATE_KEY'),
  
  // Token
  DATABURN_CONTRACT_ADDRESS: () => getOptionalEnv('DATABURN_CONTRACT_ADDRESS'),
  CLANKER_API_KEY: () => getOptionalEnv('CLANKER_API_KEY'),
  
  // Base App
  BASE_APP_ID: () => getOptionalEnv('BASE_APP_ID'),
  MINIKIT_SECRET: () => getOptionalEnv('MINIKIT_SECRET'),
  MINIKIT_REDIRECT_URI: () => getOptionalEnv('MINIKIT_REDIRECT_URI'),
}