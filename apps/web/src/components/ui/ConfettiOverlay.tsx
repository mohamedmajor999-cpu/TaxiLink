'use client'

import { useEffect } from 'react'

interface Particle {
  id: number
  x: number
  delay: number
  duration: number
  size: number
  color: string
  rotation: number
  shape: 'square' | 'circle'
  drift: number
}

const COLORS = [
  '#FFD23F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
]

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rand(0, 100),
    delay: rand(0, 1200),
    duration: rand(1800, 3400),
    size: rand(6, 14),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: rand(0, 360),
    shape: Math.random() > 0.5 ? 'square' : 'circle',
    drift: rand(-60, 60),
  }))
}

const PARTICLES = makeParticles(120)

const KEYFRAMES = `
@keyframes confetti-fall {
  0% {
    transform: translateY(-10vh) rotate(0deg) translateX(0px);
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotate(720deg) translateX(var(--drift));
    opacity: 0;
  }
}
`

export function ConfettiOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4600)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            style={
              {
                position: 'absolute',
                top: 0,
                left: `${p.x}%`,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.shape === 'circle' ? '50%' : '2px',
                '--drift': `${p.drift}px`,
                animation: `confetti-fall ${p.duration}ms ease-in ${p.delay}ms both`,
                transform: `rotate(${p.rotation}deg)`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </>
  )
}
