'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/authService'

export function useSecuriteModal() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function changePassword() {
    if (!user?.email) { setError('Session expirée, veuillez vous reconnecter.'); return }
    if (newPassword.length < 6) { setError('Le nouveau mot de passe doit faire au moins 6 caractères.'); return }
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      // Vérifie l'ancien mot de passe via re-authentification
      await authService.signIn(user.email, currentPassword)
      await authService.updatePassword(newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return { currentPassword, setCurrentPassword, newPassword, setNewPassword, loading, error, success, changePassword }
}
