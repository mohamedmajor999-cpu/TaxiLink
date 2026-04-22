'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDriverStore } from '@/store/driverStore'
import { profileService } from '@/services/profileService'
import { isValidPhone } from '@/lib/validators'

interface State {
  firstName: string
  lastName: string
  phone: string
  email: string
  loading: boolean
  saving: boolean
  saved: boolean
  error: string | null
  dirty: boolean
  setFirstName: (v: string) => void
  setLastName: (v: string) => void
  setPhone: (v: string) => void
  save: () => Promise<void>
}

export function useSettingsCompte(): State {
  const { user } = useAuth()
  const { updateDriver } = useDriverStore()

  const [firstName, setFirstNameState] = useState('')
  const [lastName, setLastNameState]   = useState('')
  const [phone, setPhoneState]         = useState('')
  const [initial, setInitial] = useState({ firstName: '', lastName: '', phone: '' })
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
        const fn = p.first_name ?? splitFirst(p.full_name)
        const ln = p.last_name  ?? splitLast(p.full_name)
        const ph = p.phone ?? ''
        setFirstNameState(fn)
        setLastNameState(ln)
        setPhoneState(ph)
        setInitial({ firstName: fn, lastName: ln, phone: ph })
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur de chargement')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  const dirty =
    firstName !== initial.firstName ||
    lastName  !== initial.lastName  ||
    phone     !== initial.phone

  const save = async () => {
    if (!user) return
    setError(null)
    if (firstName.trim().length < 2) { setError('Prénom : 2 caractères minimum'); return }
    if (lastName.trim().length < 2)  { setError('Nom : 2 caractères minimum'); return }
    if (phone && !isValidPhone(phone)) {
      setError('Format de téléphone invalide (ex: 0601020304)')
      return
    }
    setSaving(true)
    try {
      const first = firstName.trim()
      const last  = lastName.trim()
      await profileService.updateProfile(user.id, {
        first_name: first,
        last_name:  last,
        phone: phone.trim() || undefined,
      })
      updateDriver({ name: `${first} ${last}`, phone: phone.trim() || undefined })
      setInitial({ firstName: first, lastName: last, phone: phone.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l’enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return {
    firstName,
    lastName,
    phone,
    email: user?.email ?? '',
    loading,
    saving,
    saved,
    error,
    dirty,
    setFirstName: setFirstNameState,
    setLastName:  setLastNameState,
    setPhone:     setPhoneState,
    save,
  }
}

function splitFirst(fullName: string | null | undefined): string {
  if (!fullName) return ''
  const parts = fullName.trim().split(/\s+/)
  return parts.slice(0, -1).join(' ') || parts[0] || ''
}
function splitLast(fullName: string | null | undefined): string {
  if (!fullName) return ''
  const parts = fullName.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1] : ''
}
