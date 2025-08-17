#!/usr/bin/env bun

/**
 * Initialize an already deployed DataBurnReceiver contract
 * 
 * Usage:
 *   bun run scripts/initialize-databurn-receiver.ts <contract-address>
 */

import { createWalletClient, createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as path from 'path'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })
dotenv.config({ path: path.join(__dirname, '../apps/agent-base-eth/.env') })

// Import constants
import { 
  TEST_TOKEN_ADDRESS, 
  UNISWAP_V2_ROUTER_BASE,
  BASE_RPC_URL 
} from '../packages/config/constants'

// Read contract ABI
const contractPath = path.join(__dirname, '../apps/agent-base-eth/out/DataBurnReceiver.sol/DataBurnReceiver.json')

async function initializeDataBurnReceiver() {
  // Get contract address from command line
  const contractAddress = process.argv[2]
  if (!contractAddress) {
    console.error('❌ Please provide the contract address as an argument')
    console.error('   Usage: bun run scripts/initialize-databurn-receiver.ts <contract-address>')
    process.exit(1)
  }

  // Check for required environment variables
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY environment variable is required')
  }

  // Use TEST_TOKEN_ADDRESS or DATABURN_CONTRACT_ADDRESS
  const tokenAddress = process.env.DATABURN_CONTRACT_ADDRESS || 
                      process.env.TEST_TOKEN_ADDRESS || 
                      TEST_TOKEN_ADDRESS
  
  console.log(`📝 Using token address: ${tokenAddress}`)
  console.log(`📝 Using DEX router: ${UNISWAP_V2_ROUTER_BASE}`)
  console.log(`📝 Contract to initialize: ${contractAddress}`)

  // Read contract ABI
  if (!fs.existsSync(contractPath)) {
    console.error('❌ Contract artifacts not found. Please compile contracts first:')
    console.error('   cd apps/agent-base-eth && forge build')
    process.exit(1)
  }

  const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
  const { abi } = contractArtifact

  // Setup viem clients
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(BASE_RPC_URL)
  })

  const publicClient = createPublicClient({
    chain: base,
    transport: http(BASE_RPC_URL)
  })

  console.log('🔧 Initializing contract...')
  console.log(`📍 Initializer address: ${account.address}`)

  try {
    // Check if already initialized
    const databurnToken = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi,
      functionName: 'databurnToken'
    })

    if (databurnToken !== '0x0000000000000000000000000000000000000000') {
      console.log('⚠️  Contract is already initialized!')
      console.log(`   Current DATABURN token: ${databurnToken}`)
      process.exit(0)
    }

    // Initialize the contract
    const hash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi,
      functionName: 'initialize',
      args: [tokenAddress, UNISWAP_V2_ROUTER_BASE]
    })

    console.log(`📦 Transaction hash: ${hash}`)
    console.log('⏳ Waiting for confirmation...')

    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      confirmations: 2 
    })

    console.log('✅ Contract initialized successfully!')

    // Update deployment info
    const deploymentsDir = path.join(__dirname, '../deployments')
    const deploymentFile = path.join(deploymentsDir, 'DataBurnReceiver-base.json')
    
    if (fs.existsSync(deploymentFile)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))
      deploymentInfo.initialized = true
      deploymentInfo.initializationTx = hash
      deploymentInfo.tokenAddress = tokenAddress
      deploymentInfo.dexRouter = UNISWAP_V2_ROUTER_BASE
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2))
      console.log(`📄 Updated deployment info: ${deploymentFile}`)
    }

    console.log('\n🎉 Initialization complete!')
    console.log('\nContract details:')
    console.log(`  Address: ${contractAddress}`)
    console.log(`  Token: ${tokenAddress}`)
    console.log(`  DEX Router: ${UNISWAP_V2_ROUTER_BASE}`)
    console.log('\nNext steps:')
    console.log('1. Update .env with:')
    console.log(`   X402_RECEIVER_ADDRESS=${contractAddress}`)
    console.log('2. Test the contract by sending USDC or PYUSD')

  } catch (error) {
    console.error('❌ Initialization failed:', error)
    process.exit(1)
  }
}

// Run initialization
initializeDataBurnReceiver().catch(console.error)