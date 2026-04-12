import { useState, useEffect } from 'react'
import { paymentService } from '@/services/paymentService'
import { useAuth } from '@/hooks/useAuth'
import type { Payment } from '@/lib/supabase/types'

export function useDriverPayments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [iban, setIban] = useState('')
  const [savedIban, setSavedIban] = useState('')
  const [savingIban, setSavingIban] = useState(false)
  const [ibanSaved, setIbanSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    paymentService.getPayments(user.id).then((data) => {
      setPayments(data)
      const lastIban = data.find((p) => p.iban)?.iban ?? ''
      setIban(lastIban)
      setSavedIban(lastIban)
      setLoading(false)
    })
  }, [user])

  const handleSaveIban = async () => {
    if (!user) return
    setSavingIban(true)
    await paymentService.updateIBAN(user.id, iban)
    setSavedIban(iban)
    setSavingIban(false)
    setIbanSaved(true)
    setTimeout(() => setIbanSaved(false), 2500)
  }

  const totalPaid    = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount_eur, 0)
  const totalPending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount_eur, 0)

  return { payments, loading, iban, setIban, savedIban, savingIban, ibanSaved, handleSaveIban, totalPaid, totalPending }
}
