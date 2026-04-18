'use client'
import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'taxilink.voice.tip'

export function useVoiceTipCard() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY) === 'hidden') setVisible(false)
  }, [])

  const hide = useCallback(() => {
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, 'hidden') } catch { /* noop */ }
  }, [])

  const show = useCallback(() => {
    setVisible(true)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* noop */ }
  }, [])

  return { visible, hide, show }
}
