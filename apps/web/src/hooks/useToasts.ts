import { useState, useCallback } from 'react'
import type { ToastData } from '@/components/ui/Toast'

export function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((t: Omit<ToastData, 'id'>) => {
    setToasts((prev) => [...prev, { ...t, id: Date.now().toString() }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, dismissToast }
}
