#!/usr/bin/env bun

/**
 * Test script for OpenSea MCP Server
 * Tests the MCP API endpoint with various tool calls
 */

const API_URL = 'http://localhost:3001/api/mcp/opensea'
const ACCESS_TOKEN = process.env.OPENSEA_ACCESS_TOKEN || '7Mwfto759rMlwYcysxpqMHC4rQpm3ZNU22fXKLpDbd'

interface MCPRequest {
  method: string
  params?: any
  id?: string | number
}

async function makeRequest(request: MCPRequest) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

async function runTests() {
  console.log('🧪 Testing OpenSea MCP Server...\n')
  console.log(`📍 API URL: ${API_URL}`)
  console.log(`🔑 Using access token: ${ACCESS_TOKEN.substring(0, 10)}...`)
  console.log('─'.repeat(60))

  try {
    // Test 1: List available tools
    console.log('\n1️⃣  Testing tools/list...')
    const toolsResponse = await makeRequest({
      method: 'tools/list',
      id: 1
    })
    console.log(`✅ Found ${toolsResponse.result.tools.length} tools`)
    console.log('Available tools:')
    toolsResponse.result.tools.forEach((tool: any) => {
      console.log(`  - ${tool.name}: ${tool.description}`)
    })

    // Test 2: Search for popular collections
    console.log('\n2️⃣  Testing search for "pudgy penguins"...')
    const searchResponse = await makeRequest({
      method: 'tools/call',
      params: {
        name: 'search_collections',
        arguments: {
          query: 'pudgy penguins',
          limit: 3
        }
      },
      id: 2
    })
    console.log('✅ Search results:', JSON.stringify(searchResponse.result, null, 2))

    // Test 3: Get trending collections
    console.log('\n3️⃣  Testing get_trending_collections...')
    const trendingResponse = await makeRequest({
      method: 'tools/call',
      params: {
        name: 'get_trending_collections',
        arguments: {
          timeframe: 'ONE_DAY',
          limit: 5
        }
      },
      id: 3
    })
    console.log('✅ Trending collections:', JSON.stringify(trendingResponse.result, null, 2))

    // Test 4: List resources
    console.log('\n4️⃣  Testing resources/list...')
    const resourcesResponse = await makeRequest({
      method: 'resources/list',
      id: 4
    })
    console.log(`✅ Found ${resourcesResponse.result.resources.length} resources`)
    resourcesResponse.result.resources.forEach((resource: any) => {
      console.log(`  - ${resource.name}: ${resource.uri}`)
    })

    // Test 5: Read a resource
    console.log('\n5️⃣  Testing resources/read for trending collections...')
    const readResponse = await makeRequest({
      method: 'resources/read',
      params: {
        uri: 'opensea://collections/trending'
      },
      id: 5
    })
    console.log('✅ Resource data retrieved successfully')

    console.log('\n' + '─'.repeat(60))
    console.log('✅ All tests passed! OpenSea MCP Server is working correctly.')
    console.log('\n🎉 The server is ready to handle MCP requests at:')
    console.log(`   POST ${API_URL}`)
    console.log('\n💡 Use the Authorization header with the access token:')
    console.log(`   Authorization: Bearer ${ACCESS_TOKEN}`)

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    process.exit(1)
  }
}

// Run tests
console.log('OpenSea MCP Server Test Suite')
console.log('=' .repeat(60))
runTests()