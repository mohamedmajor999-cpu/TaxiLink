import { useEffect, useState } from 'react'

const DEFAULT_DURATION_MS = 4000

export function useToastItem(id: string, onDismiss: (id: string) => void, duration?: number) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(id), 300)
    }, duration ?? DEFAULT_DURATION_MS)
    return () => clearTimeout(timer)
  }, [id, onDismiss, duration])

  const dismiss = () => {
    setVisible(false)
    setTimeout(() => onDismiss(id), 300)
  }

  return { visible, dismiss }
}
