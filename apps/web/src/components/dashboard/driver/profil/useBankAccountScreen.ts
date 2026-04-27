'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { paymentService } from '@/services/paymentService'
import { isValidIban, formatIban } from '@/lib/authValidators'

export function useBankAccountScreen() {
  const { user } = useAuth()
  const [iban, setIban] = useState('')
  const [savedIban, setSavedIban] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    paymentService.getPayments(user.id)
      .then((payments) => {
        if (cancelled) return
        const lastIban = payments.find((p) => p.iban)?.iban ?? ''
        const formatted = lastIban ? formatIban(lastIban) : ''
        setIban(formatted)
        setSavedIban(formatted)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur de chargement')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  const dirty = iban.replace(/\s/g, '') !== savedIban.replace(/\s/g, '')

  const onChange = (raw: string) => {
    setSaved(false)
    setError(null)
    setIban(formatIban(raw))
  }

  const save = async () => {
    if (!user) return
    const cleaned = iban.replace(/\s/g, '').toUpperCase()
    if (!isValidIban(cleaned)) {
      setError('IBAN invalide. Vérifie les chiffres et la clé de contrôle.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await paymentService.updateIBAN(user.id, cleaned)
      setSavedIban(formatIban(cleaned))
      setIban(formatIban(cleaned))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l’enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const last4 = savedIban.replace(/\s/g, '').slice(-4)

  return { iban, onChange, save, loading, saving, saved, dirty, error, last4, hasIban: savedIban.length > 0 }
}
