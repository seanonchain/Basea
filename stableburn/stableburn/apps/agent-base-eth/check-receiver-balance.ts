#!/usr/bin/env bun

/**
 * Check USDC balance of the receiver contract
 */

import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

// USDC contract on Base mainnet
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
const USDC_DECIMALS = 6

// Deployed contract address
const RECEIVER_ADDRESS = '0x76a6ed9dece032d227b713010022c5e43a307d8a'

// ERC20 ABI (only balanceOf needed)
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

async function main() {
  console.log('====================================')
  console.log('💰 Checking Receiver Contract Balance')
  console.log('====================================')
  console.log(`📝 Contract address: ${RECEIVER_ADDRESS}`)
  
  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org')
  })

  try {
    // Check USDC balance
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [RECEIVER_ADDRESS as `0x${string}`]
    })

    const balanceInUsdc = Number(balance) / (10 ** USDC_DECIMALS)
    console.log(`💵 USDC balance: ${balanceInUsdc} USDC`)
    
    // Check ETH balance (for gas if needed)
    const ethBalance = await publicClient.getBalance({ 
      address: RECEIVER_ADDRESS as `0x${string}` 
    })
    const ethBalanceInEth = Number(ethBalance) / (10 ** 18)
    console.log(`⛽ ETH balance: ${ethBalanceInEth.toFixed(6)} ETH`)
    
    console.log('\n🔍 View on Basescan:')
    console.log(`   https://basescan.org/address/${RECEIVER_ADDRESS}`)
    console.log(`   https://basescan.org/token/${USDC_ADDRESS}?a=${RECEIVER_ADDRESS}`)
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)