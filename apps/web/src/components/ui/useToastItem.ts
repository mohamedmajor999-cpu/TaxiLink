import { useEffect, useRef, useState } from 'react'

const DEFAULT_DURATION_MS = 4000
const FADE_OUT_MS = 300

export function useToastItem(id: string, onDismiss: (id: string) => void, duration?: number) {
  const [visible, setVisible] = useState(false)
  // Le 2eme timer (fade-out -> onDismiss) etait orphelin : si le toast etait
  // demonte pendant la transition, le callback firait apres unmount et le
  // timer n'etait jamais cleare. On le track dans une ref pour cleanup propre.
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      dismissTimerRef.current = setTimeout(() => onDismiss(id), FADE_OUT_MS)
    }, duration ?? DEFAULT_DURATION_MS)
    return () => {
      clearTimeout(timer)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [id, onDismiss, duration])

  const dismiss = () => {
    setVisible(false)
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    dismissTimerRef.current = setTimeout(() => onDismiss(id), FADE_OUT_MS)
  }

  return { visible, dismiss }
}
