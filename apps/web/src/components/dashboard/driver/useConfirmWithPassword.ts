import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

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
      const supabase = createClient()
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email:    user.email,
        password: password.trim(),
      })
      if (authErr) {
        setError('Mot de passe incorrect')
        return
      }
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
