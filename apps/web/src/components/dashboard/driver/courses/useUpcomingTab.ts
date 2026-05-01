'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import type { Mission } from '@/lib/supabase/types'

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

// Une course est "depassee" quand son heure de fin estimee + 60 min de
// tolerance est dans le passe. Aligne avec le cron auto_complete_overdue_missions
// (cf. 20260501_missions_auto_complete_cron.sql) — protege l'UI le temps que
// le cron tourne, et masque aussi les courses ACCEPTED (manuelles) oubliees.
const OVERDUE_TOLERANCE_MS = 60 * 60_000

function isOverdue(m: Mission, now: number): boolean {
  const start = new Date(m.scheduled_at).getTime()
  const durationMin = Math.max(m.duration_min ?? Math.round((m.distance_km ?? 0) * 2.2), 15)
  const end = start + durationMin * 60_000
  return end + OVERDUE_TOLERANCE_MS < now
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
  const router = useRouter()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const openDetails = useCallback(
    (id: string) => router.push(`/dashboard/chauffeur/mission/${id}`),
    [router]
  )

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

  // Course en cours = la mission IN_PROGRESS la plus recente. On la sort de
  // l'agenda principal pour l'afficher en hero "Course en cours" (cf.
  // CurrentCourseStrip dans UpcomingTab).
  const current = useMemo(
    () => missions.find((m) => m.status === 'IN_PROGRESS') ?? null,
    [missions],
  )

  const upcoming = useMemo(
    () => {
      const nowMs = now.getTime()
      return missions.filter(
        (m) =>
          m.status !== 'IN_PROGRESS'
          && new Date(m.scheduled_at).getTime() >= today.getTime()
          && !isOverdue(m, nowMs),
      )
    },
    [missions, today, now]
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
  const nextInMinutes = next
    ? Math.max(Math.round((new Date(next.scheduled_at).getTime() - Date.now()) / 60_000), 0)
    : null
  const todayTotal = groups.find((g) => g.key === today.toDateString())?.total ?? 0
  const todayCount = groups.find((g) => g.key === today.toDateString())?.missions.length ?? 0
  const tomorrowTotal = groups.find((g) => g.key === tomorrow.toDateString())?.total ?? 0
  const tomorrowCount = groups.find((g) => g.key === tomorrow.toDateString())?.missions.length ?? 0

  return {
    loading, error, groups,
    current,
    next, nextInMinutes,
    todayTotal, todayCount,
    tomorrowTotal, tomorrowCount,
    openDetails,
  }
}
