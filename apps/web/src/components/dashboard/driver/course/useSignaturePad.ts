'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

// Capture de signature a la souris ou au tactile sur un canvas.
// Retourne ce qu'il faut pour brancher un <canvas ref={canvasRef}> et 2
// boutons (Effacer / Valider). Le `toDataUrl` produit un PNG transparent.

export function useSignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  // Adapter le devicePixelRatio pour eviter une signature floue retina/high-dpi.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.4
    ctx.strokeStyle = '#000'
  }, [])

  const point = useCallback((e: PointerEvent | React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    canvas.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const p = point(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }, [point])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const p = point(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    if (!hasInk) setHasInk(true)
  }, [point, hasInk])

  const onPointerUp = useCallback(() => { drawingRef.current = false }, [])

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
  }, [])

  const toDataUrl = useCallback((): string | null => {
    if (!hasInk) return null
    return canvasRef.current?.toDataURL('image/png') ?? null
  }, [hasInk])

  return {
    canvasRef,
    hasInk,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    clear,
    toDataUrl,
  }
}
