'use client'

import { useState, useEffect, useMemo } from 'react'
import { missionService } from '@/services/missionService'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { useAuth } from '@/hooks/useAuth'
import { isSameMonth } from '@/lib/utils'
import { computeStats } from '@/lib/statsUtils'
import type { Mission } from '@/lib/supabase/types'
import { StatsPeriodGrid } from './StatsPeriodGrid'
import { StatsTypeBreakdown } from './StatsTypeBreakdown'
import { StatsRecentList } from './StatsRecentList'

export function DriverStats() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    if (!user) return
    try {
      setError(null)
      setMissions(await missionService.getDoneByDriver(user.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les statistiques')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [user])

  const { todayMissions, thisMonthMissions } = useMemo(() => {
    const todayStr = new Date().toDateString()
    const now = new Date()
    return {
      todayMissions:     missions.filter((m) => new Date(m.completed_at ?? m.scheduled_at).toDateString() === todayStr),
      thisMonthMissions: missions.filter((m) => isSameMonth(new Date(m.completed_at ?? m.scheduled_at), now)),
    }
  }, [missions])

  const periods = [
    { label: "Aujourd'hui", ...computeStats(todayMissions) },
    { label: 'Ce mois',     ...computeStats(thisMonthMissions) },
    { label: 'Total',       ...computeStats(missions) },
  ]

  const byType = useMemo(
    () => ['CPAM', 'PRIVE', 'TAXILINK'].map((t) => {
      const subset = missions.filter((m) => m.type === t)
      return { type: t, count: subset.length, earnings: subset.reduce((s, m) => s + (m.price_eur ?? 0), 0) }
    }),
    [missions]
  )

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-black text-secondary mb-1">Statistiques</h2>
        <p className="text-muted text-sm">Votre performance en un coup d'œil</p>
      </div>
      {error && <ErrorBanner message={error} onRetry={loadStats} />}
      {loading ? (
        <SkeletonLoader count={3} height="h-36" />
      ) : (
        <>
          <StatsPeriodGrid periods={periods} />
          <StatsTypeBreakdown byType={byType} total={missions.length} />
          <StatsRecentList missions={missions} />
        </>
      )}
    </div>
  )
}
