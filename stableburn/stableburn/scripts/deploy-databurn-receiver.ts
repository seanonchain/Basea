#!/usr/bin/env bun

/**
 * Deploy DataBurnReceiver contract to Base
 * 
 * Usage:
 *   bun run scripts/deploy-databurn-receiver.ts
 * 
 * Required environment variables:
 *   - DEPLOYER_PRIVATE_KEY: Private key of the deployer wallet
 *   - TEST_TOKEN_ADDRESS or DATABURN_CONTRACT_ADDRESS: Token to burn
 */

import { createWalletClient, createPublicClient, http, parseEther, encodeFunctionData, getContractAddress } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from multiple possible locations
dotenv.config({ path: path.join(__dirname, '../.env') })
dotenv.config({ path: path.join(__dirname, '../apps/agent-base-eth/.env') })

// Import constants
import { 
  TEST_TOKEN_ADDRESS, 
  UNISWAP_V2_ROUTER_BASE,
  BASE_RPC_URL 
} from '../packages/config/constants'

// Read compiled contract artifacts
const contractPath = path.join(__dirname, '../apps/agent-base-eth/out/DataBurnReceiver.sol/DataBurnReceiver.json')

async function deployDataBurnReceiver() {
  // Check for required environment variables
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY environment variable is required')
  }

  // Use DATABURN_CONTRACT_ADDRESS if available, otherwise use TEST_TOKEN_ADDRESS
  const tokenAddress = process.env.DATABURN_CONTRACT_ADDRESS || TEST_TOKEN_ADDRESS
  console.log(`📝 Using token address: ${tokenAddress}`)

  // Read contract ABI and bytecode
  if (!fs.existsSync(contractPath)) {
    console.error('❌ Contract artifacts not found. Please compile contracts first:')
    console.error('   cd apps/agent-base-eth && forge build')
    process.exit(1)
  }

  const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
  const { abi, bytecode } = contractArtifact

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

  console.log('🚀 Deploying DataBurnReceiver contract to Base...')
  console.log(`📍 Deployer address: ${account.address}`)

  try {
    // Get current nonce for address calculation
    const nonce = await publicClient.getTransactionCount({
      address: account.address
    })

    // Calculate the contract address
    const contractAddress = getContractAddress({
      from: account.address,
      nonce: BigInt(nonce)
    })
    console.log(`📋 Expected contract address: ${contractAddress}`)

    // Deploy the contract
    const hash = await walletClient.deployContract({
      abi,
      bytecode: bytecode.object as `0x${string}`,
      args: [], // DataBurnReceiver constructor takes no arguments
    })

    console.log(`📦 Transaction hash: ${hash}`)
    console.log('⏳ Waiting for confirmation...')

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      confirmations: 2 
    })

    console.log(`✅ Contract deployed at: ${receipt.contractAddress}`)

    // Initialize the contract with token and DEX router
    console.log('🔧 Initializing contract...')
    
    const initHash = await walletClient.writeContract({
      address: receipt.contractAddress!,
      abi,
      functionName: 'initialize',
      args: [tokenAddress, UNISWAP_V2_ROUTER_BASE]
    })

    console.log(`📦 Initialization transaction: ${initHash}`)

    const initReceipt = await publicClient.waitForTransactionReceipt({ 
      hash: initHash,
      confirmations: 2 
    })

    console.log('✅ Contract initialized successfully!')

    // Save deployment info
    const deploymentInfo = {
      network: 'base',
      chainId: base.id,
      contractAddress: receipt.contractAddress,
      deploymentTx: hash,
      initializationTx: initHash,
      tokenAddress,
      dexRouter: UNISWAP_V2_ROUTER_BASE,
      deployer: account.address,
      deployedAt: new Date().toISOString()
    }

    const deploymentsDir = path.join(__dirname, '../deployments')
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true })
    }

    const deploymentFile = path.join(deploymentsDir, 'DataBurnReceiver-base.json')
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2))

    console.log(`\n📄 Deployment info saved to: ${deploymentFile}`)
    console.log('\n🎉 Deployment complete!')
    console.log('\nNext steps:')
    console.log('1. Update .env with:')
    console.log(`   X402_RECEIVER_ADDRESS=${receipt.contractAddress}`)
    console.log('2. Verify contract on Basescan:')
    console.log(`   https://basescan.org/address/${receipt.contractAddress}`)
    console.log('3. Test the contract by sending USDC or PYUSD')

  } catch (error) {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  }
}

// Run deployment
deployDataBurnReceiver().catch(console.error)