import { useEffect, useState } from 'react'

export function useToastItem(id: string, onDismiss: (id: string) => void) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(id), 300)
    }, 4000)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  const dismiss = () => {
    setVisible(false)
    setTimeout(() => onDismiss(id), 300)
  }

  return { visible, dismiss }
}
