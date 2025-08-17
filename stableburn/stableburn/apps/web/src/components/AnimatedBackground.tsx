'use client'

import React, { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
}

export function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = []
      for (let i = 0; i < 15; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          delay: Math.random() * 5,
          duration: Math.random() * 20 + 10,
        })
      }
      setParticles(newParticles)
    }

    generateParticles()
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 hero-gradient opacity-10" />
      
      {/* Animated particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full mix-blend-screen animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: `radial-gradient(circle, rgba(255, 107, 53, 0.8) 0%, rgba(255, 165, 0, 0.4) 50%, transparent 100%)`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle flame glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-flame-500/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-base-blue/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '6s', animationDelay: '2s' }} />
    </div>
  )
}

interface FlameAccentProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size?: 'small' | 'medium' | 'large'
  animate?: boolean
}

export function FlameAccent({ 
  position = 'top-right', 
  size = 'medium',
  animate = true 
}: FlameAccentProps) {
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0'
  }

  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-48 h-48',
    large: 'w-96 h-96'
  }

  return (
    <div 
      className={`
        absolute ${positionClasses[position]} 
        ${sizeClasses[size]}
        pointer-events-none
      `}
    >
      <div 
        className={`
          w-full h-full bg-gradient-to-br from-flame-500/20 via-flame-400/10 to-transparent 
          rounded-full blur-2xl
          ${animate ? 'animate-glow' : ''}
        `}
      />
    </div>
  )
}