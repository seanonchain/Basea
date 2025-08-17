'use client'

import React, { useState, useEffect } from 'react'
import { SignInWithBaseButton } from '@/components/SignInWithBase'
import { ChatInterface } from '@/components/ChatInterface'
import { SpendPermissionSetup } from '@/components/SpendPermissionSetup'
import { AnimatedBackground, FlameAccent } from '@/components/AnimatedBackground'
import { 
  BentoCard, 
  BentoIcon, 
  BentoTitle, 
  BentoDescription, 
  BentoStat 
} from '@/components/BentoCard'
import { HolographicRoadmap } from '@/components/HolographicRoadmap'

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
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="animate-spin rounded-full h-32 w-32 border-4 border-base-blue border-t-flame-500"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-10 glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div>
              <h1 className="text-xl font-bold text-gradient">StableBurn Agent</h1>
              <p className="text-xs text-steel-600">AI-powered creator coin trading on Base</p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/base/demos/tree/master/base-account/agent-spend-permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-steel-600 hover:text-steel-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View Code
              </a>
              {isAuthenticated && (
                <div className="text-sm text-steel-600 bg-white/50 px-3 py-1 rounded-lg">
                  {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {!isAuthenticated ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-4 relative">
              <div className="glass-effect rounded-3xl p-4 lg:p-6 mb-4 relative overflow-hidden">
                <FlameAccent position="top-right" size="medium" />
                <FlameAccent position="bottom-left" size="small" />
                <div className="relative z-10">
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                    <span className="text-gradient">Welcome to StableBurn</span>
                  </h2>
                  <p className="text-sm text-steel-600 mb-4 max-w-2xl mx-auto">
                    Trade creator coins with AI assistance. Secure spend permissions, gas-free transactions, and instant execution.
                  </p>
                  <SignInWithBaseButton onSignIn={handleSignIn} colorScheme="light" />
                </div>
              </div>
            </div>

            {/* Bento Box Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3 animate-slide-up">
              
              {/* Row 1: Core Features */}
              <BentoCard size="large" className="md:col-span-2 lg:col-span-3">
                <div className="flex flex-col lg:flex-row items-start gap-6">
                  <div className="flex-1">
                    <BentoIcon variant="blue" size="large">🤖</BentoIcon>
                    <BentoTitle size="large">AI-Powered Trading</BentoTitle>
                    <BentoDescription>
                      Natural language commands to buy any creator coin. Just tell the agent what you want, and it handles the rest.
                    </BentoDescription>
                    <div className="mt-6 p-4 bg-steel-100 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-base-blue rounded-full flex items-center justify-center text-white text-xs">
                          AI
                        </div>
                        <span className="text-sm text-steel-700 italic">
                          "Buy 10 USDC of jessepollak's creator coin"
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-flame-500 rounded-full flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                        <span className="text-sm text-steel-700">
                          Transaction executed successfully!
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:block w-48 h-48 bg-gradient-to-br from-base-blue/20 to-flame-500/20 rounded-2xl flex items-center justify-center">
                    <div className="text-6xl animate-pulse">💬</div>
                  </div>
                </div>
              </BentoCard>

              <BentoCard size="small">
                <BentoIcon variant="flame">⚡</BentoIcon>
                <BentoTitle>Instant Setup</BentoTitle>
                <BentoDescription>
                  Sign in with Base Account and start trading in seconds
                </BentoDescription>
              </BentoCard>

              {/* Row 2: Process & Security */}
              <BentoCard size="small">
                <BentoIcon variant="steel">🔐</BentoIcon>
                <BentoTitle size="small">Secure Limits</BentoTitle>
                <BentoDescription>
                  Daily spend limits keep your funds safe
                </BentoDescription>
                <div className="mt-4">
                  <BentoStat label="Daily Limit" value="$2.00" />
                </div>
              </BentoCard>

              <BentoCard size="medium" className="md:col-span-2">
                <BentoIcon variant="blue">🚀</BentoIcon>
                <BentoTitle>Smart Routing</BentoTitle>
                <BentoDescription>
                  CDP smart accounts handle transactions with automatic gas sponsorship
                </BentoDescription>
                <div className="mt-4 flex gap-4">
                  <BentoStat label="Gas Saved" value="100%" trend="up" />
                  <BentoStat label="Success Rate" value="99.8%" trend="up" />
                </div>
              </BentoCard>

              <BentoCard size="small">
                <BentoIcon variant="flame">⛽</BentoIcon>
                <BentoTitle size="small">Gas-Free</BentoTitle>
                <BentoDescription>
                  All transactions sponsored - no ETH needed
                </BentoDescription>
              </BentoCard>

              {/* Row 3: Ecosystem & Stats */}
              <BentoCard 
                size="medium" 
                className="md:col-span-2"
                href="https://docs.base.org/base-account/overview/what-is-base-account"
                target="_blank"
                rel="noopener noreferrer"
                enableBurnEffect={false}
              >
                <BentoTitle gradient>How It Works</BentoTitle>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-base-blue/10 rounded-lg flex items-center justify-center">
                      <span className="text-base-blue font-bold text-xs">1</span>
                    </div>
                    <span className="text-sm text-steel-700">Connect your Base Account</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-flame-500/10 rounded-lg flex items-center justify-center">
                      <span className="text-flame-500 font-bold text-xs">2</span>
                    </div>
                    <span className="text-sm text-steel-700">Grant spend permissions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-steel-500/10 rounded-lg flex items-center justify-center">
                      <span className="text-steel-700 font-bold text-xs">3</span>
                    </div>
                    <span className="text-sm text-steel-700">AI executes trades for you</span>
                  </div>
                </div>
              </BentoCard>

              <BentoCard size="small">
                <BentoIcon variant="flame" size="small">📊</BentoIcon>
                <BentoTitle size="small">Live Stats</BentoTitle>
                <div className="mt-2">
                  <BentoStat 
                    label="Transactions" 
                    value={transactionCount.toLocaleString()} 
                    trend="up" 
                  />
                </div>
              </BentoCard>

              <BentoCard 
                size="small"
                href="https://discord.gg/base"
                target="_blank"
                rel="noopener noreferrer"
                enableBurnEffect={false}
              >
                <BentoIcon variant="steel" size="small">💬</BentoIcon>
                <BentoTitle size="small">Community</BentoTitle>
                <BentoDescription>
                  Join our Discord
                </BentoDescription>
              </BentoCard>
            </div>

            {/* Roadmap Section */}
            <div className="mt-4">
              <HolographicRoadmap />
            </div>

            {/* Pixel Burn Demo Section */}
            <div className="mt-3 text-center">
              <p className="text-xs text-steel-500 mb-2 flex items-center justify-center gap-2">
                <span className="text-flame-500 animate-pulse">🔥</span>
                Click any card to see the pixel burn effect
                <span className="text-flame-500 animate-pulse">🔥</span>
              </p>
            </div>

            {/* Additional Info Section */}
            <div className="mt-3 grid md:grid-cols-2 gap-3">
              <BentoCard 
                size="small"
                className="md:col-span-1"
                onClick={() => console.log('Base powered card clicked!')}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-flame-500">🔥</span>
                  <h4 className="font-semibold text-steel-900">Powered by Base</h4>
                </div>
                <p className="text-sm text-steel-600">
                  Built on Base L2 for fast, secure, and affordable transactions. Leverage the full power of Base Account spend permissions.
                </p>
              </BentoCard>
              
              <BentoCard 
                size="small"
                className="md:col-span-1"
                onClick={() => console.log('Zora protocol card clicked!')}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base-blue">🎨</span>
                  <h4 className="font-semibold text-steel-900">Zora Protocol</h4>
                </div>
                <p className="text-sm text-steel-600">
                  Direct integration with Zora's creator coin protocol. Support your favorite creators with seamless token purchases.
                </p>
              </BentoCard>
            </div>
          </>
        ) : !hasSpendPermission ? (
          <div className="text-center">
            <div className="glass-effect rounded-3xl p-8 mb-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-steel-900 mb-4">
                Almost Ready!
              </h2>
              <p className="text-steel-600 mb-8">
                Set up your spending permissions to start using the agent.
              </p>
              <SpendPermissionSetup 
                userAddress={userAddress!} 
                onPermissionGranted={handlePermissionGranted} 
              />
            </div>
          </div>
        ) : (
          <div className="glass-effect rounded-2xl overflow-hidden chat-container">
            <ChatInterface isAuthenticated={isAuthenticated} userAddress={userAddress} />
          </div>
        )}
      </div>
    </main>
  )
}