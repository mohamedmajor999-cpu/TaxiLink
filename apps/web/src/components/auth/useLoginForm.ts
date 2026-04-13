import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isValidEmail } from '@/lib/validators'
import { authService } from '@/services/authService'
import { profileService } from '@/services/profileService'

export function useLoginForm() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isValidEmail(email)) { setError('Adresse email invalide'); return }
    setLoading(true)
    try {
      const { user } = await authService.signIn(email, password)
      const role = await profileService.getRole(user.id)
      router.push(role === 'driver' ? '/dashboard/chauffeur' : '/dashboard/client')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(msg === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : msg)
    } finally {
      setLoading(false)
    }
  }

  return { email, setEmail, password, setPassword, showPw, setShowPw, loading, error, handleSubmit }
}
