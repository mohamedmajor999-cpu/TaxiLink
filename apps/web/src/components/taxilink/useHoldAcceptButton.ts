'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

export type HoldState = 'idle' | 'pressing' | 'confirmed'

interface Options {
  onConfirm: () => void | Promise<void>
  duration?: number
  disabled?: boolean
}

export function useHoldAcceptButton({
  onConfirm,
  duration = 2000,
  disabled = false,
}: Options) {
  const [state, setState] = useState<HoldState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current)
      confirmTimerRef.current = null
    }
  }

  const start = useCallback(() => {
    if (disabled) return
    if (state !== 'idle') return
    setState('pressing')
    timerRef.current = setTimeout(() => {
      setState('confirmed')
      if (typeof navigator !== 'undefined') navigator.vibrate?.(50)
      // 300 ms de pause pour laisser le chauffeur voir "Course acceptée"
      // avant le pouce + confettis. Confortable sans etre lent.
      confirmTimerRef.current = setTimeout(() => void onConfirm(), 300)
    }, duration)
  }, [state, duration, onConfirm, disabled])

  const cancel = useCallback(() => {
    if (state === 'confirmed') return
    clearTimers()
    setState('idle')
  }, [state])

  useEffect(() => () => clearTimers(), [])

  return { state, start, cancel, duration }
}
