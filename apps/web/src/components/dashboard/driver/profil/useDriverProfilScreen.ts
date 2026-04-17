'use client'
import { useMemo } from 'react'
import { useDriverStore } from '@/store/driverStore'
import { useDriverStats } from '../useDriverStats'

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function startOfWeek(d: Date) {
  const copy = new Date(d)
  const day = copy.getDay() || 7
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() - (day - 1))
  return copy
}

export function useDriverProfilScreen(driverName: string) {
  const { driver } = useDriverStore()
  const { missions, loading } = useDriverStats()

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
    const lastMonth = missions.filter((m) => {
      const d = new Date(m.completed_at ?? m.scheduled_at)
      const ref = new Date(year, month - 1, 1)
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
    })
    const revenue = thisMonth.reduce((s, m) => s + Number(m.price_eur ?? 0), 0)
    const lastRevenue = lastMonth.reduce((s, m) => s + Number(m.price_eur ?? 0), 0)
    const delta = lastRevenue > 0 ? Math.round(((revenue - lastRevenue) / lastRevenue) * 100) : null

    const weeks = [0, 1, 2, 3].map((i) => {
      const start = startOfWeek(new Date(year, month, 1 + i * 7))
      const end = new Date(start); end.setDate(end.getDate() + 7)
      const total = thisMonth
        .filter((m) => {
          const d = new Date(m.completed_at ?? m.scheduled_at)
          return d >= start && d < end
        })
        .reduce((s, m) => s + Number(m.price_eur ?? 0), 0)
      return { label: `S${i + 1}`, value: total }
    })

    return {
      monthLabel: `${MONTHS_FR[month]} ${year}`,
      revenue,
      delta,
      courseCount: thisMonth.length,
      kmTotal: thisMonth.reduce((s, m) => s + Number(m.distance_km ?? 0), 0),
      weeks,
    }
  }, [missions])

  return {
    loading,
    driver,
    initials,
    fullName: driverName || 'Chauffeur',
    monthlyStats,
  }
}
