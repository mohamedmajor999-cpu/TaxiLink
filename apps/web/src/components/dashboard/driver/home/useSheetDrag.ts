'use client'
import { useEffect, useRef } from 'react'

export type SheetSnap = 'collapsed' | 'default' | 'expanded'
const DRAG_THRESHOLD_PX = 30

const NEXT_UP: Record<SheetSnap, SheetSnap> = { collapsed: 'default', default: 'expanded', expanded: 'expanded' }
const NEXT_DOWN: Record<SheetSnap, SheetSnap> = { expanded: 'default', default: 'collapsed', collapsed: 'collapsed' }
const TAP_CYCLE: Record<SheetSnap, SheetSnap> = { collapsed: 'default', default: 'expanded', expanded: 'collapsed' }

export function useSheetDrag(snap: SheetSnap, onSnapChange: (s: SheetSnap) => void) {
  const handleRef = useRef<HTMLDivElement | null>(null)
  const snapRef = useRef(snap)
  const onSnapChangeRef = useRef(onSnapChange)
  snapRef.current = snap
  onSnapChangeRef.current = onSnapChange

  useEffect(() => {
    const el = handleRef.current
    if (!el) return
    let startY: number | null = null
    let offsetY = 0

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    const onMove = (e: PointerEvent) => { if (startY != null) offsetY = e.clientY - startY }
    const onUp = () => {
      if (startY == null) return
      const delta = offsetY
      startY = null
      offsetY = 0
      cleanup()
      const s = snapRef.current
      if (Math.abs(delta) < DRAG_THRESHOLD_PX) {
        onSnapChangeRef.current(TAP_CYCLE[s])
        return
      }
      onSnapChangeRef.current(delta > 0 ? NEXT_DOWN[s] : NEXT_UP[s])
    }
    const onDown = (e: PointerEvent) => {
      startY = e.clientY
      offsetY = 0
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
      e.preventDefault()
    }

    el.addEventListener('pointerdown', onDown)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      cleanup()
    }
  }, [])

  return handleRef
}
