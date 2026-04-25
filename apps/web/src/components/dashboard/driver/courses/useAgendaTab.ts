'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import { useMissionRealtime } from '@/hooks/useMissionRealtime'
import type { Mission } from '@/lib/supabase/types'
import { sameDay, addDays, toEvent } from './agendaHelpers'

export type { AgendaEvent, AgendaEventStatus } from './agendaHelpers'

const FR_DAY_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']

function startOfWeek(d: Date): Date {
  const r = new Date(d)
  const day = r.getDay()
  const diff = day === 0 ? -6 : 1 - day // ramene au lundi
  r.setDate(r.getDate() + diff)
  r.setHours(0, 0, 0, 0)
  return r
}

export function useAgendaTab() {
  const { user } = useAuth()
  const router = useRouter()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState(new Date())
  const [nowTick, setNowTick] = useState(Date.now())
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (!user) return
    missionService.getAgenda(user.id)
      .then(setMissions)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  useMissionRealtime({
    onUpdate: (mission) => {
      if (mission.driver_id !== user?.id) return
      setMissions((prev) => {
        if (mission.status === 'DONE') return prev.filter((m) => m.id !== mission.id)
        const exists = prev.some((m) => m.id === mission.id)
        return exists
          ? prev.map((m) => (m.id === mission.id ? mission : m))
          : [...prev, mission]
      })
    },
  })

  function addMission(m: Mission) {
    setMissions((prev) => [...prev, m])
    setSelected(new Date(m.scheduled_at))
  }

  function openDetails(id: string) {
    router.push(`/dashboard/chauffeur/mission/${id}`)
  }

  const weekStart = useMemo(() => startOfWeek(selected), [selected])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i)
    const count = missions.filter((m) => sameDay(new Date(m.scheduled_at), d)).length
    return { date: d, dayShort: FR_DAY_SHORT[d.getDay()], count, key: d.toDateString() }
  }), [weekStart, missions])

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0].date
    const end = weekDays[6].date
    if (start.getMonth() === end.getMonth()) {
      const month = end.toLocaleDateString('fr-FR', { month: 'long' })
      return `Semaine du ${start.getDate()} au ${end.getDate()} ${month}`
    }
    const ms = start.toLocaleDateString('fr-FR', { month: 'long' })
    const me = end.toLocaleDateString('fr-FR', { month: 'long' })
    return `Semaine du ${start.getDate()} ${ms} au ${end.getDate()} ${me}`
  }, [weekDays])

  const planningTitle = useMemo(() => selected
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })
    .toUpperCase(), [selected])

  const events = useMemo(() => {
    if (!user) return []
    return missions
      .filter((m) => sameDay(new Date(m.scheduled_at), selected))
      .map((m) => toEvent(m, user.id))
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [missions, selected, user, nowTick])

  const stats = useMemo(() => ({
    count: events.length,
    total: events.reduce((s, e) => s + e.priceEur, 0),
    km: missions
      .filter((m) => sameDay(new Date(m.scheduled_at), selected))
      .reduce((s, m) => s + Number(m.distance_km ?? 0), 0),
  }), [events, missions, selected])

  return {
    loading, error,
    selected, setSelected,
    weekDays, weekRangeLabel, planningTitle,
    events, stats,
    showAddModal, setShowAddModal,
    openDetails, addMission,
  }
}
