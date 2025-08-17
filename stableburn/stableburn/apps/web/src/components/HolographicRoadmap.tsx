'use client'

import React, { useState, useRef, useEffect } from 'react'

interface RoadmapNode {
  id: number
  title: string
  description: string
  details: string
  icon: string
}

const roadmapData: RoadmapNode[] = [
  {
    id: 1,
    title: 'Agent NFT Membership',
    description: 'Exclusive club for AI agents',
    details: 'Launch a membership club NFT sale specifically for agents. Access requires sending an x402 payment to purchase your membership NFT, granting exclusive benefits and network access.',
    icon: '🎭'
  },
  {
    id: 2,
    title: 'Custom Subdomains',
    description: 'Register *.agent.base.eth',
    details: 'Offer registration of custom subdomains under agent.base.eth. Agents can claim their unique identity with x402 payments, creating a decentralized namespace for the agent ecosystem.',
    icon: '🌐'
  },
  {
    id: 3,
    title: 'Discovery Enhancement',
    description: 'Curated MCP tools & servers',
    details: 'Provide value-add, opinionated assistance to agents using the x402 Discovery list. Access new Tools and MCP servers with expert curation and recommendations.',
    icon: '🔍'
  },
  {
    id: 4,
    title: 'Sponsored Placements',
    description: 'Premium MCP visibility',
    details: 'Allow sponsored placement of MCP servers for x402 payment. Boost visibility and reach within the agent ecosystem through premium positioning.',
    icon: '📢'
  },
  {
    id: 5,
    title: 'Real-time Ad Auctions',
    description: 'TEE-verified impressions',
    details: 'Create a smart contract for real-time bidding in second-price auctions for agent impressions. TEE server with XMTP provides cryptographic proof of message delivery.',
    icon: '⚡'
  }
]

export function HolographicRoadmap() {
  const [activeNode, setActiveNode] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMousePosition({ x, y })
    }

    const card = cardRef.current
    if (card) {
      card.addEventListener('mousemove', handleMouseMove)
      return () => card.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const handleNodeClick = (nodeId: number) => {
    setActiveNode(activeNode === nodeId ? null : nodeId)
  }

  return (
    <div 
      ref={cardRef}
      className="holographic-card rounded-3xl p-8 lg:p-12 relative overflow-hidden"
      style={{
        '--mouse-x': `${mousePosition.x}%`,
        '--mouse-y': `${mousePosition.y}%`
      } as React.CSSProperties}
    >
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255, 255, 255, 0.05) 10px,
              rgba(255, 255, 255, 0.05) 20px
            )
          `
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="holographic-text">2025 Roadmap</span>
          </h2>
          <p className="text-white/90 text-lg">
            Building the future of agent infrastructure
          </p>
        </div>

        {/* Roadmap visualization */}
        <div className="relative">
          {/* Connector lines */}
          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
            <div className="roadmap-connector w-full" />
          </div>

          {/* Nodes */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 relative">
            {roadmapData.map((node, index) => (
              <div key={node.id} className={`relative ${node.id === 5 ? 'col-span-2 md:col-span-1' : ''}`}>
                <div 
                  className={`roadmap-node ${activeNode === node.id ? 'roadmap-node-active' : ''}`}
                  onClick={() => handleNodeClick(node.id)}
                >
                  {/* Node circle */}
                  <div className="roadmap-node-circle mx-auto">
                    <span className="text-2xl">{node.icon}</span>
                  </div>
                  
                  {/* Node title */}
                  <div className="mt-4 text-center">
                    <h3 className="text-white font-semibold text-sm lg:text-base">
                      {node.title}
                    </h3>
                    <p className="text-white/70 text-xs mt-1 hidden lg:block">
                      {node.description}
                    </p>
                  </div>

                  {/* Phase indicator */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <span className="text-white/50 text-xs font-bold">
                      PHASE {node.id}
                    </span>
                  </div>
                </div>

                {/* Detail popup */}
                {activeNode === node.id && (
                  <div 
                    className="roadmap-detail fixed md:absolute left-4 right-4 md:left-auto md:right-auto bottom-4 md:bottom-auto"
                    style={{
                      top: window.innerWidth >= 768 ? '100%' : 'auto',
                      left: window.innerWidth >= 768 ? '50%' : undefined,
                      transform: window.innerWidth >= 768 ? 'translateX(-50%)' : undefined,
                      marginTop: window.innerWidth >= 768 ? '1rem' : undefined,
                      zIndex: 50,
                      maxWidth: window.innerWidth >= 768 ? '320px' : undefined
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{node.icon}</span>
                      <div>
                        <h4 className="font-bold text-steel-900 mb-2">
                          {node.title}
                        </h4>
                        <p className="text-steel-600 text-sm">
                          {node.details}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="inline-block px-2 py-1 bg-flame-500/10 text-flame-600 text-xs rounded-full font-semibold">
                            x402 Payment Required
                          </span>
                          <span className="inline-block px-2 py-1 bg-base-blue/10 text-base-blue text-xs rounded-full font-semibold">
                            Phase {node.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress indicator */}
          <div className="mt-12 flex items-center justify-center gap-2">
            <span className="text-white/70 text-sm">Progress</span>
            <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-base-blue to-flame-500 rounded-full transition-all duration-1000"
                style={{ width: '20%' }}
              />
            </div>
            <span className="text-white/70 text-sm">Phase 1</span>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-12 text-center">
          <p className="text-white/80 mb-4">
            Ready to join the future of agent infrastructure?
          </p>
          <button className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30">
            Learn More About x402 Payments
          </button>
        </div>
      </div>
    </div>
  )
}