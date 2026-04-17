'use client'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

export interface MonthGroup {
  key: string
  label: string
  total: number
  missions: Mission[]
}

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export function useHistoryTab() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    missionService.getDoneByDriver(user.id)
      .then(setMissions)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [user])

  const groups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, Mission[]>()
    for (const m of missions) {
      const d = new Date(m.completed_at ?? m.scheduled_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
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
  }, [missions])

  return { loading, error, groups }
}
