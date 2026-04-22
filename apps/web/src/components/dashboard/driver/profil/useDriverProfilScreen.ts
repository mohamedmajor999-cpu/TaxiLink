'use client'
import { useEffect, useMemo, useState } from 'react'
import { useDriverStore } from '@/store/driverStore'
import { useAuth } from '@/hooks/useAuth'
import { driverService } from '@/services/driverService'
import { useDriverStats } from '../useDriverStats'

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export function useDriverProfilScreen(driverName: string) {
  const { driver } = useDriverStore()
  const { user } = useAuth()
  const { missions, loading } = useDriverStats()
  const [proNumber, setProNumber] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    driverService.getDriver(user.id)
      .then((d) => {
        if (cancelled || !d) return
        setProNumber(d.pro_number)
        setIsVerified(d.is_verified)
      })
      .catch(() => { /* silencieux : hero retombe sur valeurs par défaut */ })
    return () => { cancelled = true }
  }, [user])

  const initials = useMemo(() => {
    return driverName.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'YB'
  }, [driverName])

  const monthlyStats = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    const thisMonth = missions.filter((m) => {
      const d = new Date(m.completed_at ?? m.scheduled_at)
      return d.getFullYear() === year && d.getMonth() === month
    })
    const lastMonthDate = new Date(year, month - 1, 1)
    const lastMonth = missions.filter((m) => {
      const d = new Date(m.completed_at ?? m.scheduled_at)
      return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth()
    })

    const revenue = thisMonth.reduce((s, m) => s + Number(m.price_eur ?? 0), 0)
    const lastRevenue = lastMonth.reduce((s, m) => s + Number(m.price_eur ?? 0), 0)
    const delta = lastRevenue > 0 ? Math.round(((revenue - lastRevenue) / lastRevenue) * 100) : null

    return {
      monthLabel: `${MONTHS_FR[month]} ${year}`,
      previousMonthLabel: MONTHS_FR[lastMonthDate.getMonth()],
      revenue,
      delta,
      courseCount: thisMonth.length,
    }
  }, [missions])

  return {
    loading,
    driver,
    initials,
    fullName: driverName || 'Chauffeur',
    monthlyStats,
    proNumber,
    isVerified,
  }
}
