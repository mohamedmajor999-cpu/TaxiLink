'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { missionService } from '@/services/missionService'
import { useMissionRealtime } from '@/hooks/useMissionRealtime'
import type { Mission } from '@/lib/supabase/types'
import { sameDay, addDays, toEvent } from './agendaHelpers'

export type { AgendaEvent, AgendaEventStatus } from './agendaHelpers'

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

  const today = new Date()
  const dayPills = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i - 1)
      const label = i === 0 ? 'Hier'
        : i === 1 ? "Aujourd'hui"
        : i === 2 ? 'Demain'
        : d.toLocaleDateString('fr-FR', { weekday: 'long' })
      const subLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      return { date: d, label, subLabel, key: d.toDateString() }
    })
  }, [today])

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

  const title = selected.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return {
    loading, error,
    selected, setSelected,
    dayPills, events, stats, title,
    showAddModal, setShowAddModal,
    openDetails, addMission,
  }
}
