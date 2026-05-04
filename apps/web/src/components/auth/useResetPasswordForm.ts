import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '@/services/authService'
import { isValidPassword } from '@/lib/validators'
import { computeStrengthInfo } from './passwordStrength'

type Status = 'verifying' | 'ready' | 'updating' | 'done' | 'invalid'

export function useResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

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

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) { setStatus('invalid'); setError('Lien invalide ou incomplet.'); return }
    authService.exchangeCodeForSession(code)
      .then(() => setStatus('ready'))
      .catch((err) => {
        setStatus('invalid')
        setError(err instanceof Error ? err.message : 'Lien expiré ou déjà utilisé.')
      })
  }, [searchParams])

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
