'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { paymentService } from '@/services/paymentService'
import type { Payment } from '@/lib/supabase/types'

export function usePaiementsModal() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    paymentService.getPayments(user.id)
      .then(setPayments)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  const now = new Date()

  const thisMonth = payments
    .filter((p) => {
      const d = new Date(p.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, p) => s + p.amount_eur, 0)

  const today = payments
    .filter((p) => new Date(p.created_at).toDateString() === now.toDateString())
    .reduce((s, p) => s + p.amount_eur, 0)

  return { payments, loading, error, thisMonth, today }
}
