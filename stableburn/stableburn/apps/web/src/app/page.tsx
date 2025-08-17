'use client'

import React, { useState, useEffect } from 'react'
import { SignInWithBaseButton } from '@/components/SignInWithBase'
import { ChatInterface } from '@/components/ChatInterface'
import { SpendPermissionSetup } from '@/components/SpendPermissionSetup'
import { 
  BentoCard, 
  BentoIcon, 
  BentoTitle, 
  BentoDescription, 
  BentoStat 
} from '@/components/BentoCard'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userAddress, setUserAddress] = useState<string>()
  const [hasSpendPermission, setHasSpendPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [transactionCount, setTransactionCount] = useState(1247)

  useEffect(() => {
    checkAuthStatus()
    
    // Simulate live transaction counter
    const interval = setInterval(() => {
      setTransactionCount(prev => prev + Math.floor(Math.random() * 3))
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const checkAuthStatus = async () => {
    try {
      setIsLoading(false)
    } catch (error) {
      console.error('Auth check error:', error)
      setIsLoading(false)
    }
  }

  const handleSignIn = async (address: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setIsAuthenticated(true)
        setUserAddress(address)
      } else {
        console.error('Authentication failed:', data.error)
      }
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermissionGranted = () => {
    setHasSpendPermission(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 relative">
      {/* Background Video */}
      <div className="fixed inset-0 z-0">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/socialdataburn.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      <div className="relative z-10">
      {/* Header Cards */}
      <div className="absolute top-4 right-4 z-50">
        <a
          href="https://github.com/seanonchain/stableburn"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/10 backdrop-blur-md rounded-xl p-3 shadow-xl border border-white/20 flex items-center gap-2 text-white hover:bg-white/20 transition-all"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span className="text-sm font-medium">View Code</span>
        </a>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          <>
            {/* Hero Section - Side by Side Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
              {/* Title Card - Smaller */}
              <div className="lg:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 flex items-center justify-center">
                <h1 className="text-xl lg:text-2xl font-bold text-white text-center">
                  Stableburn x402 Agent
                </h1>
              </div>
              
              {/* Main Hero Message - Wider */}
              <div className="lg:col-span-3 bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20 flex items-center justify-center">
                <h2 className="text-2xl lg:text-3xl font-bold text-white text-center">
                  Message agentprotocol.eth on the Base app for the MCP Bazaar, and simply pay USDC for Opensea data
                </h2>
              </div>
            </div>

            {/* $DATABURN Token Information */}
            <div className="mb-12">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">
                      $DATABURN Token
                    </h2>
                    <a 
                      href="https://flaunch.gg"
                      className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      BUY
                    </a>
                  </div>
                  <p className="text-white/90 text-lg">
                    All x402 USDC income is converted to $DATABURN and burned
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Automated Buybacks */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <span className="text-4xl">🛡️</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Automated Buybacks</h3>
                        <span className="text-white/70 text-sm">Buyback mechanism</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-white/80 text-sm">
                      <p>
                        Buybacks are released every time a coin collects 0.1 ETH in trading fees. During this time the buyback is shown as "charging".
                      </p>
                      <p>
                        When the buyback starts it becomes "active" and the bar will drain until the buyback is complete.
                      </p>
                      <p>
                        Buybacks can stack on top of each other. Large buy demand will lead to buybacks far greater than 0.1 ETH!
                      </p>
                    </div>
                  </div>
                  
                  {/* Fixed Price Fair Launch */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                        <span className="text-4xl">🚀</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Fixed Price Fair Launch</h3>
                        <span className="text-white/70 text-sm">Fair launch mechanism</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-white/80 text-sm">
                      <p>
                        When a coin is flaunched it goes into a 30 minute period where the price is fixed for everyone.
                      </p>
                      <p>
                        Once the 30 minute period is over, or all the fair launch coins are sold, the coin moves into price discovery.
                      </p>
                      <p>
                        Every user that buys during a Fair Launch can sell at the same price once the Fair Launch ends.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Roadmap Section */}
            <div className="mb-12">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20">
                <div className="text-center mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-white">
                    Roadmap
                  </h2>
                  <p className="text-white/80 text-lg">
                    More Uses for $DATABURN
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
                      🎭
                    </div>
                    <h3 className="font-semibold text-white mb-2">Burners Club</h3>
                    <p className="text-sm text-white/70">Membership Pass</p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">August</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
                      🌐
                    </div>
                    <h3 className="font-semibold text-white mb-2">Custom, Clean Basenames</h3>
                    <p className="text-sm text-white/70">yourname.agent.base.eth</p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full">September</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
                      🔍
                    </div>
                    <h3 className="font-semibold text-white mb-2">Discovery Enhancement</h3>
                    <p className="text-sm text-white/70">Curated MCP tools & servers</p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">September</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
                      📢
                    </div>
                    <h3 className="font-semibold text-white mb-2">Sponsored Placements</h3>
                    <p className="text-sm text-white/70">Premium MCP visibility</p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">October</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
                      ⚡
                    </div>
                    <h3 className="font-semibold text-white mb-2">Real-time Ad Auctions</h3>
                    <p className="text-sm text-white/70">TEE-verified impressions</p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">Q4</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a 
                      href="https://docs.cdp.coinbase.com/x402/welcome"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Learn More About x402 Payments
                    </a>
                    <a 
                      href="https://x.com/blue_onchain"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Follow on X
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </>
        ) : !hasSpendPermission ? (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 max-w-2xl mx-auto shadow-xl border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">
                Almost Ready!
              </h2>
              <p className="text-white/80 mb-8">
                Set up your spending permissions to start using the agent.
              </p>
              <SpendPermissionSetup 
                userAddress={userAddress!} 
                onPermissionGranted={handlePermissionGranted} 
              />
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border border-white/20">
            <ChatInterface isAuthenticated={isAuthenticated} userAddress={userAddress} />
          </div>
        )}
      </div>
      </div>
    </main>
  )
}