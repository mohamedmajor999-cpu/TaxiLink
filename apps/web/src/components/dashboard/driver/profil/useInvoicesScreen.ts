'use client'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

export interface MonthGroup {
  key: string          // "2026-04"
  label: string        // "Avril 2026"
  total: number
  missions: Mission[]
}

const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function monthKeyOf(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabelOf(key: string): string {
  const [y, m] = key.split('-')
  return `${MONTH_LABELS[Number(m) - 1]} ${y}`
}

export function useInvoicesScreen() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    missionService.getDoneByDriver(user.id, 200)
      .then((list) => { if (!cancelled) setMissions(list) })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur de chargement') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  const groups = useMemo<MonthGroup[]>(() => {
    const buckets = new Map<string, Mission[]>()
    for (const m of missions) {
      const key = monthKeyOf(m.completed_at ?? m.scheduled_at)
      const arr = buckets.get(key) ?? []
      arr.push(m)
      buckets.set(key, arr)
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([key, items]) => ({
        key,
        label: monthLabelOf(key),
        total: items.reduce((s, m) => s + Number(m.price_eur ?? 0), 0),
        missions: items,
      }))
  }, [missions])

  const selectedMission = selectedId ? missions.find((m) => m.id === selectedId) ?? null : null
  const yearTotal = useMemo(() => {
    const y = new Date().getFullYear()
    return missions
      .filter((m) => new Date(m.completed_at ?? m.scheduled_at).getFullYear() === y)
      .reduce((s, m) => s + Number(m.price_eur ?? 0), 0)
  }, [missions])

  return {
    loading, error, groups, yearTotal,
    selectedMission,
    openMission: (id: string) => setSelectedId(id),
    closeMission: () => setSelectedId(null),
    print: () => { if (typeof window !== 'undefined') window.print() },
  }
}
