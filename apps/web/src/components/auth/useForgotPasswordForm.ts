import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authService } from '@/services/authService'
import { decodeAuthErrorReason } from '@/lib/authRedirect'

export function useForgotPasswordForm() {
  const searchParams = useSearchParams()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  // Affiche les erreurs renvoyees par /auth/callback quand l'echange du code
  // de recovery echoue (lien expire ou deja consomme).
  useEffect(() => {
    if (searchParams.get('error') !== 'exchange') return
    const reason = decodeAuthErrorReason(searchParams.get('reason'))
    setError(reason
      ? `Lien expiré ou déjà utilisé : ${reason}. Demande un nouveau lien.`
      : 'Lien expiré ou déjà utilisé. Demande un nouveau lien.')
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authService.resetPassword(email, `${window.location.origin}/auth/callback?next=/auth/reset-password`)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return { email, setEmail, loading, sent, error, handleSubmit }
}
