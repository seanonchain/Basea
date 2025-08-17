#!/usr/bin/env bun

/**
 * Test the two-part swap: USDC -> ETH -> SHINY
 * This tests the ShinyBurnReceiver's swap functionality
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
const SHINY_TOKEN = '0xd47bE5Ca7C38B4Beb6ffCb9B7Da848DE71Ec8eDB' as const
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as const

// Deployed receiver contract (update after deployment)
const RECEIVER_ADDRESS = '0x76a6ed9dece032d227b713010022c5e43a307d8a' as const

// Router options for ETH -> SHINY
const ROUTERS = {
  'BaseSwap': '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86',
  'Aerodrome': '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
  'SushiSwap': '0x6BDED42c6DA8FBf0d2bA55B2fa120C5e0c8D7891',
  'Flaunch/UniV4': '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24'
}

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
  'function initialize(address _ethToShinyRouter)',
  'function receiveToken(address token, uint256 amount)',
  'function receivePayment(uint256 amount, bytes32 paymentId)',
  'function getStatistics() view returns (uint256 totalBurnedAmount, uint256 totalValueReceivedAmount, address ethToShinyRouterAddress, bool isPaused)',
  'function updateEthToShinyRouter(address _ethToShinyRouter)',
  'event PaymentReceived(address indexed from, address indexed token, uint256 amount, bytes32 paymentId)',
  'event TokensSwapped(address indexed tokenIn, uint256 amountIn, uint256 ethReceived, uint256 shinyOut)',
  'event TokensBurned(uint256 amount, uint256 totalBurnedToDate)'
])

// Factory ABI to check for liquidity pools
const FACTORY_ABI = parseAbi([
  'function getPair(address tokenA, address tokenB) view returns (address)',
])

async function checkLiquidity(publicClient: any, factoryAddress: string, token0: string, token1: string): Promise<string | null> {
  try {
    const pair = await publicClient.readContract({
      address: factoryAddress,
      abi: FACTORY_ABI,
      functionName: 'getPair',
      args: [token0, token1]
    })
    
    if (pair !== '0x0000000000000000000000000000000000000000') {
      return pair as string
    }
  } catch (error) {
    console.log(`   Could not check factory at ${factoryAddress}`)
  }
  return null
}

async function main() {
  console.log('====================================')
  console.log('🔄 Testing USDC -> ETH -> SHINY Swap')
  console.log('====================================')
  
  const privateKey = process.env.WALLET_KEY || process.env.DEPLOYER_PRIVATE_KEY
  if (!privateKey) {
    console.error('❌ No private key found')
    process.exit(1)
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`)
  console.log(`📝 Wallet address: ${account.address}`)
  console.log(`📝 Receiver contract: ${RECEIVER_ADDRESS}`)
  console.log(`📝 SHINY token: ${SHINY_TOKEN}`)

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

    const shinyBalance = await publicClient.readContract({
      address: SHINY_TOKEN,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    })
    console.log(`✨ SHINY balance: ${Number(shinyBalance) / 1e18}`)

    const ethBalance = await publicClient.getBalance({ address: account.address })
    console.log(`⛽ ETH balance: ${Number(ethBalance) / 1e18} ETH`)

    // 2. Check for SHINY liquidity pools
    console.log('\n🏊 Checking for SHINY-WETH liquidity pools...')
    
    // Check BaseSwap
    const baseSwapFactory = '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB'
    const baseSwapPair = await checkLiquidity(publicClient, baseSwapFactory, SHINY_TOKEN, WETH_ADDRESS)
    if (baseSwapPair) {
      console.log(`   ✅ BaseSwap has SHINY-WETH pool at: ${baseSwapPair}`)
    } else {
      console.log(`   ❌ No SHINY-WETH pool on BaseSwap`)
    }
    
    // Check Flaunch Factory
    const flaunchFactory = '0xEd1db453C3156Ff3155a97AD217b3087D5Dc5f6E'
    const flaunchPair = await checkLiquidity(publicClient, flaunchFactory, SHINY_TOKEN, WETH_ADDRESS)
    if (flaunchPair) {
      console.log(`   ✅ Flaunch has SHINY-WETH pool at: ${flaunchPair}`)
    } else {
      console.log(`   ❌ No SHINY-WETH pool on Flaunch`)
    }

    // 3. Check receiver contract initialization
    console.log('\n🔍 Checking receiver contract...')
    
    const stats = await publicClient.readContract({
      address: RECEIVER_ADDRESS,
      abi: RECEIVER_ABI,
      functionName: 'getStatistics'
    })
    
    console.log(`   Total burned: ${Number(stats[0]) / 1e18} SHINY`)
    console.log(`   Total value received: ${Number(stats[1]) / 1e6} USD`)
    console.log(`   ETH->SHINY router: ${stats[2]}`)
    console.log(`   Is paused: ${stats[3]}`)

    // Determine which router to use
    let selectedRouter = ROUTERS.BaseSwap // Default to BaseSwap
    if (baseSwapPair) {
      selectedRouter = ROUTERS.BaseSwap
      console.log('\n✅ Using BaseSwap router for ETH->SHINY swap')
    } else if (flaunchPair) {
      // Would need to use Flaunch's PoolSwap contract
      console.log('\n⚠️  Flaunch pool exists but requires special V4 handling')
      console.log('   For now, trying BaseSwap router...')
    } else {
      console.log('\n⚠️  No liquidity found! Swap will likely fail')
      console.log('   Continuing with BaseSwap router anyway...')
    }

    // Initialize or update router if needed
    if (stats[2] === '0x0000000000000000000000000000000000000000') {
      console.log('\n⚠️  Receiver contract not initialized. Initializing with router...')
      
      const { request } = await publicClient.simulateContract({
        account,
        address: RECEIVER_ADDRESS,
        abi: RECEIVER_ABI,
        functionName: 'initialize',
        args: [selectedRouter]
      })
      
      const initHash = await walletClient.writeContract(request)
      console.log(`📝 Initialization tx: ${initHash}`)
      
      const initReceipt = await publicClient.waitForTransactionReceipt({ hash: initHash })
      console.log(`✅ Contract initialized in block ${initReceipt.blockNumber}`)
    } else if (stats[2] !== selectedRouter) {
      console.log(`\n🔄 Updating router from ${stats[2]} to ${selectedRouter}`)
      
      const { request } = await publicClient.simulateContract({
        account,
        address: RECEIVER_ADDRESS,
        abi: RECEIVER_ABI,
        functionName: 'updateEthToShinyRouter',
        args: [selectedRouter]
      })
      
      const updateHash = await walletClient.writeContract(request)
      console.log(`📝 Update tx: ${updateHash}`)
      
      const updateReceipt = await publicClient.waitForTransactionReceipt({ hash: updateHash })
      console.log(`✅ Router updated in block ${updateReceipt.blockNumber}`)
    }

    // 4. Send USDC to receiver contract
    const amountToSwap = parseUnits('0.01', 6) // 0.01 USDC
    console.log(`\n📤 Sending 0.01 USDC to receiver contract for swap...`)
    
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
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Call receiveToken to trigger the swap
    console.log(`\n🔄 Triggering swap through receiveToken...`)
    console.log(`   Router: ${selectedRouter}`)
    console.log(`   Path: USDC -> ETH (via UniV3) -> SHINY (via ${baseSwapPair ? 'BaseSwap' : 'router'})`)
    
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
    console.log(`   Status: ${receipt.status === 'success' ? '✅ Success' : '❌ Failed'}`)
    
    // Parse events
    if (receipt.status === 'success') {
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
    
    const finalShinyBalance = await publicClient.readContract({
      address: SHINY_TOKEN,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    })
    console.log(`✨ SHINY balance: ${Number(finalShinyBalance) / 1e18}`)
    
    // Check burn address balance
    const burnBalance = await publicClient.readContract({
      address: SHINY_TOKEN,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: ['0x000000000000000000000000000000000000dEaD']
    })
    console.log(`🔥 Burned SHINY: ${Number(burnBalance) / 1e18}`)
    
    // Check final stats
    const finalStats = await publicClient.readContract({
      address: RECEIVER_ADDRESS,
      abi: RECEIVER_ABI,
      functionName: 'getStatistics'
    })
    
    console.log('\n📈 Final contract statistics:')
    console.log(`   Total burned: ${Number(finalStats[0]) / 1e18} SHINY`)
    console.log(`   Total value received: ${Number(finalStats[1]) / 1e6} USD`)
    
    console.log('\n====================================')
    if (receipt.status === 'success') {
      console.log('✅ Swap test completed successfully!')
    } else {
      console.log('❌ Swap test failed - check logs above')
    }
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