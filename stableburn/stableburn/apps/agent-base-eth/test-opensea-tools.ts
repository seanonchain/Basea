#!/usr/bin/env bun

/**
 * Test script for all 17 OpenSea MCP tools via AI SDK
 */

const API_URL = 'http://localhost:3001'

// Define all 17 tools with test parameters
const OPENSEA_TOOLS = [
  {
    name: 'search_collections',
    params: { query: 'pudgy penguins' },
    description: 'Search for NFT collections'
  },
  {
    name: 'search_items',
    params: { query: 'azuki', limit: 5 },
    description: 'Search for NFT items'
  },
  {
    name: 'get_collection',
    params: { slug: 'boredapeyachtclub' },
    description: 'Get collection details'
  },
  {
    name: 'get_item',
    params: { 
      chain: 'ethereum',
      contract_address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      token_id: '1'
    },
    description: 'Get specific NFT item'
  },
  {
    name: 'get_token',
    params: { 
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chain: 'ethereum'
    },
    description: 'Get token information'
  },
  {
    name: 'search_tokens',
    params: { query: 'USDC' },
    description: 'Search for tokens'
  },
  {
    name: 'get_token_swap_quote',
    params: {
      from_token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      to_token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      amount: '100000000', // 100 USDC
      chain: 'ethereum'
    },
    description: 'Get token swap quote'
  },
  {
    name: 'get_token_balances',
    params: {
      wallet_address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
      chains: ['ethereum']
    },
    description: 'Get token balances for wallet'
  },
  {
    name: 'get_token_balance',
    params: {
      wallet_address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      token_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chain: 'ethereum'
    },
    description: 'Get specific token balance'
  },
  {
    name: 'get_nft_balances',
    params: {
      wallet_address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      chains: ['ethereum'],
      limit: 5
    },
    description: 'Get NFT balances for wallet'
  },
  {
    name: 'get_top_collections',
    params: {
      period: 'ONE_DAY',
      limit: 5
    },
    description: 'Get top NFT collections'
  },
  {
    name: 'get_trending_collections',
    params: {
      period: 'ONE_DAY',
      limit: 5
    },
    description: 'Get trending NFT collections'
  },
  {
    name: 'get_top_tokens',
    params: {
      period: 'ONE_DAY',
      limit: 5
    },
    description: 'Get top tokens'
  },
  {
    name: 'get_trending_tokens',
    params: {
      period: 'ONE_DAY',
      limit: 5
    },
    description: 'Get trending tokens'
  },
  {
    name: 'search',
    params: { query: 'bored ape' },
    description: 'General search across OpenSea'
  },
  {
    name: 'get_profile',
    params: { 
      wallet_address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    },
    description: 'Get user profile'
  },
  {
    name: 'fetch',
    params: {
      url: 'https://api.opensea.io/api/v2/collections/boredapeyachtclub/stats'
    },
    description: 'Direct fetch from OpenSea API'
  }
]

// Test function for a single tool
async function testTool(tool: typeof OPENSEA_TOOLS[0]) {
  console.log(`\n📋 Testing: ${tool.name}`)
  console.log(`   ${tool.description}`)
  console.log(`   Params:`, JSON.stringify(tool.params, null, 2))
  
  try {
    const response = await fetch(`${API_URL}/api/mcp/opensea_${tool.name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tool.params)
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log(`   ✅ Success!`)
      // Show a sample of the response
      if (data.data) {
        const preview = JSON.stringify(data.data, null, 2)
        const lines = preview.split('\n')
        if (lines.length > 10) {
          console.log('   Response preview:')
          console.log('   ' + lines.slice(0, 10).join('\n   '))
          console.log('   ... (truncated)')
        } else {
          console.log('   Response:', preview)
        }
      }
    } else {
      console.log(`   ❌ Failed: ${data.error}`)
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
  }
}

// Main test runner
async function runTests() {
  console.log('====================================')
  console.log('🧪 Testing All 17 OpenSea MCP Tools')
  console.log('====================================')
  
  // Test each tool sequentially to avoid overwhelming the server
  for (const tool of OPENSEA_TOOLS) {
    await testTool(tool)
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n====================================')
  console.log('✅ All tests completed!')
  console.log('====================================')
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch(`${API_URL}/health`)
    const data = await response.json()
    if (data.status === 'ok') {
      console.log('✅ Server is running on', API_URL)
      return true
    }
  } catch (error) {
    console.log('❌ Server is not running on', API_URL)
    console.log('   Please start the server with: bun run dev')
    return false
  }
}

// Run the tests
async function main() {
  const serverOk = await checkServer()
  if (serverOk) {
    await runTests()
  }
}

main().catch(console.error)