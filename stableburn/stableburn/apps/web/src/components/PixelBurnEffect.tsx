'use client'

import React, { useEffect, useState, useRef } from 'react'

interface PixelBurnEffectProps {
  isActive: boolean
  width: number
  height: number
  onComplete?: () => void
}

interface PixelGrid {
  x: number
  y: number
  delay: number
  color: string
}

export function PixelBurnEffect({ 
  isActive, 
  width, 
  height, 
  onComplete 
}: PixelBurnEffectProps) {
  const [pixels, setPixels] = useState<PixelGrid[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isActive) return

    // Create pixel grid
    const pixelSize = 4
    const cols = Math.floor(width / pixelSize)
    const rows = Math.floor(height / pixelSize)
    const newPixels: PixelGrid[] = []

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        // Create wave pattern for delay
        const centerX = cols / 2
        const centerY = rows / 2
        const distance = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        )
        const maxDistance = Math.sqrt(
          Math.pow(centerX, 2) + Math.pow(centerY, 2)
        )
        const normalizedDistance = distance / maxDistance
        
        // Random color from flame palette
        const colors = [
          '#FF6B35',
          '#FF4500',
          '#FFA500',
          '#0052FF',
          '#27272A'
        ]
        const color = colors[Math.floor(Math.random() * colors.length)]
        
        newPixels.push({
          x: x * pixelSize,
          y: y * pixelSize,
          delay: normalizedDistance * 500 + Math.random() * 200,
          color
        })
      }
    }

    setPixels(newPixels)

    // Trigger completion after animation
    const timer = setTimeout(() => {
      if (onComplete) onComplete()
    }, 1000)

    return () => clearTimeout(timer)
  }, [isActive, width, height, onComplete])

  useEffect(() => {
    if (!canvasRef.current || pixels.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw pixels with animation
    let animationFrame: number

    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height)

      pixels.forEach((pixel) => {
        const progress = Math.min((timestamp - pixel.delay) / 500, 1)
        if (progress > 0) {
          const opacity = 1 - progress
          const scale = 1 + progress * 2
          const rotation = progress * Math.PI * 2

          ctx.save()
          ctx.globalAlpha = opacity
          ctx.fillStyle = pixel.color
          ctx.translate(pixel.x + 2, pixel.y + 2)
          ctx.rotate(rotation)
          ctx.scale(scale, scale)
          ctx.fillRect(-2, -2, 4, 4)
          ctx.restore()
        }
      })

      if (pixels.some(p => (timestamp - p.delay) / 500 < 1)) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [pixels, width, height])

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-50"
      style={{
        mixBlendMode: 'screen'
      }}
    />
  )
}

interface BurnTextEffectProps {
  text: string
  isActive: boolean
}

export function BurnTextEffect({ text, isActive }: BurnTextEffectProps) {
  const [displayText, setDisplayText] = useState(text)
  const [glitchText, setGlitchText] = useState(text)

  useEffect(() => {
    if (!isActive) {
      setDisplayText(text)
      return
    }

    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
    let iteration = 0
    const maxIterations = 20

    const interval = setInterval(() => {
      if (iteration < maxIterations) {
        setGlitchText(
          text
            .split('')
            .map((char, index) => {
              if (Math.random() > 0.5 || iteration < 10) {
                return glitchChars[Math.floor(Math.random() * glitchChars.length)]
              }
              return char
            })
            .join('')
        )
        iteration++
      } else {
        clearInterval(interval)
        setGlitchText(text)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [isActive, text])

  return (
    <span
      className={`
        inline-block transition-all duration-300
        ${isActive ? 'text-flame-500 animate-pulse' : ''}
      `}
      style={{
        textShadow: isActive
          ? `0 0 10px rgba(255, 107, 53, 0.8), 
             0 0 20px rgba(255, 107, 53, 0.6),
             0 0 30px rgba(255, 107, 53, 0.4)`
          : 'none'
      }}
    >
      {isActive ? glitchText : displayText}
    </span>
  )
}

export function PixelDisintegrate({ 
  children, 
  isActive 
}: { 
  children: React.ReactNode
  isActive: boolean 
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDimensions({ width: rect.width, height: rect.height })
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`
          transition-all duration-700
          ${isActive ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        `}
      >
        {children}
      </div>
      {isActive && dimensions.width > 0 && (
        <PixelBurnEffect
          isActive={isActive}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}
    </div>
  )
}