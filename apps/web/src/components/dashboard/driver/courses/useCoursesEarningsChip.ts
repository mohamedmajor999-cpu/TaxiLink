'use client'
import { useEffect, useState } from 'react'
import { useDriverStore } from '@/store/driverStore'
import { useUnseenAcceptCount } from '@/store/postedAcceptStore'
import { earningsService, type DailyEarningsStats } from '@/services/earningsService'

export type EarningsChipVariant = 'today' | 'week' | 'pendingAds'

interface ChipState {
  loading: boolean
  amount: number
  unit: 'eur' | 'count'
  label: string
}

export function useCoursesEarningsChip(variant: EarningsChipVariant): ChipState {
  const driverId = useDriverStore((s) => s.driver.id)
  const unseenAds = useUnseenAcceptCount()
  const [stats, setStats] = useState<DailyEarningsStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!driverId || variant === 'pendingAds') { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    earningsService.getDailyStats(driverId)
      .then((data) => { if (!cancelled) setStats(data) })
      .catch(() => { /* silencieux : le chip n'est pas critique */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [driverId, variant])

  if (variant === 'today') {
    return {
      loading,
      amount: stats?.todayEarnings ?? 0,
      unit: 'eur',
      label: "aujourd'hui",
    }
  }
  if (variant === 'week') {
    const week = (stats?.weekSparkline ?? []).reduce((sum, d) => sum + d.earnings, 0)
    return { loading, amount: week, unit: 'eur', label: 'cette semaine' }
  }
  // pendingAds
  return { loading: false, amount: unseenAds, unit: 'count', label: 'à voir' }
}
