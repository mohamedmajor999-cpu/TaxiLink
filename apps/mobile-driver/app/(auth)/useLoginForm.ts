import { useState } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'

import { authService, reportError } from '@taxilink/services'

export interface LoginFormState {
  email: string
  password: string
  showPw: boolean
  loading: boolean
  googleLoading: boolean
  resendLoading: boolean
  resendSent: boolean
  error: string | null
  needsConfirmation: boolean
}

export function useLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit() {
    if (!email || !password) {
      setError('Email et mot de passe requis.')
      return
    }
    setLoading(true)
    setError(null)
    setNeedsConfirmation(false)
    try {
      await authService.signIn(email.trim().toLowerCase(), password)
      // Navigation : router.replace pour ne pas garder /login dans le back stack.
      // Le (driver)/_layout fera l'auth check et chargera le dashboard.
      router.replace('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion.'
      // Detection email non confirme (texte localise par Supabase, robuste sur les 2 langues).
      if (/confirm/i.test(msg) || /verifie/i.test(msg)) {
        setNeedsConfirmation(true)
      } else {
        setError(translateAuthError(msg))
      }
      reportError(err, { tags: { phase: 'login' } })
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    // Google OAuth mobile = expo-auth-session + deep-link. A cabler en Sem 11 polish.
    // Pour Sem 2 : on indique que ce sera bientot disponible.
    Alert.alert(
      'Bientot disponible',
      'La connexion Google sur mobile arrive en Sem 11. Utilise email + mot de passe pour l’instant.',
    )
  }

  async function handleResend() {
    if (!email) return
    setResendLoading(true)
    try {
      await authService.resendConfirmation(email.trim().toLowerCase())
      setResendSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Echec de l’envoi.'
      setError(msg)
      reportError(err, { tags: { phase: 'login-resend' } })
    } finally {
      setResendLoading(false)
    }
  }

  return {
    email, setEmail,
    password, setPassword,
    showPw, togglePw: () => setShowPw((v) => !v),
    loading, googleLoading,
    resendLoading, resendSent,
    error, needsConfirmation,
    handleSubmit, handleGoogle, handleResend,
  }
}

function translateAuthError(raw: string): string {
  if (/invalid login credentials/i.test(raw)) return 'Email ou mot de passe incorrect.'
  if (/email not confirmed/i.test(raw)) return 'Email non confirme.'
  if (/network/i.test(raw)) return 'Pas de reseau. Verifie ta connexion.'
  return raw
}
