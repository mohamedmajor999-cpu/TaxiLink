'use client'
import { useEffect, useState } from 'react'
import { useDriverStore } from '@/store/driverStore'
import { earningsService, type DailyEarningsStats } from '@/services/earningsService'

const DAILY_OBJECTIVE_EUR = 200

export function useCoursesEarningsHero() {
  const driverId = useDriverStore((s) => s.driver.id)
  const [stats, setStats] = useState<DailyEarningsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!driverId) return
    let cancelled = false
    setLoading(true)
    earningsService.getDailyStats(driverId)
      .then((data) => { if (!cancelled) { setStats(data); setError(null) } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Erreur stats') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [driverId])

  const todayEarnings = stats?.todayEarnings ?? 0
  const yesterdayEarnings = stats?.yesterdayEarnings ?? 0
  const deltaPct = yesterdayEarnings > 0
    ? Math.round(((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100)
    : null
  const objective = DAILY_OBJECTIVE_EUR
  const objectiveProgressPct = Math.min(100, Math.round((todayEarnings / objective) * 100))

  return {
    loading,
    error,
    todayEarnings,
    todayCount: stats?.todayCount ?? 0,
    yesterdayEarnings,
    deltaPct,
    weekSparkline: stats?.weekSparkline ?? [],
    objective,
    objectiveProgressPct,
  }
}
