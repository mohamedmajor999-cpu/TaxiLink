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

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const start = useCallback(() => {
    if (disabled) return
    if (state !== 'idle') return
    setState('pressing')
    timerRef.current = setTimeout(() => {
      setState('confirmed')
      if (typeof navigator !== 'undefined') navigator.vibrate?.(50)
      // Déclenche onConfirm immédiatement : la pop-up de célébration (pouce + confettis)
      // démarre tout de suite. L'état 'confirmed' reste visible en parallèle.
      void onConfirm()
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
