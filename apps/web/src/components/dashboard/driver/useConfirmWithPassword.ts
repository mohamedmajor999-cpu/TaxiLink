import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/authService'

export function useConfirmWithPassword(onConfirmed: () => Promise<void>, onClose: () => void) {
  const { user }                    = useAuth()
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const onConfirmedRef              = useRef(onConfirmed)
  onConfirmedRef.current            = onConfirmed

  const verify = async () => {
    if (!user?.email || !password.trim()) return
    setLoading(true)
    setError(null)
    try {
      await authService.signIn(user.email, password.trim())
    } catch {
      setError('Mot de passe incorrect')
      setLoading(false)
      return
    }
    try {
      await onConfirmedRef.current()
      onClose()
    } catch {
      setError('Une erreur est survenue, réessaie.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setPassword(''); setError(null) }

  return { password, setPassword, error, loading, verify, reset }
}
