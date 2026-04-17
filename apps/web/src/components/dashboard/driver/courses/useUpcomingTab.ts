'use client'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function labelDay(d: Date, today: Date, tomorrow: Date) {
  if (sameDay(d, today)) return `Aujourd'hui · ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
  if (sameDay(d, tomorrow)) return `Demain · ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export interface DayGroup {
  key: string
  label: string
  total: number
  missions: Mission[]
}

export function useUpcomingTab() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    missionService.getAgenda(user.id)
      .then(setMissions)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [user])

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const upcoming = useMemo(
    () => missions.filter((m) => new Date(m.scheduled_at).getTime() >= today.getTime()),
    [missions, today]
  )

  const groups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, Mission[]>()
    for (const m of upcoming) {
      const d = new Date(m.scheduled_at)
      const key = d.toDateString()
      const list = map.get(key) ?? []
      list.push(m)
      map.set(key, list)
    }
    return Array.from(map.entries())
      .map(([key, list]) => {
        const d = new Date(list[0].scheduled_at)
        return {
          key,
          label: labelDay(d, today, tomorrow),
          total: list.reduce((s, m) => s + Number(m.price_eur ?? 0), 0),
          missions: list.sort(
            (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
          ),
        }
      })
      .sort((a, b) => new Date(a.missions[0].scheduled_at).getTime() - new Date(b.missions[0].scheduled_at).getTime())
  }, [upcoming, today, tomorrow])

  const next = upcoming[0]
  const nextInMinutes = next ? Math.max(Math.round((new Date(next.scheduled_at).getTime() - Date.now()) / 60_000), 0) : null
  const todayTotal = groups.find((g) => g.key === today.toDateString())?.total ?? 0
  const todayCount = groups.find((g) => g.key === today.toDateString())?.missions.length ?? 0
  const tomorrowTotal = groups.find((g) => g.key === tomorrow.toDateString())?.total ?? 0
  const tomorrowCount = groups.find((g) => g.key === tomorrow.toDateString())?.missions.length ?? 0

  return {
    loading, error, groups,
    next, nextInMinutes,
    todayTotal, todayCount,
    tomorrowTotal, tomorrowCount,
  }
}
