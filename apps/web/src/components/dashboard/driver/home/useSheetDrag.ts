'use client'
import { useEffect, useRef } from 'react'

// Fractions de la hauteur d'ecran : 1/5, 2/5, 3/5, 4/5. Default = two.
export type SheetSnap = 'one' | 'two' | 'three' | 'four'
export const SHEET_FRACTION: Record<SheetSnap, number> = { one: 0.2, two: 0.4, three: 0.6, four: 0.8 }
const DRAG_THRESHOLD_PX = 30

const NEXT_UP: Record<SheetSnap, SheetSnap> = { one: 'two', two: 'three', three: 'four', four: 'four' }
const NEXT_DOWN: Record<SheetSnap, SheetSnap> = { four: 'three', three: 'two', two: 'one', one: 'one' }
// Tap cycle demande par l'utilisateur : 2 > 3 > 4 > 1 > 2
const TAP_CYCLE: Record<SheetSnap, SheetSnap> = { two: 'three', three: 'four', four: 'one', one: 'two' }

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
