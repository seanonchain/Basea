#!/usr/bin/env bun

/**
 * Test the two-part swap: USDC -> ETH -> DATABURN
 * This tests the DataBurnReceiver's swap functionality
 */

import { createWalletClient, createPublicClient, http, parseUnits, encodeFunctionData, parseAbi, decodeEventLog } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config()

// Contract addresses
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
const DATABURN_TOKEN = '0xd47be5ca7c38b4beb6ffcb9b7da848de71ec8edb' as const
const RECEIVER_ADDRESS = '0x76a6ed9dece032d227b713010022c5e43a307d8a' as const

// Uniswap V3 Router on Base
const UNISWAP_V3_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481' as const

// BaseSwap Router (V2 fork) - might be needed for DATABURN
const BASESWAP_ROUTER = '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86' as const

// WETH on Base
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as const

// ABIs
const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)'
])

const RECEIVER_ABI = parseAbi([
  'function initialize(address _databurnToken, address _dexRouter)',
  'function receiveToken(address token, uint256 amount)',
  'function receivePayment(uint256 amount, bytes32 paymentId)',
  'function getStatistics() view returns (uint256 totalBurnedAmount, uint256 totalValueReceivedAmount, address databurnTokenAddress, address dexRouterAddress, bool isPaused)',
  'function databurnToken() view returns (address)',
  'function dexRouter() view returns (address)',
  'event PaymentReceived(address indexed from, address indexed token, uint256 amount, bytes32 paymentId)',
  'event TokensSwapped(address indexed tokenIn, uint256 amountIn, uint256 databurnOut, address[] path)',
  'event TokensBurned(uint256 amount, uint256 totalBurnedToDate)'
])

// Uniswap V3 Quoter for price checks
const QUOTER_ABI = parseAbi([
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) returns (uint256 amountOut)'
])

const UNISWAP_V3_QUOTER = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a' as const

