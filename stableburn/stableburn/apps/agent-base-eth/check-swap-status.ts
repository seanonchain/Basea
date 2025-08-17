#!/usr/bin/env bun

/**
 * Check the status of the swap contract and balances
 */

import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

// Contract addresses
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
const DATABURN_TOKEN = '0xd47be5ca7c38b4beb6ffcb9b7da848de71ec8edb' as const
const RECEIVER_ADDRESS = '0x76a6ed9dece032d227b713010022c5e43a307d8a' as const
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD' as const

// The DEX router shown in contract
const DEX_ROUTER = '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24' as const

// WETH on Base
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as const

// ERC20 ABI
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  }
] as const

async function main() {
  console.log('====================================')
  console.log('🔍 Checking Swap Contract Status')
  console.log('====================================')
  
  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://base.llamarpc.com')
  })

  try {
    console.log('\n📊 Receiver Contract Balances:')
    console.log(`   Address: ${RECEIVER_ADDRESS}`)
    
    // Check USDC balance
    const usdcBalance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [RECEIVER_ADDRESS]
    })
    console.log(`   💵 USDC: ${Number(usdcBalance) / 1e6} USDC`)
    
    // Check DATABURN balance
    const databurnBalance = await publicClient.readContract({
      address: DATABURN_TOKEN,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [RECEIVER_ADDRESS]
    })
    console.log(`   🔥 DATABURN: ${Number(databurnBalance) / 1e18}`)
    
    // Check ETH balance
    const ethBalance = await publicClient.getBalance({ address: RECEIVER_ADDRESS })
    console.log(`   ⛽ ETH: ${Number(ethBalance) / 1e18}`)
    
    console.log('\n🔥 Dead Address Balances:')
    console.log(`   Address: ${DEAD_ADDRESS}`)
    
    // Check DATABURN in dead address
    const deadDataburnBalance = await publicClient.readContract({
      address: DATABURN_TOKEN,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [DEAD_ADDRESS]
    })
    console.log(`   🔥 DATABURN burned: ${Number(deadDataburnBalance) / 1e18}`)
    
    console.log('\n🏦 DEX Router Info:')
    console.log(`   Router: ${DEX_ROUTER}`)
    console.log(`   Type: This appears to be Uniswap V4 or a custom router`)
    
    // Check if there's liquidity by looking at WETH balance
    const wethBalance = await publicClient.readContract({
      address: WETH_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [DEX_ROUTER]
    })
    console.log(`   WETH in router: ${Number(wethBalance) / 1e18}`)
    
    console.log('\n❓ Possible Issues:')
    if (Number(usdcBalance) > 0) {
      console.log('   ⚠️  Receiver contract is holding USDC - swap may have failed')
      console.log('   Possible reasons:')
      console.log('   1. No liquidity in USDC -> WETH pool')
      console.log('   2. No liquidity in WETH -> DATABURN pool')
      console.log('   3. Router address might be incorrect')
      console.log('   4. Slippage tolerance too low')
    }
    
    console.log('\n📈 Recommendations:')
    console.log('   1. Check if DATABURN has liquidity on the configured DEX')
    console.log('   2. Verify the router address is correct for the DEX')
    console.log('   3. Consider using Aerodrome (0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43)')
    console.log('   4. Or BaseSwap (0x327Df1E6de05895d2ab08513aaDD9313Fe505d86)')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)