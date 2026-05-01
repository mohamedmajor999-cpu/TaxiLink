'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'
import {
  filterByPeriod, filterByType, filterByQuery,
  buildGroups, exportCsv, fareValue,
  type Period, type HistoryTypeFilter, type MonthGroup,
} from './historyHelpers'

// Re-exports pour compat avec les consommateurs (HistoryTab, tests).
export type { Period, HistoryTypeFilter, MonthGroup }

export function useHistoryTab() {
  const { user } = useAuth()
  const router = useRouter()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('all')
  const [typeFilter, setTypeFilter] = useState<HistoryTypeFilter>('ALL')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!user) return
    missionService
      .getDoneByDriver(user.id)
      .then(setMissions)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [user])

  const periodFiltered = useMemo(() => filterByPeriod(missions, period), [missions, period])
  const typeFiltered = useMemo(() => filterByType(periodFiltered, typeFilter), [periodFiltered, typeFilter])
  const filtered = useMemo(() => filterByQuery(typeFiltered, query), [typeFiltered, query])

  const stats = useMemo(
    () => ({
      total: filtered.reduce((s, m) => s + fareValue(m), 0),
      count: filtered.length,
      km: filtered.reduce((s, m) => s + Number(m.distance_km ?? 0), 0),
    }),
    [filtered]
  )

  const kpi = useMemo(() => {
    const cpamCount = filtered.filter((m) => m.type === 'CPAM').length
    const avg = filtered.length > 0 ? stats.total / filtered.length : 0
    const cpamRatio = filtered.length > 0 ? Math.round((cpamCount / filtered.length) * 100) : 0
    return { total: stats.total, count: stats.count, avgPerRide: avg, cpamRatioPct: cpamRatio }
  }, [filtered, stats])

  const groups = useMemo(() => buildGroups(filtered), [filtered])

  const handleExportCsv = useCallback(() => exportCsv(filtered), [filtered])

  const openDetail = useCallback(
    (id: string) => router.push('/dashboard/chauffeur/mission/' + id),
    [router]
  )

  return {
    loading, error,
    period, setPeriod,
    typeFilter, setTypeFilter,
    query, setQuery,
    missions, filtered, stats, kpi, groups,
    handleExportCsv, openDetail,
  }
}