async function main() {
  console.log('====================================')
  console.log('🔄 Testing USDC -> ETH -> DATABURN Swap')
  console.log('====================================')
  
  const privateKey = process.env.WALLET_KEY || process.env.DEPLOYER_PRIVATE_KEY
  if (!privateKey) {
    console.error('❌ No private key found')
    process.exit(1)
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`)
  console.log(`📝 Wallet address: ${account.address}`)
  console.log(`📝 Receiver contract: ${RECEIVER_ADDRESS}`)
  console.log(`📝 DATABURN token: ${DATABURN_TOKEN}`)

  // Use alternative RPC to avoid rate limits
  const rpcUrl = 'https://base.llamarpc.com'
  
  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl)
  })

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl)
  })

  try {
    // 1. Check initial balances
    console.log('\n📊 Checking initial balances...')
    
    const usdcBalance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    })
    console.log(`💵 USDC balance: ${Number(usdcBalance) / 1e6} USDC`)

    const databurnBalance = await publicClient.readContract({
      address: DATABURN_TOKEN,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    })
    console.log(`🔥 DATABURN balance: ${Number(databurnBalance) / 1e18}`)

    const ethBalance = await publicClient.getBalance({ address: account.address })
    console.log(`⛽ ETH balance: ${Number(ethBalance) / 1e18} ETH`)

    // 2. Check receiver contract initialization
    console.log('\n🔍 Checking receiver contract...')
    
    const stats = await publicClient.readContract({
      address: RECEIVER_ADDRESS,
      abi: RECEIVER_ABI,
      functionName: 'getStatistics'
    })
    
    console.log(`   Total burned: ${Number(stats[0]) / 1e18} DATABURN`)
    console.log(`   Total value received: ${Number(stats[1]) / 1e6} USD`)
    console.log(`   DATABURN token: ${stats[2]}`)
    console.log(`   DEX router: ${stats[3]}`)
    console.log(`   Is paused: ${stats[4]}`)

    if (stats[2] === '0x0000000000000000000000000000000000000000') {
      console.log('\n⚠️  Receiver contract not initialized. Initializing...')
      
      // Initialize with DATABURN token and BaseSwap router
      const { request } = await publicClient.simulateContract({
        account,
        address: RECEIVER_ADDRESS,
        abi: RECEIVER_ABI,
        functionName: 'initialize',
        args: [DATABURN_TOKEN, BASESWAP_ROUTER]
      })
      
      const initHash = await walletClient.writeContract(request)
      console.log(`📝 Initialization tx: ${initHash}`)
      
      const initReceipt = await publicClient.waitForTransactionReceipt({ hash: initHash })
      console.log(`✅ Contract initialized in block ${initReceipt.blockNumber}`)
    }

    // 3. Check price on Uniswap V3 (USDC -> WETH)
    console.log('\n💱 Checking swap prices...')
    
    // For V3, we would use the quoter but it's complex
    // For now, let's proceed with the test
    
    // 4. Send USDC to receiver contract
    const amountToSwap = parseUnits('0.01', 6) // 0.01 USDC
    console.log(`\n📤 Sending 0.01 USDC to receiver contract...`)
    
    // First approve the receiver contract
    console.log(`🔓 Approving receiver contract to spend USDC...`)
    
    const { request: approveRequest } = await publicClient.simulateContract({
      account,
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [RECEIVER_ADDRESS, amountToSwap]
    })
    
    const approveTx = await walletClient.writeContract(approveRequest)
    console.log(`📝 Approval tx: ${approveTx}`)
    
    const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTx })
    console.log(`✅ Approval confirmed in block ${approveReceipt.blockNumber}`)
    
    // Check allowance
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account.address, RECEIVER_ADDRESS]
    })
    console.log(`   Allowance: ${Number(allowance) / 1e6} USDC`)
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate a unique payment ID
    const paymentId = `0x${Buffer.from(`test-${Date.now()}`).toString('hex').padEnd(64, '0')}` as `0x${string}`
    
    // Call receiveToken to trigger the swap
    console.log(`\n🔄 Triggering swap through receiveToken...`)
    
    const { request } = await publicClient.simulateContract({
      account,
      address: RECEIVER_ADDRESS,
      abi: RECEIVER_ABI,
      functionName: 'receiveToken',
      args: [USDC_ADDRESS, amountToSwap]
    })
    
    const swapHash = await walletClient.writeContract(request)
    console.log(`📝 Swap transaction: ${swapHash}`)
    console.log(`🔍 View on Basescan: https://basescan.org/tx/${swapHash}`)
    
    // Wait for transaction and parse events
    console.log('⏳ Waiting for confirmation...')
    const receipt = await publicClient.waitForTransactionReceipt({ hash: swapHash })
    
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`)
    console.log(`⛽ Gas used: ${receipt.gasUsed}`)
    
    // Parse events
    console.log('\n📋 Transaction events:')
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === RECEIVER_ADDRESS.toLowerCase()) {
          const event = decodeEventLog({
            abi: RECEIVER_ABI,
            data: log.data,
            topics: log.topics
          })
          console.log(`   - ${event.eventName}:`, event.args)
        }
      } catch {
        // Skip non-receiver events
      }
    }
    
    // 5. Check final balances
    console.log('\n📊 Final balances:')
    
    const finalUsdcBalance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    })
    console.log(`💵 USDC balance: ${Number(finalUsdcBalance) / 1e6} USDC`)
    
    const finalDataburnBalance = await publicClient.readContract({
      address: DATABURN_TOKEN,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    })
    console.log(`🔥 DATABURN balance: ${Number(finalDataburnBalance) / 1e18}`)
    
    // Check burn address balance
    const burnBalance = await publicClient.readContract({
      address: DATABURN_TOKEN,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: ['0x000000000000000000000000000000000000dEaD']
    })
    console.log(`🔥 Burned DATABURN: ${Number(burnBalance) / 1e18}`)
    
    // Check final stats
    const finalStats = await publicClient.readContract({
      address: RECEIVER_ADDRESS,
      abi: RECEIVER_ABI,
      functionName: 'getStatistics'
    })
    
    console.log('\n📈 Final contract statistics:')
    console.log(`   Total burned: ${Number(finalStats[0]) / 1e18} DATABURN`)
    console.log(`   Total value received: ${Number(finalStats[1]) / 1e6} USD`)
    
    console.log('\n====================================')
    console.log('✅ Swap test completed!')
    console.log('====================================')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.cause) {
      console.error('   Cause:', error.cause)
    }
    process.exit(1)
  }
}

main().catch(console.error)