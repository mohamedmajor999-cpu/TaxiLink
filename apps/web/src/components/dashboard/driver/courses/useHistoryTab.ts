'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

export type Period = 'week' | 'month' | 'all'

export interface MonthGroup {
  key: string
  label: string
  total: number
  missions: Mission[]
}

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function filterByPeriod(missions: Mission[], period: Period): Mission[] {
  if (period === 'all') return missions
  const now = Date.now()
  const ms = period === 'week' ? 7 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000
  return missions.filter((m) => {
    const d = new Date(m.completed_at ?? m.scheduled_at).getTime()
    return now - d <= ms
  })
}

function exportCsv(missions: Mission[]) {
  const header = 'Date,Départ,Destination,Type,Prix (€),Distance (km)'
  const rows = missions.map((m) =>
    [
      new Date(m.completed_at ?? m.scheduled_at).toLocaleDateString('fr-FR'),
      `"${m.departure}"`,
      `"${m.destination}"`,
      m.type,
      m.price_eur ?? 0,
      m.distance_km ?? 0,
    ].join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'courses-taxilink.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function buildGroups(missions: Mission[]): MonthGroup[] {
  const map = new Map<string, Mission[]>()
  for (const m of missions) {
    const d = new Date(m.completed_at ?? m.scheduled_at)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    const list = map.get(key) ?? []
    list.push(m)
    map.set(key, list)
  }
  return Array.from(map.entries())
    .map(([key, list]) => {
      const d = new Date(list[0].completed_at ?? list[0].scheduled_at)
      return {
        key,
        label: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`.toUpperCase(),
        total: list.reduce((s, m) => s + Number(m.price_eur ?? 0), 0),
        missions: list,
      }
    })
    .sort((a, b) => b.key.localeCompare(a.key))
}

export function useHistoryTab() {
  const { user } = useAuth()
  const router = useRouter()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('all')

  useEffect(() => {
    if (!user) return
    missionService
      .getDoneByDriver(user.id)
      .then(setMissions)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [user])

  const filtered = useMemo(() => filterByPeriod(missions, period), [missions, period])

  const stats = useMemo(
    () => ({
      total: filtered.reduce((s, m) => s + Number(m.price_eur ?? 0), 0),
      count: filtered.length,
      km: filtered.reduce((s, m) => s + Number(m.distance_km ?? 0), 0),
    }),
    [filtered]
  )

  // Groups are only used for the 'all' view
  const groups = useMemo(() => buildGroups(filtered), [filtered])

  const handleExportCsv = useCallback(() => exportCsv(filtered), [filtered])

  const openDetail = useCallback(
    (id: string) => router.push('/dashboard/chauffeur/mission/' + id),
    [router]
  )

  return { loading, error, period, setPeriod, filtered, stats, groups, handleExportCsv, openDetail }
}
