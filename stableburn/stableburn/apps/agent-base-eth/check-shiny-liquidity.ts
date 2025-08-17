#!/usr/bin/env bun

/**
 * Check SHINY token liquidity and find the right swap path
 */

import { createPublicClient, http, parseAbi } from 'viem'
import { base } from 'viem/chains'

// Token addresses
const SHINY_TOKEN = '0xd47be5ca7c38b4beb6ffcb9b7da848de71ec8edb' as const
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006' as const

// Possible DEX routers on Base
const ROUTERS = {
  'Uniswap V4 Universal': '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
  'Uniswap V3': '0x2626664c2603336E57B271c5C0b26F421741e481',
  'BaseSwap': '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86',
  'Aerodrome': '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
  'SushiSwap': '0x6BDED42c6DA8FBf0d2bA55B2fa120C5e0c8D7891'
}

// Flaunch Factory (for finding pool)
const FLAUNCH_FACTORY = '0xEd1db453C3156Ff3155a97AD217b3087D5Dc5f6E' as const

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
])

// Uniswap V2 Factory ABI
const FACTORY_ABI = parseAbi([
  'function getPair(address tokenA, address tokenB) view returns (address)',
  'function allPairs(uint256) view returns (address)',
  'function allPairsLength() view returns (uint256)'
])

// Uniswap V2 Pair ABI
const PAIR_ABI = parseAbi([
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)'
])

async function main() {
  console.log('====================================')
  console.log('🔍 Checking SHINY Token Liquidity')
  console.log('====================================')
  
  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://base.llamarpc.com')
  })

  try {
    // 1. Get SHINY token info
    console.log('\n📊 SHINY Token Info:')
    console.log(`   Address: ${SHINY_TOKEN}`)
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: SHINY_TOKEN,
        abi: ERC20_ABI,
        functionName: 'name'
      }),
      publicClient.readContract({
        address: SHINY_TOKEN,
        abi: ERC20_ABI,
        functionName: 'symbol'
      }),
      publicClient.readContract({
        address: SHINY_TOKEN,
        abi: ERC20_ABI,
        functionName: 'decimals'
      }),
      publicClient.readContract({
        address: SHINY_TOKEN,
        abi: ERC20_ABI,
        functionName: 'totalSupply'
      })
    ])
    
    console.log(`   Name: ${name}`)
    console.log(`   Symbol: ${symbol}`)
    console.log(`   Decimals: ${decimals}`)
    console.log(`   Total Supply: ${Number(totalSupply) / (10 ** Number(decimals))}`)
    
    // 2. Check for Flaunch pool
    console.log('\n🏊 Checking Flaunch Pools:')
    console.log(`   Flaunch Factory: ${FLAUNCH_FACTORY}`)
    
    try {
      // Check SHINY-WETH pair
      const shinyWethPair = await publicClient.readContract({
        address: FLAUNCH_FACTORY,
        abi: FACTORY_ABI,
        functionName: 'getPair',
        args: [SHINY_TOKEN, WETH_ADDRESS]
      })
      
      if (shinyWethPair !== '0x0000000000000000000000000000000000000000') {
        console.log(`   ✅ SHINY-WETH Pool: ${shinyWethPair}`)
        
        // Get reserves
        const reserves = await publicClient.readContract({
          address: shinyWethPair,
          abi: PAIR_ABI,
          functionName: 'getReserves'
        })
        
        const token0 = await publicClient.readContract({
          address: shinyWethPair,
          abi: PAIR_ABI,
          functionName: 'token0'
        })
        
        const isToken0Shiny = token0.toLowerCase() === SHINY_TOKEN.toLowerCase()
        const shinyReserve = isToken0Shiny ? reserves[0] : reserves[1]
        const wethReserve = isToken0Shiny ? reserves[1] : reserves[0]
        
        console.log(`   SHINY reserves: ${Number(shinyReserve) / (10 ** Number(decimals))}`)
        console.log(`   WETH reserves: ${Number(wethReserve) / 1e18} ETH`)
      } else {
        console.log(`   ❌ No SHINY-WETH pool found on Flaunch`)
      }
      
      // Check USDC-WETH pair (for first hop)
      const usdcWethPair = await publicClient.readContract({
        address: FLAUNCH_FACTORY,
        abi: FACTORY_ABI,
        functionName: 'getPair',
        args: [USDC_ADDRESS, WETH_ADDRESS]
      })
      
      if (usdcWethPair !== '0x0000000000000000000000000000000000000000') {
        console.log(`   ✅ USDC-WETH Pool: ${usdcWethPair}`)
      } else {
        console.log(`   ❌ No USDC-WETH pool found on Flaunch`)
      }
      
    } catch (error) {
      console.log(`   ⚠️  Could not check Flaunch pools:`, error)
    }
    
    // 3. Check BaseSwap Factory
    console.log('\n🏊 Checking BaseSwap Pools:')
    const BASESWAP_FACTORY = '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB' as const
    
    try {
      const shinyWethPair = await publicClient.readContract({
        address: BASESWAP_FACTORY,
        abi: FACTORY_ABI,
        functionName: 'getPair',
        args: [SHINY_TOKEN, WETH_ADDRESS]
      })
      
      if (shinyWethPair !== '0x0000000000000000000000000000000000000000') {
        console.log(`   ✅ SHINY-WETH Pool: ${shinyWethPair}`)
      } else {
        console.log(`   ❌ No SHINY-WETH pool found on BaseSwap`)
      }
    } catch (error) {
      console.log(`   ⚠️  Could not check BaseSwap pools`)
    }
    
    // 4. Check Aerodrome
    console.log('\n🏊 Checking Aerodrome Pools:')
    console.log('   Note: Aerodrome uses different pool structure')
    
    // 5. Summary
    console.log('\n📋 Summary:')
    console.log('   The SHINY token needs liquidity pools to enable swapping')
    console.log('   Required path: USDC -> WETH -> SHINY')
    console.log('   ')
    console.log('   🎯 Next Steps:')
    console.log('   1. Check if SHINY has liquidity on any DEX')
    console.log('   2. If using Flaunch/Uniswap V4, need different router')
    console.log('   3. May need to add liquidity to SHINY-WETH pool first')
    console.log('   4. Update DataBurnReceiver contract with correct router')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)