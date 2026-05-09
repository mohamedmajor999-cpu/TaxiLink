import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { isValidEmail } from '@/lib/validators'
import { authService } from '@/services/authService'
import { profileService } from '@/services/profileService'
import { decodeAuthErrorReason, safeDashboardRedirect } from '@/lib/authRedirect'

export function useLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]       = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  // Affiche les erreurs venant de /auth/callback (?error=exchange&reason=...)
  // au mount — avant on bouncait silencieusement et l'user ne voyait rien.
  useEffect(() => {
    if (searchParams.get('error') !== 'exchange') return
    const reason = decodeAuthErrorReason(searchParams.get('reason'))
    setError(reason ? `Connexion échouée : ${reason}` : 'Connexion échouée. Réessaie.')
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNeedsConfirmation(false)
    setResendSent(false)
    if (!isValidEmail(email)) { setError('Adresse email invalide'); return }
    setLoading(true)
    try {
      const { user } = await authService.signIn(email, password)
      if (!user.email_confirmed_at) {
        await authService.signOut()
        setNeedsConfirmation(true)
        setError('Confirme ton adresse email avant de te connecter. Pense à vérifier tes spams ou courriers indésirables.')
        return
      }
      const role = await profileService.getRole(user.id)
      router.push(safeDashboardRedirect(redirectParam, role))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      if (msg === 'Email not confirmed') {
        setNeedsConfirmation(true)
        setError('Confirme ton adresse email avant de te connecter. Pense à vérifier tes spams ou courriers indésirables.')
      } else {
        setError(msg === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setResendSent(false)
    try {
      await authService.resendConfirmation(email)
      setResendSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du renvoi')
    } finally {
      setResendLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      // Propage le redirect via ?next= : le callback exchange-code-for-session
      // utilise ce param pour atterrir sur la cible voulue plutot que la home.
      const next = safeDashboardRedirect(redirectParam, undefined)
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      await authService.signInWithGoogle(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur Google')
      setGoogleLoading(false)
    }
  }

  return {
    email, setEmail,
    password, setPassword,
    showPw, setShowPw,
    loading, googleLoading, error,
    needsConfirmation, resendLoading, resendSent,
    handleSubmit, handleGoogle, handleResend,
  }
}
