import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'
import { useAuth } from '@/hooks/useAuth'
import { isValidPassword } from '@/lib/validators'
import { computeStrengthInfo } from './passwordStrength'

type Status = 'verifying' | 'ready' | 'updating' | 'done' | 'invalid'

export function useResetPasswordForm() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [status, setStatus] = useState<Status>('verifying')
  const [error, setError]   = useState('')

  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw,          setShowPw]          = useState(false)
  const [showConfirmPw,   setShowConfirmPw]   = useState(false)

  const passwordStrengthInfo = useMemo(() => computeStrengthInfo(password), [password])
  const confirmBorderClass = !confirmPassword
    ? 'border-line focus:border-accent'
    : password !== confirmPassword
    ? 'border-rose-300 focus:border-rose-400'
    : 'border-teal-300 focus:border-teal-400'

  // /auth/callback a déjà consommé le code et établi la session côté serveur
  // avant de rediriger ici. Le check ne tourne qu'UNE FOIS au mount : sinon
  // notre signOut() post-update ramène user à null et le useEffect bascule
  // l'écran en 'invalid' juste avant le redirect → faux message "lien expiré".
  const initialCheckDone = useRef(false)
  useEffect(() => {
    if (loading || initialCheckDone.current) return
    initialCheckDone.current = true
    if (user) { setStatus('ready') }
    else      { setStatus('invalid'); setError('Session de récupération introuvable. Demande un nouveau lien.') }
  }, [loading, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isValidPassword(password)) { setError('Le mot de passe doit contenir au moins 8 caractères'); return }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return }
    setStatus('updating')
    try {
      await authService.updatePassword(password)
      await authService.signOut()
      setStatus('done')
      setTimeout(() => router.push('/auth/login'), 1800)
    } catch (err) {
      setStatus('ready')
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du mot de passe')
    }
  }

  return {
    status, error,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    showPw,        togglePw:        () => setShowPw((v) => !v),
    showConfirmPw, toggleConfirmPw: () => setShowConfirmPw((v) => !v),
    passwordStrengthInfo, confirmBorderClass,
    handleSubmit,
  }
}
