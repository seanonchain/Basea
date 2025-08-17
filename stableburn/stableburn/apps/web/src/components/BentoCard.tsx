'use client'

import React, { useState, useRef, useEffect } from 'react'

interface BentoCardProps {
  size?: 'small' | 'medium' | 'large' | 'full'
  children: React.ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
  enableBurnEffect?: boolean
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
}

export function BentoCard({ 
  size = 'medium', 
  children, 
  className = '',
  hover = true,
  gradient = true,
  onClick,
  href,
  target,
  rel,
  enableBurnEffect = true
}: BentoCardProps) {
  const [isBurning, setIsBurning] = useState(false)
  const [isReforming, setIsReforming] = useState(false)
  const [isBurned, setIsBurned] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const cardRef = useRef<HTMLDivElement>(null)

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-2',
    large: 'col-span-3',
    full: 'col-span-4'
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (!enableBurnEffect || href) {
      if (onClick) onClick()
      return
    }

    e.preventDefault()
    
    // Generate particles at click position
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const newParticles: Particle[] = []
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20
        const velocity = 2 + Math.random() * 3
        newParticles.push({
          id: Date.now() + i,
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity
        })
      }
      setParticles(newParticles)
    }

    // Start burn animation
    setIsBurning(true)
    
    // After burn, start reform
    setTimeout(() => {
      setIsBurning(false)
      setIsReforming(true)
      setParticles([])
    }, 800)
    
    // After reform, set burned state
    setTimeout(() => {
      setIsReforming(false)
      setIsBurned(true)
      if (onClick) onClick()
    }, 1400)
  }

  // Clear particles after animation
  useEffect(() => {
    if (particles.length > 0) {
      const timer = setTimeout(() => setParticles([]), 1000)
      return () => clearTimeout(timer)
    }
  }, [particles])

  const baseClasses = `
    pixel-burn-container bento-card p-6 lg:p-8
    ${hover && !isBurning && !isReforming ? 'flame-border cursor-pointer' : ''}
    ${sizeClasses[size]}
    ${isBurning ? 'pixel-burn-active' : ''}
    ${isReforming ? 'pixel-reform-active' : ''}
    ${isBurned ? 'bento-card-burned' : ''}
    ${className}
  `

  const content = (
    <>
      {gradient && !isBurned && <div className="bento-card-gradient" />}
      <div className="relative z-10">
        {children}
      </div>
      {/* Pixel particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="pixel-particle pixel-float"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            '--x': `${particle.vx * 50}px`,
            '--y': `${particle.vy * 50}px`,
          } as React.CSSProperties}
        />
      ))}
    </>
  )

  if (href && !enableBurnEffect) {
    return (
      <a 
        href={href}
        target={target}
        rel={rel}
        className={baseClasses}
        onClick={onClick}
      >
        {content}
      </a>
    )
  }

  return (
    <div 
      ref={cardRef}
      className={baseClasses}
      onClick={handleCardClick}
    >
      {content}
    </div>
  )
}

interface BentoIconProps {
  children: React.ReactNode
  variant?: 'blue' | 'flame' | 'steel'
  size?: 'small' | 'medium' | 'large'
}

export function BentoIcon({ 
  children, 
  variant = 'blue',
  size = 'medium' 
}: BentoIconProps) {
  const variantClasses = {
    blue: 'bg-base-blue text-white',
    flame: 'bg-gradient-to-br from-flame-500 to-flame-400 text-white',
    steel: 'bg-steel-700 text-steel-100'
  }

  const sizeClasses = {
    small: 'w-10 h-10 text-lg',
    medium: 'w-12 h-12 text-xl',
    large: 'w-16 h-16 text-2xl'
  }

  return (
    <div className={`
      ${variantClasses[variant]} 
      ${sizeClasses[size]}
      rounded-xl flex items-center justify-center font-bold mb-4
      transition-transform duration-300 hover:scale-110
    `}>
      {children}
    </div>
  )
}

interface BentoTitleProps {
  children: React.ReactNode
  gradient?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function BentoTitle({ 
  children, 
  gradient = false,
  size = 'medium' 
}: BentoTitleProps) {
  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-xl lg:text-2xl',
    large: 'text-2xl lg:text-3xl'
  }

  return (
    <h3 className={`
      font-bold mb-2 
      ${gradient ? 'text-gradient' : 'text-steel-900'}
      ${sizeClasses[size]}
    `}>
      {children}
    </h3>
  )
}

interface BentoDescriptionProps {
  children: React.ReactNode
}

export function BentoDescription({ children }: BentoDescriptionProps) {
  return (
    <p className="text-steel-600 text-sm lg:text-base">
      {children}
    </p>
  )
}

interface BentoStatProps {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
}

export function BentoStat({ label, value, trend }: BentoStatProps) {
  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→'
  }

  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-steel-500'
  }

  return (
    <div className="flex flex-col">
      <span className="text-steel-500 text-xs uppercase tracking-wide mb-1">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-steel-900">
          {value}
        </span>
        {trend && (
          <span className={`text-sm ${trendColors[trend]}`}>
            {trendIcons[trend]}
          </span>
        )}
      </div>
    </div>
  )
}