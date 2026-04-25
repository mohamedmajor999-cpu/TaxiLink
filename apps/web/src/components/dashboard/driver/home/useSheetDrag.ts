'use client'
import { useEffect, useRef, type RefObject } from 'react'

// Fractions de la hauteur d'ecran : 1/5, 2/5, 3/5, 4/5. Default = two.
export type SheetSnap = 'one' | 'two' | 'three' | 'four'
export const SHEET_FRACTION: Record<SheetSnap, number> = { one: 0.2, two: 0.4, three: 0.6, four: 0.8 }
const TAP_THRESHOLD_PX = 6

const TAP_CYCLE: Record<SheetSnap, SheetSnap> = { two: 'three', three: 'four', four: 'one', one: 'two' }
const SNAPS: SheetSnap[] = ['one', 'two', 'three', 'four']

export function useSheetDrag(
  snap: SheetSnap,
  onSnapChange: (s: SheetSnap) => void,
  sheetRef: RefObject<HTMLElement | null>,
  vh: number,
) {
  const handleRef = useRef<HTMLDivElement | null>(null)
  const snapRef = useRef(snap)
  const onSnapChangeRef = useRef(onSnapChange)
  const sheetRefRef = useRef(sheetRef)
  const vhRef = useRef(vh)
  snapRef.current = snap
  onSnapChangeRef.current = onSnapChange
  sheetRefRef.current = sheetRef
  vhRef.current = vh

  useEffect(() => {
    const el = handleRef.current
    if (!el) return
    let startY: number | null = null
    let offsetY = 0
    let baseHeight = 0
    let dragged = false

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    const onMove = (e: PointerEvent) => {
      if (startY == null) return
      offsetY = e.clientY - startY
      if (Math.abs(offsetY) > TAP_THRESHOLD_PX) dragged = true
      const sheetEl = sheetRefRef.current.current
      const v = vhRef.current
      if (!sheetEl || v <= 0) return
      const target = baseHeight - offsetY // up = grandit, down = retrecit
      const minH = v * SHEET_FRACTION.one
      const maxH = v * SHEET_FRACTION.four
      const clamped = Math.max(minH, Math.min(maxH, target))
      sheetEl.style.transition = 'none'
      sheetEl.style.height = `${clamped}px`
    }
    const onUp = () => {
      if (startY == null) return
      const lastOffset = offsetY
      const wasDragged = dragged
      startY = null
      offsetY = 0
      dragged = false
      cleanup()
      const s = snapRef.current
      const sheetEl = sheetRefRef.current.current
      const v = vhRef.current
      let newSnap: SheetSnap
      if (!wasDragged) {
        newSnap = TAP_CYCLE[s]
      } else if (v <= 0) {
        newSnap = lastOffset > 0 ? prevSnap(s) : nextSnap(s)
      } else {
        const finalFrac = (baseHeight - lastOffset) / v
        newSnap = SNAPS.reduce((best, c) =>
          Math.abs(SHEET_FRACTION[c] - finalFrac) < Math.abs(SHEET_FRACTION[best] - finalFrac) ? c : best,
        s)
      }
      // Re-active la transition + applique la cible : anime depuis la hauteur de drag courante.
      // React reposera la meme valeur au prochain render via la prop style, donc pas de saut.
      if (sheetEl && v > 0) {
        sheetEl.style.transition = ''
        sheetEl.style.height = `${Math.round(v * SHEET_FRACTION[newSnap])}px`
      }
      onSnapChangeRef.current(newSnap)
    }
    const onDown = (e: PointerEvent) => {
      startY = e.clientY
      offsetY = 0
      dragged = false
      const sheetEl = sheetRefRef.current.current
      baseHeight = sheetEl ? sheetEl.getBoundingClientRect().height : 0
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

function nextSnap(s: SheetSnap): SheetSnap {
  const i = SNAPS.indexOf(s)
  return SNAPS[Math.min(SNAPS.length - 1, i + 1)]
}
function prevSnap(s: SheetSnap): SheetSnap {
  const i = SNAPS.indexOf(s)
  return SNAPS[Math.max(0, i - 1)]
}
