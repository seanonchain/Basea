#!/usr/bin/env bun

/**
 * Test script to send 0.01 USDC on Base mainnet to the deployed contract
 */

import { createWalletClient, createPublicClient, http, parseUnits, encodeFunctionData } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config()

// USDC contract on Base mainnet
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
const USDC_DECIMALS = 6

// Deployed contract address (from .env)
const RECEIVER_ADDRESS = process.env.X402_RECEIVER_ADDRESS || '0x76a6ed9dece032d227b713010022c5e43a307d8a'

// ERC20 ABI (only transfer function needed)
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const

async function main() {
  console.log('====================================')
  console.log('🚀 USDC Transfer Test on Base Mainnet')
  console.log('====================================')
  
  // Check for private key
  const privateKey = process.env.WALLET_KEY || process.env.DEPLOYER_PRIVATE_KEY
  if (!privateKey) {
    console.error('❌ No private key found. Set WALLET_KEY or DEPLOYER_PRIVATE_KEY in .env')
    process.exit(1)
  }

  // Create account from private key
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  console.log(`📝 Sender address: ${account.address}`)
  console.log(`📝 Receiver address: ${RECEIVER_ADDRESS}`)
  console.log(`💰 Amount: 0.01 USDC`)

  // Create clients
  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org')
  })

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http('https://mainnet.base.org')
  })

  try {
    // Check USDC balance
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    })

    const balanceInUsdc = Number(balance) / (10 ** USDC_DECIMALS)
    console.log(`💵 Current USDC balance: ${balanceInUsdc} USDC`)

    if (balanceInUsdc < 0.01) {
      console.error(`❌ Insufficient USDC balance. Need at least 0.01 USDC`)
      console.log(`   You can get USDC on Base at: https://app.uniswap.org/`)
      process.exit(1)
    }

    // Check ETH balance for gas
    const ethBalance = await publicClient.getBalance({ address: account.address })
    const ethBalanceInEth = Number(ethBalance) / (10 ** 18)
    console.log(`⛽ ETH balance for gas: ${ethBalanceInEth.toFixed(6)} ETH`)

    if (ethBalanceInEth < 0.0001) {
      console.error(`❌ Insufficient ETH for gas. Need at least 0.0001 ETH`)
      console.log(`   You can bridge ETH to Base at: https://bridge.base.org/`)
      process.exit(1)
    }

    // Prepare transfer
    const amountToSend = parseUnits('0.01', USDC_DECIMALS)
    console.log(`\n📤 Sending ${0.01} USDC to ${RECEIVER_ADDRESS}...`)

    // Simulate the transaction first
    const { request } = await publicClient.simulateContract({
      account,
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [RECEIVER_ADDRESS as `0x${string}`, amountToSend]
    })

    console.log('✅ Transaction simulation successful')

    // Send the transaction
    const hash = await walletClient.writeContract(request)
    console.log(`📝 Transaction hash: ${hash}`)
    console.log(`🔍 View on Basescan: https://basescan.org/tx/${hash}`)

    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...')
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'success') {
      console.log('✅ Transaction confirmed!')
      console.log(`   Block number: ${receipt.blockNumber}`)
      console.log(`   Gas used: ${receipt.gasUsed}`)
      
      // Check new balance
      const newBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [account.address]
      })
      
      const newBalanceInUsdc = Number(newBalance) / (10 ** USDC_DECIMALS)
      console.log(`💵 New USDC balance: ${newBalanceInUsdc} USDC`)
      
      console.log('\n====================================')
      console.log('✅ USDC sent successfully!')
      console.log('====================================')
    } else {
      console.error('❌ Transaction failed')
      process.exit(1)
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.cause) {
      console.error('   Cause:', error.cause)
    }
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)