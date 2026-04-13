import { useState } from 'react'
import { authService } from '@/services/authService'

export function useForgotPasswordForm() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authService.resetPassword(email, `${window.location.origin}/auth/reset-password`)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return { email, setEmail, loading, sent, error, handleSubmit }
}
