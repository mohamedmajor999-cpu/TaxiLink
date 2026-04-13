import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import { isSameMonth } from '@/lib/utils'
import { computeStats } from '@/lib/statsUtils'
import type { Mission } from '@/lib/supabase/types'

export function useDriverStats() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

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

  return { missions, loading, error, periods, byType, loadStats }
}
