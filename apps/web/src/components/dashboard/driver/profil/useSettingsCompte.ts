'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDriverStore } from '@/store/driverStore'
import { profileService } from '@/services/profileService'
import { isValidPhone } from '@/lib/validators'

interface State {
  fullName: string
  phone: string
  email: string
  loading: boolean
  saving: boolean
  saved: boolean
  error: string | null
  dirty: boolean
  setFullName: (v: string) => void
  setPhone: (v: string) => void
  save: () => Promise<void>
}

export function useSettingsCompte(): State {
  const { user } = useAuth()
  const { updateDriver } = useDriverStore()

  const [fullName, setFullNameState] = useState('')
  const [phone, setPhoneState]       = useState('')
  const [initial, setInitial]        = useState({ fullName: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    profileService.getProfile(user.id)
      .then((p) => {
        if (cancelled || !p) return
        const fn = p.full_name ?? ''
        const ph = p.phone ?? ''
        setFullNameState(fn)
        setPhoneState(ph)
        setInitial({ fullName: fn, phone: ph })
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur de chargement')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  const dirty = fullName !== initial.fullName || phone !== initial.phone

  const save = async () => {
    if (!user) return
    setError(null)
    if (fullName.trim().length < 2) {
      setError('Nom complet : 2 caractères minimum')
      return
    }
    if (phone && !isValidPhone(phone)) {
      setError('Format de téléphone invalide (ex: 0601020304)')
      return
    }
    setSaving(true)
    try {
      await profileService.updateProfile(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      })
      updateDriver({ name: fullName.trim(), phone: phone.trim() || undefined })
      setInitial({ fullName: fullName.trim(), phone: phone.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\u2019enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return {
    fullName,
    phone,
    email: user?.email ?? '',
    loading,
    saving,
    saved,
    error,
    dirty,
    setFullName: setFullNameState,
    setPhone: setPhoneState,
    save,
  }
}
